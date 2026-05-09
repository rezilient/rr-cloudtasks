const { DeleteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLE_NAME } = require("../utils/dynamodb");
const { noContent, badRequest, notFound, serverError } = require("../utils/response");
const { getUserId } = require("../utils/auth");

exports.handler = async (event) => {
  try {
    const userId = getUserId(event);
    if (!userId) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    const { taskId } = event.pathParameters || {};

    if (!taskId) return badRequest("taskId is required");

    const existing = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { userId, taskId } })
    );
    if (!existing.Item) return notFound("Task not found");

    await docClient.send(
      new DeleteCommand({ TableName: TABLE_NAME, Key: { userId, taskId } })
    );

    return noContent();
  } catch (err) {
    console.error("deleteTask error:", err);
    return serverError();
  }
};
