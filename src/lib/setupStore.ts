import fs from "fs";
import path from "path";

const SETUP_DIR = path.join(process.cwd(), "data", "setup");
const AUDIT_FILE = path.join(SETUP_DIR, "dashboard-audit.ndjson");

function ensureDir() {
  fs.mkdirSync(SETUP_DIR, { recursive: true });
}

export function readStore(fileName: string): Record<string, any> {
  ensureDir();
  const fp = path.join(SETUP_DIR, fileName);
  if (!fs.existsSync(fp)) return {};
  try {
    const raw = fs.readFileSync(fp, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeStore(fileName: string, store: Record<string, any>) {
  ensureDir();
  const fp = path.join(SETUP_DIR, fileName);
  fs.writeFileSync(fp, JSON.stringify(store, null, 2), "utf8");
}

export function deepMerge<T>(base: T, patch: any): T {
  if (patch === null || patch === undefined) return base;
  if (Array.isArray(base) || Array.isArray(patch)) return patch as T;
  if (typeof base !== "object" || typeof patch !== "object") return patch as T;

  const out: any = { ...(base as any) };
  for (const [k, v] of Object.entries(patch)) {
    const prev = out[k];
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      prev &&
      typeof prev === "object" &&
      !Array.isArray(prev)
    ) {
      out[k] = deepMerge(prev, v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export function appendAudit(entry: Record<string, any>) {
  ensureDir();
  const line = JSON.stringify({
    at: new Date().toISOString(),
    ...entry,
  });
  fs.appendFileSync(AUDIT_FILE, line + "\n", "utf8");
}
