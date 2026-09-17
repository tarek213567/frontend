import { randomBytes } from "node:crypto";
export function createSlug(name: string, maxLength: number) {
  const base = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, maxLength - 10).replace(/-$/g, "") || "item";
  return `${base}-${randomBytes(4).toString("hex")}`;
}
