function getUserId(event) {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (claims?.sub) return claims.sub;

  if (process.env.STAGE === "local") {
    const headers = event.headers || {};
    return headers["x-mock-user-id"] || headers["X-Mock-User-Id"] || "local-dev-user";
  }

  return null;
}

module.exports = { getUserId };
