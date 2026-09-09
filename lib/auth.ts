import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { ObjectId, type Document } from "mongodb";
import { cookies } from "next/headers";
import { getDatabase, hasMongoConfig } from "./mongodb";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type UserRecord = AuthUser & {
  passwordHash: string;
  salt: string;
};

type UserDocument = Omit<UserRecord, "id"> & {
  _id?: ObjectId;
};

const memoryUsers = new Map<string, UserRecord>();
const sessionCookieName = "beginner_tutor_session";
const verificationCode = process.env.SIGNUP_VERIFICATION_CODE || "iitg_learningscience";

function sessionSecret() {
  return process.env.AUTH_SESSION_SECRET || process.env.OPENAI_API_KEY || "local-development-session-secret";
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return {
    salt,
    passwordHash: scryptSync(password, salt, 64).toString("hex")
  };
}

function verifyPassword(password: string, record: UserRecord) {
  const hashed = scryptSync(password, record.salt, 64);
  const stored = Buffer.from(record.passwordHash, "hex");
  return stored.length === hashed.length && timingSafeEqual(stored, hashed);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function signSession(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

function encodeSession(user: AuthUser) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, email: user.email, name: user.name })).toString("base64url");
  return `${payload}.${signSession(payload)}`;
}

function decodeSession(value?: string): AuthUser | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || signSession(payload) !== signature) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return {
      id: String(parsed.id || ""),
      email: String(parsed.email || ""),
      name: String(parsed.name || ""),
      createdAt: ""
    };
  } catch {
    return null;
  }
}

function publicUser(record: UserRecord): AuthUser {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    createdAt: record.createdAt
  };
}

function fromDocument(document: Document): UserRecord {
  return {
    id: String(document._id),
    name: document.name,
    email: document.email,
    passwordHash: document.passwordHash,
    salt: document.salt,
    createdAt: document.createdAt
  };
}

async function collection() {
  const db = await getDatabase();
  return db.collection<UserDocument>("users");
}

async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = normalizeEmail(email);

  if (!hasMongoConfig()) {
    return memoryUsers.get(normalized) || null;
  }

  const user = await (await collection()).findOne({ email: normalized });
  return user ? fromDocument(user) : null;
}

export async function signUp(input: { name: string; email: string; password: string; code: string }) {
  const name = input.name.trim() || "Learning Science User";
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (input.code !== verificationCode) {
    throw new Error("The verification code is not correct.");
  }

  if (!email.includes("@")) {
    throw new Error("Use a valid email address.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("An account already exists for this email.");
  }

  const now = new Date().toISOString();
  const passwordFields = hashPassword(password);
  const user: UserRecord = {
    id: new ObjectId().toHexString(),
    name,
    email,
    ...passwordFields,
    createdAt: now
  };

  if (!hasMongoConfig()) {
    memoryUsers.set(email, user);
    return publicUser(user);
  }

  const { id, ...document } = user;
  const result = await (await collection()).insertOne({ ...document, _id: new ObjectId(id) });
  return { ...publicUser(user), id: result.insertedId.toHexString() };
}

export async function signIn(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user || !verifyPassword(password, user)) {
    throw new Error("Email or password is incorrect.");
  }

  return publicUser(user);
}

export async function setSession(user: AuthUser) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(sessionCookieName)?.value);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required.");
  }
  return user;
}
