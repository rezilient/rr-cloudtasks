#!/usr/bin/env node
const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
} = require("@aws-sdk/client-dynamodb");

const TABLE_NAME = "CloudTasks-local";
const ENDPOINT = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";

const client = new DynamoDBClient({
  endpoint: ENDPOINT,
  region: "us-east-1",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

async function waitForDynamo(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.send(new ListTablesCommand({}));
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function main() {
  console.log(`> Connecting to DynamoDB Local at ${ENDPOINT}...`);
  await waitForDynamo();
  console.log("> Connected.");

  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`> Table "${TABLE_NAME}" already exists. Skipping creation.`);
    return;
  } catch (err) {
    if (err.name !== "ResourceNotFoundException") throw err;
  }

  console.log(`> Creating table "${TABLE_NAME}"...`);
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
  console.log("> Table created.");
}

main().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
