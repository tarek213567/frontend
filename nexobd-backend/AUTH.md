# Phase 3 — Authentication

Implemented registration, login, access-token verification, refresh-token rotation,
logout, protected profile access and CUSTOMER/ADMIN/SELLER authorization. No product
APIs or frontend UI changes were made. Email verification/password recovery are
separate future features; this module does not claim to implement them.

## Created and changed files

```text
src/controllers/auth.controller.ts
src/services/auth.service.ts
src/routes/auth.routes.ts
src/middleware/auth.middleware.ts
src/models/auth.schema.ts
src/repositories/auth.repository.ts
src/types/auth.ts
src/utils/jwt.ts
src/utils/password.ts
src/config/auth.openapi.ts
src/prisma/cleanup-sessions.ts
tests/auth.test.ts
postman/NexoBD-Auth.postman_collection.json
prisma/migrations/20260917000200_auth_sessions/migration.sql
AUTH.md
```

Updated `prisma/schema.prisma`, environment configuration/template, app/server
wiring, OpenAPI configuration, package manifests/lockfile, README and regression
tests. The ignored local `.env` has a generated signing secret; it is never printed
or committed. Embedded PostgreSQL/socket packages are test-only dependencies.

## Setup

Prisma, bcrypt and jsonwebtoken were installed in earlier phases; no duplicate
initialization is necessary. From `nexobd-backend`:

```powershell
npm ci
```

On a fresh checkout copy `.env.example` to `.env`, configure `DATABASE_URL` and
generate a private signing secret locally:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set `JWT_ACCESS_SECRET` to that output. Use a separate secret manager value for
production. Never put it in a `NEXT_PUBLIC_*` variable. Replacing it invalidates
existing access tokens. Defaults: access token 900 seconds, absolute login session
30 days, bcrypt cost 12. No refresh rotation extends the absolute family deadline.

```powershell
npm run db:deploy
npm run prisma:generate
npm run db:check
npm run dev
```

The committed migration adds `auth_sessions` and `refresh_tokens` without changing
the Phase 2 tables. PostgreSQL applies foreign keys, hash/expiry checks and a
partial unique index allowing only one unused refresh token per session. CHECK
constraints and that partial index are SQL-managed: use migrations, not `db push`.

Migration application to the configured localhost database failed with a Prisma
schema-engine error during `db:deploy`; no migration success is claimed. That
PostgreSQL server was unavailable in Phase 2. The migration SQL and actual
Prisma repository are tested against an isolated embedded PostgreSQL instance.
For production use a release job with `prisma migrate deploy`; never migrate on
every incoming request.

## Complete authentication flow

```mermaid
sequenceDiagram
  participant Client
  participant Controller
  participant Service
  participant Repository
  participant PostgreSQL
  Client->>Controller: POST register / login
  Controller->>Controller: Origin policy, rate limit, Zod validation
  Controller->>Service: Validated credentials
  alt Registration
    Service->>Service: bcrypt hash, force CUSTOMER
    Service->>Repository: Create user + session + refresh hash atomically
  else Login
    Service->>Repository: Find normalized email
    Repository->>PostgreSQL: Read user
    Service->>Service: bcrypt comparison (dummy hash if missing)
    Service->>Repository: Create new device session + refresh hash
  end
  Repository->>PostgreSQL: Persist session/token family
  Service-->>Client: Safe user + access JWT + refresh transport
  Client->>Controller: GET me with Bearer JWT
  Controller->>Service: Verify access JWT
  Service->>Service: Enforce HS256, issuer, audience, type and expiry
  Service->>Repository: Check active session and current user role
  Repository->>PostgreSQL: Read session + user
  Controller-->>Client: Safe user / 401 / 403
  Client->>Controller: POST refresh with refresh credential
  Controller->>Service: Rotate refresh token
  Service->>Repository: SHA-256 old/new credentials
  Repository->>PostgreSQL: Lock family row FOR UPDATE
  alt Active unused token
    Repository->>PostgreSQL: Mark old token used + insert new hash atomically
    Service-->>Client: New access JWT + rotated refresh credential
  else Replay of used token
    Repository->>PostgreSQL: Commit entire family revocation
    Service-->>Client: 401; all access/refresh tokens for family now blocked
  else Unknown, expired or revoked token
    Service-->>Client: 401
  end
  Client->>Controller: POST logout with refresh credential
  Controller->>Repository: Revoke family under same row lock
  Repository->>PostgreSQL: Set revokedAt
  Controller-->>Client: Clear cookie if enabled; success
```

