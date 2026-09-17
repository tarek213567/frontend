const tokenBody = { type: "object", additionalProperties: false, properties: { refreshToken: { type: "string", minLength: 64, maxLength: 64 } } };
const user = { type: "object", properties: {
  id: { type: "string", format: "uuid" }, name: { type: "string" }, email: { type: "string", format: "email" },
  phone: { type: "string", nullable: true }, role: { type: "string", enum: ["CUSTOMER", "ADMIN", "SELLER"] },
  avatar: { type: "string", nullable: true }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" },
} };
const response = { type: "object", properties: {
  success: { type: "boolean", example: true }, user,
  accessToken: { type: "string" }, refreshToken: { type: "string", description: "JSON transport only; omitted in cookie mode" },
  expiresIn: { type: "integer", example: 900 }, refreshExpiresAt: { type: "string", format: "date-time" },
} };
const credentials = { type: "object", additionalProperties: false, required: ["email", "password"], properties: {
  email: { type: "string", format: "email", maxLength: 254 }, password: { type: "string", maxLength: 72 },
} };
function post(summary: string, body: object, success = "200", logout = false) {
  return { post: {
    tags: ["Authentication"], summary, servers: [{ url: "/api" }],
    description: "Cookie mode requires trusted Origin and X-CSRF-Token: nexobd. Refresh/logout use the HttpOnly cookie instead of a JSON refresh token.",
    parameters: [{ in: "header", name: "X-CSRF-Token", required: false, schema: { type: "string", example: "nexobd" } }],
    requestBody: { required: true, content: { "application/json": { schema: body } } },
    responses: {
      [success]: { description: "Success", content: { "application/json": { schema: logout ? { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } : response } } },
      "400": { description: "Invalid input" }, "401": { description: "Invalid credentials, expired/revoked session or token" },
      "403": { description: "Origin/CSRF rejection" }, "409": { description: "Email already registered (registration only)" },
      "429": { description: "Rate limit exceeded" }, "500": { description: "Safe internal error" },
    },
  } };
}
export const authPaths = {
  "/auth/register": post("Register a customer", { ...credentials, required: ["name", "email", "password"], properties: {
    ...credentials.properties, password: { type: "string", minLength: 12, maxLength: 72, description: "At most 72 UTF-8 bytes" },
    name: { type: "string", minLength: 1, maxLength: 120 }, phone: { type: "string", pattern: "^\\+?[0-9]{7,15}$" },
  } }, "201"),
  "/auth/login": post("Log in", credentials),
  "/auth/refresh": post("Rotate refresh token", tokenBody),
  "/auth/logout": post("Revoke this login session", tokenBody, "200", true),
  "/auth/me": { get: {
    tags: ["Authentication"], summary: "Get the authenticated user", servers: [{ url: "/api" }], security: [{ bearerAuth: [] }],
    responses: {
      "200": { description: "Current safe user", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, user } } } } },
      "401": { description: "Access token/session is invalid or expired" }, "429": { description: "Rate limit exceeded" },
    },
  } },
};
