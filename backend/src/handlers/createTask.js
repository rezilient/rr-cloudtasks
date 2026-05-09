const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const { docClient, TABLE_NAME } = require("../utils/dynamodb");
const { created, badRequest, serverError } = require("../utils/response");
const { getUserId } = require("../utils/auth");

const VALID_STATUSES = ["todo", "in_progress", "blocked", "on_hold", "completed"];

exports.handler = async (event) => {
  try {
    const userId = getUserId(event);
    if (!userId) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    const body = JSON.parse(event.body || "{}");
    const { title, description, status = "todo" } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return badRequest("title is required");
    }
    if (!VALID_STATUSES.includes(status)) {
      return badRequest(`status must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const now = new Date().toISOString();
    const task = {
      userId,
      taskId: uuidv4(),
      title: title.trim(),
      description: description ? description.trim() : "",
      status,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: task }));
    return created(task);
  } catch (err) {
    console.error("createTask error:", err);
    return serverError();
  }
};