## API documentation / Postman examples

Base URL: `http://localhost:4000`. Send `Content-Type: application/json` on POSTs.
Import `postman/NexoBD-Auth.postman_collection.json`; it captures new access/refresh
tokens automatically. Use an unused test email when repeating registration.

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| POST | `/api/auth/register` | Create CUSTOMER and session | 201 |
| POST | `/api/auth/login` | Verify credentials and start session | 200 |
| POST | `/api/auth/refresh` | Rotate credential within its session | 200 |
| POST | `/api/auth/logout` | Revoke this session | 200 |
| GET | `/api/auth/me` | Protected current user | 200 |

Register:

```json
{
  "name": "NexoBD Customer",
  "email": "customer@example.com",
  "phone": "+8801712345678",
  "password": "Change-this-test-password!"
}
```

Names are trimmed; emails are trimmed/lowercased. Phone is optional. Passwords must
be at least 12 characters and at most 72 UTF-8 bytes to avoid bcrypt truncation.
Passwords are never trimmed. Unknown fields, including a supplied role, are rejected.
Registration checks email first and catches the unique-constraint race as 409.

Login:

```json
{ "email": "customer@example.com", "password": "Change-this-test-password!" }
```

JSON-transport response for registration/login/refresh:

```json
{
  "success": true,
  "user": {
    "id": "<uuid>", "name": "NexoBD Customer", "email": "customer@example.com",
    "phone": "+8801712345678", "role": "CUSTOMER", "avatar": null,
    "createdAt": "<ISO timestamp>", "updatedAt": "<ISO timestamp>"
  },
  "accessToken": "<JWT>",
  "refreshToken": "<64-character random credential>",
  "expiresIn": 900,
  "refreshExpiresAt": "<ISO timestamp>"
}
```

Password hashes and internal session IDs are omitted from user responses. Login
failure uses the same 401 message for missing users and incorrect passwords.
Registration's explicit 409 means this endpoint exposes whether an email is already
registered; that is the requested duplicate-email contract.

Refresh and logout in JSON mode:

```json
{ "refreshToken": "<current refreshToken>" }
```

Replace both tokens with the refresh response. Reusing a consumed token revokes
the family, including the newly returned access JWT. Client code must serialize
refresh calls and must not automatically retry a refresh after an uncertain network
response; strict replay protection may require logging in again in that case.

Logout is idempotent for well-formed unknown/already-revoked credentials. Missing
or malformed credentials return 401. Other device sessions are not revoked.

Protected profile in Postman:

