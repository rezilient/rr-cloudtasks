const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

const ok = (body) => ({
  statusCode: 200,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});

const created = (body) => ({
  statusCode: 201,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});

const noContent = () => ({
  statusCode: 204,
  headers: CORS_HEADERS,
  body: "",
});

const badRequest = (message) => ({
  statusCode: 400,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message }),
});

const notFound = (message = "Not found") => ({
  statusCode: 404,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message }),
});

const serverError = (message = "Internal server error") => ({
  statusCode: 500,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message }),
});

module.exports = { ok, created, noContent, badRequest, notFound, serverError };
