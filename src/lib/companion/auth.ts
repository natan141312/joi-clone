import "server-only";
import { createHmac, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { createSession, deleteSession, findUserByEmail, getSessionUserId, getUser } from "./store";
import type { PublicUser, User } from "./types";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "joi_session";
export const ANON_COOKIE = "joi_anon";
const SESSION_DAYS = 30;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

export function toPublic(u: User): PublicUser {
  return { id: u.id, name: u.name, email: u.email };
}

export function validateCredentials(body: unknown, { signup }: { signup: boolean }) {
  const b = (body ?? {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 40) : "";
  const errors: string[] = [];
  if (!EMAIL.test(email) || email.length > 200) errors.push("Enter a valid email");
  if (password.length < 8 || password.length > 200) errors.push("Password must be at least 8 characters");
  if (signup && !/[A-Za-z\u0590-\u05FF]/.test(password)) errors.push("Password must include at least one letter");
  if (signup && !/\d/.test(password)) errors.push("Password must include at least one number");
  if (signup && b.passwordConfirm !== undefined && b.passwordConfirm !== password) errors.push("Passwords do not match");
  if (signup && !name) errors.push("Name is required");
  if (signup && b.adultConfirmed !== true) errors.push("You must confirm you are 18 or older");
  return { email, password, name, errors };
}

// Signed sessions: the cookie carries the user (id, name, email, expiry) plus an HMAC, so any
// server instance can verify it without a session store. Set AUTH_SECRET in production.
function sessionSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    (process.env.VERCEL_PROJECT_ID ? `pro:${process.env.VERCEL_PROJECT_ID}:${process.env.VERCEL_GIT_REPO_ID ?? ""}` : "")
  );
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

type SignedSession = PublicUser & { exp: number };

function encodeSession(user: PublicUser, exp: number, secret: string) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp } satisfies SignedSession)).toString("base64url");
  return `s1.${payload}.${sign(payload, secret)}`;
}

function decodeSession(token: string, secret: string): PublicUser | null {
  const [v, payload, mac] = token.split(".");
  if (v !== "s1" || !payload || !mac) return null;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(mac);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SignedSession;
    if (!s.id || s.exp < Date.now()) return null;
    return { id: s.id, name: s.name, email: s.email };
  } catch {
    return null;
  }
}

/** Sets the session cookie for a freshly authenticated user. */
export async function startSession(user: PublicUser) {
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  const secret = sessionSecret();
  let token: string;
  if (secret) {
    token = encodeSession(user, expires.getTime(), secret);
  } else {
    // No secret available (local dev): server-side session record.
    token = randomBytes(32).toString("hex");
    await createSession(token, user.id, expires.toISOString());
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && !token.startsWith("s1.")) await deleteSession(token);
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  if (token.startsWith("s1.")) {
    const secret = sessionSecret();
    return secret ? decodeSession(token, secret) : null;
  }
  const userId = await getSessionUserId(token);
  const user = userId ? await getUser(userId) : null;
  return user ? toPublic(user) : null;
}

/** Signed-in user id, or the anonymous browser id (null if neither exists yet). */
export async function getViewerId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user) return user.id;
  return (await cookies()).get(ANON_COOKIE)?.value ?? null;
}

/** Same as getViewerId, but creates the anonymous id cookie when missing. Route handlers only. */
export async function ensureViewerId(): Promise<string> {
  const existing = await getViewerId();
  if (existing) return existing;
  const id = `anon-${randomUUID()}`;
  (await cookies()).set(ANON_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 365 * 86400 });
  return id;
}

export { findUserByEmail };
