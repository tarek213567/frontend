# nexobd-backend — Phases 1–4

Separate Node.js / Express 5 / TypeScript / PostgreSQL / Prisma 7 application.
Requires Node.js 22.12+ and a reachable PostgreSQL database. No Supabase is used
in this backend. Phase 2 adds seven database models and an initial migration.
Product APIs provide public reads and ADMIN-only create, update and delete.
Category APIs provide public listing and ADMIN-only creation.
See `DATABASE.md` for schema details and `AUTH.md` for existing authentication.

## Existing frontend analysis

The root project uses Next.js App Router, React, TypeScript and Tailwind. `app/`
contains storefront, cart, checkout, customer order and admin routes. `components/`
contains storefront UI and admin forms. `services/productService.ts` and
`services/orderService.ts` currently call Supabase through `lib/supabase.ts`.
`context/CartContext.tsx` persists the cart in local storage. `proxy.ts` trusts
an `active` cookie for admin access; future authentication must replace that
with server-verified authorization. `vite.config.ts` and `wrangler.jsonc` deploy
the frontend to Cloudflare Workers using Vinext.

The previous `backend/` foundation was renamed to `nexobd-backend/`. The frontend
TypeScript and lint configurations exclude it, keeping independent builds.
Frontend commerce code is unchanged; replacing its Supabase integration is a later phase.

## Complete authored file structure

```text
nexobd-backend/
├── src/
│   ├── config/
│   │   ├── auth.openapi.ts
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── openapi.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── category.controller.ts
│   │   ├── product.controller.ts
│   │   └── health.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── category.service.ts
│   │   ├── product.service.ts
│   │   └── health.service.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── category.routes.ts
│   │   ├── product.routes.ts
│   │   └── index.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error-handler.ts
│   │   └── validate.ts
│   ├── utils/
│   │   ├── api-error.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── database-error.ts
│   │   ├── slug.ts
│   │   └── logger.ts
│   ├── prisma/
│   │   ├── cleanup-sessions.ts
│   │   └── check-connection.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── catalog.ts
│   │   └── api.ts
│   ├── repositories/
│   │   ├── auth.repository.ts
│   │   ├── category.repository.ts
│   │   ├── product.repository.ts
│   │   └── README.md
│   ├── models/
│   │   ├── auth.schema.ts
│   │   ├── catalog.schema.ts
│   │   └── README.md
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── app.test.ts
│   ├── auth.test.ts
│   ├── catalog.test.ts
│   └── database.test.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── migration_lock.toml
│       ├── 20260917000100_init/migration.sql
│       ├── 20260917000200_auth_sessions/migration.sql
│       └── 20260917000300_product_management/migration.sql
├── postman/NexoBD-Auth.postman_collection.json
├── nodemon.json
├── prisma.config.ts
├── .env                 # ignored, local configuration and private signing secret
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── DATABASE.md
├── AUTH.md
└── README.md
```

Generated directories: `node_modules/`, `src/prisma/generated/` and `dist/`.
They are git-ignored. Repository/model README files reserve future layers;
they do not implement any database models.

## Installation

From the repository root:

```powershell
cd nexobd-backend
npm ci
```

The requested packages are installed. To reproduce package selection manually:

```powershell
npm install express @prisma/client@7 @prisma/adapter-pg@7 pg bcrypt jsonwebtoken cors helmet express-rate-limit zod dotenv pino swagger-ui-express
npm install -D typescript ts-node nodemon prisma@7 tsx @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken @types/pg @types/swagger-ui-express supertest @types/supertest
```

Prisma 7 uses a PostgreSQL driver adapter and generated ESM client. `ts-node` is
installed as requested; nodemon restarts the ESM development server using `tsx`.
JWT and bcrypt implement authentication; see `AUTH.md` for the endpoints and setup.
Patched `deepmerge-ts` and `mysql2` transitive releases are pinned using npm
overrides to resolve Prisma CLI audit findings. Schema validation and client
generation are checked with these overrides.

## Local database and configuration

Create a local PostgreSQL user and an empty database using your PostgreSQL admin
tool. For example, in a local `psql` administrator session (choose your own password):

```sql
CREATE ROLE nexobd WITH LOGIN PASSWORD 'replace_with_a_local_password';
CREATE DATABASE nexobd OWNER nexobd;
```

