import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Document storage with two drivers:
// - Upstash Redis (REST) when UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN are set.
//   This is what makes data persistent on Vercel (add it under Storage -> Upstash for Redis).
// - JSON files otherwise (local dev). On Vercel without Redis this falls back to /tmp, which is
//   temporary and not shared between server instances.

export type Collection = "characters" | "chats" | "users" | "sessions" | "ratings" | "hubs" | "groups";

export interface Kv {
  get<T>(col: Collection, id: string): Promise<T | null>;
  put(col: Collection, id: string, value: unknown): Promise<void>;
  del(col: Collection, id: string): Promise<void>;
  all<T>(col: Collection): Promise<T[]>;
  readonly persistent: boolean;
}

// ---- Upstash Redis over REST (no SDK needed) ----

function upstash(url: string, token: string): Kv {
  const base = url.replace(/\/$/, "");
  const prefix = process.env.KV_PREFIX ?? "pro";
  const key = (col: Collection, id: string) => `${prefix}:${col}:${id}`;
  const index = (col: Collection) => `${prefix}:idx:${col}`;

  async function pipeline(commands: (string | number)[][]): Promise<unknown[]> {
    const res = await fetch(`${base}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Redis request failed (${res.status})`);
    const out = (await res.json()) as { result?: unknown; error?: string }[];
    const failed = out.find((r) => r.error);
    if (failed) throw new Error(`Redis error: ${failed.error}`);
    return out.map((r) => r.result);
  }

  const parse = <T>(v: unknown): T | null => (typeof v === "string" ? (JSON.parse(v) as T) : null);

  return {
    persistent: true,
    async get<T>(col: Collection, id: string) {
      const [v] = await pipeline([["GET", key(col, id)]]);
      return parse<T>(v);
    },
    async put(col, id, value) {
      await pipeline([
        ["SET", key(col, id), JSON.stringify(value)],
        ["SADD", index(col), id],
      ]);
    },
    async del(col, id) {
      await pipeline([
        ["DEL", key(col, id)],
        ["SREM", index(col), id],
      ]);
    },
    async all<T>(col: Collection) {
      const [ids] = (await pipeline([["SMEMBERS", index(col)]])) as [string[]];
      if (!ids?.length) return [];
      const out: T[] = [];
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const [values] = (await pipeline([["MGET", ...chunk.map((id) => key(col, id))]])) as [unknown[]];
        for (const v of values ?? []) {
          const doc = parse<T>(v);
          if (doc) out.push(doc);
        }
      }
      return out;
    },
  };
}

// ---- JSON files ----

function files(root: string): Kv {
  const file = (col: Collection, id: string) => path.join(root, col, `${id}.json`);
  const read = async <T>(f: string): Promise<T | null> => {
    try {
      return JSON.parse(await readFile(f, "utf8")) as T;
    } catch {
      return null;
    }
  };
  return {
    persistent: !process.env.VERCEL,
    get: (col, id) => read(file(col, id)),
    async put(col, id, value) {
      const f = file(col, id);
      await mkdir(path.dirname(f), { recursive: true });
      const tmp = `${f}.${randomUUID()}.tmp`;
      await writeFile(tmp, JSON.stringify(value, null, 2));
      await rename(tmp, f);
    },
    async del(col, id) {
      await rm(file(col, id), { force: true });
    },
    async all<T>(col: Collection) {
      const dir = path.join(root, col);
      await mkdir(dir, { recursive: true });
      const names = (await readdir(dir)).filter((n) => n.endsWith(".json"));
      const docs = await Promise.all(names.map((n) => read<T>(path.join(dir, n))));
      return docs.filter((d): d is Awaited<T> => d !== null) as T[];
    },
  };
}

function createKv(): Kv {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return upstash(url, token);
  const root =
    process.env.COMPANION_DATA_DIR ??
    (process.env.VERCEL ? path.join(tmpdir(), "companion") : path.join(process.cwd(), "data", "companion"));
  return files(root);
}

export const kv = createKv();
