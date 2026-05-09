const { QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLE_NAME } = require("../utils/dynamodb");
const { ok, serverError } = require("../utils/response");
const { getUserId } = require("../utils/auth");

exports.handler = async (event) => {
  try {
    const userId = getUserId(event);
    if (!userId) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    const { search, status } = event.queryStringParameters || {};

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    );

    let tasks = result.Items || [];

    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }

    if (search) {
      const term = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          (t.description && t.description.toLowerCase().includes(term))
      );
    }

    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return ok({ tasks, count: tasks.length });
  } catch (err) {
    console.error("listTasks error:", err);
    return serverError();
  }
};
