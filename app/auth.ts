import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { staffUsers } from "../db/schema";

const COOKIE_NAME = "burt_staff_session";
const SESSION_SECONDS = 60 * 60 * 12;
const encoder = new TextEncoder();

type AuthEnv = { ADMIN_EMAIL?: string; ADMIN_PASSWORD?: string };
const authEnv = () => env as unknown as AuthEnv;
const base64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const fromBase64Url = (value: string) => Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4)), (character) => character.charCodeAt(0));

async function sign(value: string, keyMaterial: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(keyMaterial), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

function equal(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

async function hashPassword(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const iterations = 210000;
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
  return `${iterations}.${base64Url(salt)}.${base64Url(hash)}`;
}

async function verifyPassword(password: string, stored: string) {
  const [iterations, salt, expected] = stored.split(".");
  if (!iterations || !salt || !expected) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromBase64Url(salt), iterations: Number(iterations) }, key, 256));
  return equal(base64Url(hash), expected);
}

export async function authenticateStaff(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  if (!email || !password) return null;
  const db = getDb();
  const user = await db.select().from(staffUsers).where(eq(staffUsers.email, email)).limit(1);
  if (user[0]) return (await verifyPassword(password, user[0].passwordHash)) ? { email: user[0].email, sessionKey: user[0].passwordHash } : null;

  const configuredEmail = authEnv().ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = authEnv().ADMIN_PASSWORD;
  const anyUser = await db.select({ id: staffUsers.id }).from(staffUsers).limit(1);
  if (anyUser[0] || password.length < 6) return null;
  if (configuredEmail && configuredPassword && (email !== configuredEmail || !equal(password, configuredPassword))) return null;
  const passwordHash = await hashPassword(password);
  await db.insert(staffUsers).values({ email, passwordHash, createdAt: new Date() });
  return { email, sessionKey: passwordHash };
}

export async function createSession(email: string, sessionKey: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${email}.${expires}`;
  return `${payload}.${await sign(payload, sessionKey)}`;
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [email, expires, signature] = token.split(".");
  if (!email || !expires || !signature || Number(expires) < Math.floor(Date.now() / 1000)) return null;
  const user = await getDb().select().from(staffUsers).where(eq(staffUsers.email, email)).limit(1);
  if (!user[0]) return null;
  return equal(await sign(`${email}.${expires}`, user[0].passwordHash), signature) ? email : null;
}

export function sessionCookie(token: string) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`;
}

export const clearedSessionCookie = `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
