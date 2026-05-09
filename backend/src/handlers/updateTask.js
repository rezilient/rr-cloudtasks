const { UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLE_NAME } = require("../utils/dynamodb");
const { ok, badRequest, notFound, serverError } = require("../utils/response");
const { getUserId } = require("../utils/auth");

const VALID_STATUSES = ["todo", "in_progress", "blocked", "on_hold", "completed"];

exports.handler = async (event) => {
  try {
    const userId = getUserId(event);
    if (!userId) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    const { taskId } = event.pathParameters || {};
    const body = JSON.parse(event.body || "{}");
    const { title, description, status } = body;

    if (!taskId) return badRequest("taskId is required");
    if (status && !VALID_STATUSES.includes(status)) {
      return badRequest(`status must be one of: ${VALID_STATUSES.join(", ")}`);
    }
    if (!title && !description && !status) {
      return badRequest("at least one field (title, description, status) is required");
    }

    const existing = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { userId, taskId } })
    );
    if (!existing.Item) return notFound("Task not found");

    const updates = [];
    const values = { ":updatedAt": new Date().toISOString() };
    const names = {};

    if (title) {
      updates.push("#title = :title");
      values[":title"] = title.trim();
      names["#title"] = "title";
    }
    if (description !== undefined) {
      updates.push("description = :description");
      values[":description"] = description.trim();
    }
    if (status) {
      updates.push("#status = :status");
      values[":status"] = status;
      names["#status"] = "status";
    }
    updates.push("updatedAt = :updatedAt");

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId, taskId },
        UpdateExpression: `SET ${updates.join(", ")}`,
        ExpressionAttributeValues: values,
        ...(Object.keys(names).length > 0 && { ExpressionAttributeNames: names }),
        ReturnValues: "ALL_NEW",
      })
    );

    return ok(result.Attributes);
  } catch (err) {
    console.error("updateTask error:", err);
    return serverError();
  }
};