```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

Response: `{ "success": true, "user": { ...safe user fields... } }`.

Role-gated route example for future modules:

```typescript
router.get("/admin-only", protectRoute(authService), authorizeRoles("ADMIN"), controller);
router.get("/seller-or-admin", protectRoute(authService), authorizeRoles("SELLER", "ADMIN"), controller);
```

These are examples, not deployed admin APIs. Trusted operator workflows must assign
ADMIN/SELLER roles; there is no public role-promotion endpoint. `req.user` contains
the safe user plus internal sessionId for authenticated middleware consumers.
Roles are read from PostgreSQL on every protected request rather than trusting
stale claims or the frontend's existing admin cookie.

Errors use `{ "error": { "code", "message", "requestId" } }`. Relevant status
codes: 400 validation; 401 credentials/token/session; 403 role/CSRF/origin; 409
duplicate email; 429 throttling; 500 safe unexpected failure. Swagger documentation
is available at `/docs` when `API_DOCS_ENABLED=true`, with the raw document at
`/api/v1/openapi.json`.

## Secure cookie option

`AUTH_COOKIE_ENABLED=false` returns refresh credentials in JSON, matching the
requested API contract and supporting Postman/native clients. For browser login
deployments set `AUTH_COOKIE_ENABLED=true`. Cookie mode omits `refreshToken` from
JSON and sets a host-only `nexobd-refresh` cookie with HttpOnly, the family expiry,
path `/api/auth`, and Secure in production. SameSite defaults to Lax.

All cookie-mode POSTs, including register/login, require:

```http
Origin: https://nexobd.pro
X-CSRF-Token: nexobd
Content-Type: application/json
```

The custom header is an API CSRF marker, not a secret synchronizer token. Its
protection relies on mandatory exact Origin validation plus the allowlisted CORS
preflight; simple cross-origin forms cannot supply it. Keep the origin allowlist
narrow. Postman can supply these headers and use its cookie jar. Refresh/logout
cookie bodies should be `{}`. Browser fetch calls require `credentials: "include"`.

For same-site `nexobd.pro` / `api.nexobd.pro`, Lax cookies are suitable. If frontend
and backend remain on different platform domains, cookie mode needs production
HTTPS and `AUTH_COOKIE_SAME_SITE=none`; browser third-party cookie policies may
still block it. Prefer a custom API domain under the same site. Development uses
non-Secure Lax cookies on localhost; SameSite=None is rejected outside production.

## Connecting the existing Next.js login page

Set the frontend's public API URL to the backend's HTTPS origin. This URL is not
a credential. Replace the existing login handler during frontend integration with
a call like this (browser cookie mode):

```typescript
const API = process.env.NEXT_PUBLIC_API_URL;
if (!API) throw new Error("API URL is missing");

async function login(email: string, password: string) {
  const response = await fetch(`${API}/api/auth/login`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": "nexobd" },
    body: JSON.stringify({ email, password }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message ?? "Login failed");
  return result; // Store accessToken in React/auth memory, not localStorage.
}
```

The browser supplies Origin automatically. Call `/api/auth/me` with the in-memory
Bearer access token. On page reload or access-token expiry, POST `{}` to refresh
with credentials/header, save the new access token in memory, and retry the original
protected request at most once. Share one in-flight refresh promise within the app.
Coordinate refresh across tabs with a shared worker or browser locking/broadcast
strategy so two tabs do not race the same cookie. A 401 from refresh means clear
local auth state and request login; a role-based 403 must not trigger refresh.

Logout POSTs `{}` with the same cookie-mode options, then clears in-memory state.
Production cookies must be set by the API; JavaScript must not read/write the
HttpOnly refresh credential. Do not reuse the frontend's `active` admin cookie as
backend authorization. The backend verifies roles independently.

This works with the frontend on Cloudflare and the API on Railway/Render/AWS.
No secrets or Prisma client are bundled into Next.js. The login UI and existing
Supabase services were not changed in this auth-only phase.

## Tests and operations

```powershell
npm run check
npm run build
npm run auth:cleanup
```

HTTP auth tests use actual Prisma CRUD/transactions through the PostgreSQL adapter
over an isolated PGlite socket, applying both migrations. They cover hashes, role
injection, email normalization/duplicates, generic credential failures, JWT claims
and expiry, current-role authorization, rotation/replay, logout/revocation, parallel
refresh behavior and cookie CSRF flow. Embedded tests use one connection; run
deployment smoke/concurrency tests against real PostgreSQL before production to
verify multi-connection row locks, network behavior and database permissions.

Schedule `auth:cleanup` daily to delete expired families and their tokens through
the database cascade. Retain used hashes until family expiry for replay detection.
Never log credentials or full tokens. Refresh credentials are 48 random bytes;
only SHA-256 hashes are stored. Access JWTs enforce HS256, issuer, audience, token
type, UUID claims and bounded lifetime. Logout checks active sessions on each
protected request, trading a database read for immediate session invalidation.

There is an additional per-IP auth limiter of 30 requests per 15 minutes. Both
limiters currently use process memory; multi-replica deployments require a shared
store/global ingress limiter. Configure trusted proxies narrowly so client-IP
limits cannot be bypassed. Configure monitoring and infrastructure secrets on the
deployment platform before publishing.

Security references: [OWASP refresh-token rotation guidance](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html),
[OWASP API CSRF/custom-header guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html),
and [JWT validation best practices](https://datatracker.ietf.org/doc/html/rfc8725).
