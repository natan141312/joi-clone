import "server-only";
import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
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
  if (signup && !name) errors.push("Name is required");
  if (signup && b.adultConfirmed !== true) errors.push("You must confirm you are 18 or older");
  return { email, password, name, errors };
}

/** Sets the session cookie on the response for a freshly authenticated user. */
export async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await createSession(token, userId, expires.toISOString());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
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
