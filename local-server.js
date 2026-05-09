/* eslint-disable no-console */
// Local dev server: runs dynalite (in-process DynamoDB emulator) + an Express
// wrapper that translates HTTP requests into API-Gateway-style events and
// invokes the same Lambda handlers used in production.

process.env.STAGE = "local";
process.env.DYNAMODB_ENDPOINT = "http://localhost:8000";
process.env.TASKS_TABLE = "CloudTasks-local";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ACCESS_KEY_ID = "local";
process.env.AWS_SECRET_ACCESS_KEY = "local";

const express = require("express");
const dynalite = require("dynalite");
const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} = require("@aws-sdk/client-dynamodb");

const createTask = require("./backend/src/handlers/createTask").handler;
const listTasks = require("./backend/src/handlers/listTasks").handler;
const updateTask = require("./backend/src/handlers/updateTask").handler;
const deleteTask = require("./backend/src/handlers/deleteTask").handler;

const DDB_PORT = 8000;
const API_PORT = 3000;
const TABLE_NAME = process.env.TASKS_TABLE;

async function startDynalite() {
  const server = dynalite({ createTableMs: 0, deleteTableMs: 0, updateTableMs: 0 });
  await new Promise((resolve, reject) =>
    server.listen(DDB_PORT, (err) => (err ? reject(err) : resolve()))
  );
  console.log(`✔ DynamoDB (dynalite) listening on http://localhost:${DDB_PORT}`);
  return server;
}

async function ensureTable() {
  const client = new DynamoDBClient({
    endpoint: `http://localhost:${DDB_PORT}`,
    region: "us-east-1",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  });
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`✔ Table "${TABLE_NAME}" already exists`);
    return;
  } catch (err) {
    if (err.name !== "ResourceNotFoundException") throw err;
  }
  await client.send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "taskId", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" },
        { AttributeName: "taskId", KeyType: "RANGE" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    })
  );
  console.log(`✔ Created table "${TABLE_NAME}"`);
}

function toEvent(req) {
  return {
    body: req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : null,
    headers: req.headers,
    queryStringParameters: req.query || {},
    pathParameters: req.params || {},
    requestContext: {},
  };
}

function wrap(handler) {
  return async (req, res) => {
    try {
      const response = await handler(toEvent(req));
      if (response.headers) {
        for (const [k, v] of Object.entries(response.headers)) res.set(k, v);
      }
      res.status(response.statusCode || 200);
      if (response.body) res.send(response.body);
      else res.end();
    } catch (err) {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

async function startApi() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-mock-user-id");
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.post("/tasks", wrap(createTask));
  app.get("/tasks", wrap(listTasks));
  app.put("/tasks/:taskId", wrap(updateTask));
  app.delete("/tasks/:taskId", wrap(deleteTask));

  await new Promise((resolve) => app.listen(API_PORT, resolve));
  console.log(`✔ API listening on http://localhost:${API_PORT}`);
}

(async () => {
  await startDynalite();
  await ensureTable();
  await startApi();
  console.log("\n→ Open the frontend at http://localhost:5173");
})().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});
