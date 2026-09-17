import "dotenv/config";
import { z } from "zod";

const origin = z.string().url().refine((value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.origin === value;
  } catch { return false; }
}, "Use an exact HTTP(S) origin without a path or trailing slash");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().url().refine((value) => {
    try { return ["postgres:", "postgresql:"].includes(new URL(value).protocol); }
    catch { return false; }
  }),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  JWT_ACCESS_SECRET: z.string().min(64).regex(/^[a-fA-F0-9]{64,}$/, "Use at least 32 random bytes encoded as hex"),
  JWT_ISSUER: z.string().min(1).default("nexobd-api"),
  JWT_AUDIENCE: z.string().min(1).default("nexobd-frontend"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(900).default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  AUTH_COOKIE_ENABLED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  AUTH_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001")
    .transform((value) => value.split(",").map((item) => item.trim())).pipe(z.array(origin).min(1)),
  TRUST_PROXY: z.string().default("").transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean)),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  API_DOCS_ENABLED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
}).superRefine((value, context) => {
  if (value.NODE_ENV === "production" && value.CORS_ORIGINS.some((item) => !item.startsWith("https://"))) {
    context.addIssue({ code: "custom", path: ["CORS_ORIGINS"], message: "Production origins must use HTTPS" });
  }
  if (value.AUTH_COOKIE_ENABLED && value.AUTH_COOKIE_SAME_SITE === "none" && value.NODE_ENV !== "production") {
    context.addIssue({ code: "custom", path: ["AUTH_COOKIE_SAME_SITE"], message: "SameSite=None requires secure production cookies" });
  }
});

export type Environment = z.infer<typeof schema>;
export function parseEnvironment(input: NodeJS.ProcessEnv): Environment {
  const result = schema.safeParse(input);
  if (!result.success) {
    // Report field names, never environment values or secrets.
    throw new Error(`Invalid environment fields: ${[...new Set(result.error.issues.map((issue) => issue.path.join(".")))].join(", ")}`);
  }
  return result.data;
}