Edit `.env` to match that database. If `.env` does not exist on a fresh checkout:

```powershell
Copy-Item .env.example .env
```

```dotenv
DATABASE_URL=postgresql://nexobd:replace_with_a_local_password@localhost:5432/nexobd?schema=public
```

Also generate and configure `JWT_ACCESS_SECRET` as described in `AUTH.md`.

URL-encode special characters in credentials. The provided `change_me` value is
only a placeholder. Keep real credentials out of version control. Apply the
versioned migration as described in `DATABASE.md`; do not replace it with `db push`.

Configuration is validated by Zod. Invalid configuration reports field names
without echoing values. Production CORS origins must use HTTPS. Set
`HOST=0.0.0.0` in containers; local default is `127.0.0.1`. Configure trusted proxy
IPs/CIDRs explicitly and restrict direct origin access before trusting ingress.

## Run locally

```powershell
npm run prisma:validate
npm run prisma:generate
npm run db:deploy
npm run db:check
npm run dev
```

Startup connects to PostgreSQL and executes `SELECT 1` before listening. It never
creates tables. If PostgreSQL is unavailable, startup fails with a safe message.
Graceful shutdown drains HTTP connections and disconnects Prisma with a ten-second
deadline. Pool size and connection/query timeouts are bounded.

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

Exact response:

```json
{ "status": "success", "message": "NexoBD Backend Running" }
```

Additional infrastructure endpoints retained from the original scaffold:
`/api/v1/health/live`, `/api/v1/health/ready`, `/api/v1/openapi.json`, `/docs`.
The readiness endpoint checks process draining, not continuous database health;
the startup check is separate. Swagger is enabled only when `API_DOCS_ENABLED=true`.

## Build and verification

```powershell
npm run check
npm run build
npm start
```

Tests run the injectable Express application without requiring an external PostgreSQL server. They
cover the exact health response, headers, CORS rejection/preflight, body size and
malformed JSON, rate limits, error envelopes, draining, documentation gating and
production environment validation. `db:check` separately tests real connectivity.
Database tests also execute the committed migration in isolated embedded PostgreSQL
to verify constraints, uniqueness, referential actions and exact monetary arithmetic.

## Security and hosting

Helmet, allowlisted credentialed CORS, per-process API rate limits, bounded JSON,
server-generated request IDs, no-store responses and centralized safe errors are
configured. Logs omit request bodies, query strings, cookies and tokens. Zod body
validation middleware is available for future routes. CORS is not authorization.
Use parameterized Prisma operations for future persistence. Render untrusted text
safely in the frontend; rich HTML needs an explicit sanitization policy later.

Keep the frontend on Cloudflare Workers. Host this listening Express application
on a Node-capable service/container behind TLS, optionally proxied by Cloudflare
at `api.nexobd.pro`. This is not a Worker entrypoint. Use hosting-managed secrets
and database TLS settings appropriate to your provider. Before scaling replicas,
replace the memory rate-limit store with a shared store or global ingress limit.

Phase 4 adds product management. Cart/order/payment APIs and frontend integration remain future work.

## Implementation steps

1. Reviewed App Router pages, frontend services, cart state, admin gate and
   Cloudflare configuration; isolated backend compilation from the frontend.
2. Set up strict NodeNext TypeScript and an injectable Express app. The server
   entrypoint owns startup/shutdown; routes delegate to controllers and services.
3. Validated environment variables with Zod and configured Prisma's PostgreSQL
   adapter, bounded pool/timeouts and a startup connectivity probe.
4. Added Helmet, exact-origin CORS, rate limits, JSON size limits, safe errors,
   request IDs and structured logging without sensitive request data.
5. Implemented the health controller/service and integration checks. Nodemon
   watches source/config changes and restarts `src/server.ts` in development.

For Railway/Render, select `nexobd-backend` as the service root, use Node 22.12+,
build with `npm ci --include=dev && npm run build`, and start with `npm start`.
Set `HOST=0.0.0.0`, use the platform-provided `PORT`, and supply `DATABASE_URL`
and exact HTTPS `CORS_ORIGINS` through service secrets. On AWS, run the same build
and start commands under a managed container/service with a PostgreSQL database.
Use `/api/health` for a process health check. Apply migrations using a release job
with `npm run db:deploy` before starting the service; never use `migrate dev` in production.
