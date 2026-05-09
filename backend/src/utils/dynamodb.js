const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const config = {};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
  config.region = process.env.AWS_REGION || "us-east-1";
  config.credentials = { accessKeyId: "local", secretAccessKey: "local" };
}

const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TASKS_TABLE;

module.exports = { docClient, TABLE_NAME };
