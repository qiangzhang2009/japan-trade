import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import type { UserRole, UserStatus } from '@/types';
import type { User } from '@/types';

const IS_PROD = process.env.VERCEL === '1';
const HAS_REDIS = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// ─── Default hardcoded admin (used when env vars are not set) ───────────────
const DEFAULT_ADMIN_EMAIL = 'admin@asiabridge.com';
const DEFAULT_ADMIN_PASSWORD = 'AsiaBridge2026!';
const DEFAULT_ADMIN_NAME = '平台管理员';

// ─── Env-var admin (Vercel-compatible, no DB writes needed) ─────────────────
const ENV_ADMIN_EMAIL = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
const ENV_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
const ENV_ADMIN_NAME = process.env.ADMIN_NAME || DEFAULT_ADMIN_NAME;

export type { UserRole, UserStatus };

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  companyName: string;
  contactName: string;
  phone: string;
  country: string;
  industry: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  subscription: {
    planId: string;
    status: 'active' | 'cancelled' | 'expired' | 'none';
    startDate: string;
    endDate: string;
  };
}

interface UsersDB {
  users: AuthUser[];
  adminInitialSetup: boolean;
}

const USERS_KEY = 'asiabridge:users';
const ADMIN_FLAG_KEY = 'asiabridge:admin_initialized';

// ─── Redis Client (lazy init to avoid build-time issues) ───────────────────
async function getRedis() {
  if (!HAS_REDIS) return null;
  const { Redis } = await import('@upstash/redis');
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// ─── Local JSON fallback ────────────────────────────────────────────────────
async function getLocalDB(): Promise<UsersDB> {
  if (!IS_PROD) {
    const fs = await import('fs');
    const path = await import('path');
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const filePath = path.join(dataDir, 'users.json');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(filePath)) {
      const initial: UsersDB = { users: [], adminInitialSetup: false };
      fs.writeFileSync(filePath, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as UsersDB;
  }
  return { users: [], adminInitialSetup: false };
}

async function saveLocalDB(db: UsersDB): Promise<void> {
  if (!IS_PROD) {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'users.json');
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
  }
}

// ─── Redis helpers ──────────────────────────────────────────────────────────
async function getRedisDB(): Promise<UsersDB> {
  const redis = await getRedis();
  if (!redis) return getLocalDB();
  const raw = await redis.get<string>(USERS_KEY);
  if (!raw) return { users: [], adminInitialSetup: false };
  return JSON.parse(raw) as UsersDB;
}

async function saveRedisDB(db: UsersDB): Promise<void> {
  const redis = await getRedis();
  if (!redis) { await saveLocalDB(db); return; }
  await redis.set(USERS_KEY, JSON.stringify(db));
}

// ─── Unified read/write ────────────────────────────────────────────────────
async function readDB(): Promise<UsersDB> {
  return getRedisDB();
}

async function writeDB(db: UsersDB): Promise<void> {
  return saveRedisDB(db);
}

// ─── Password helpers ──────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// ─── Admin first-run guard ────────────────────────────────────────────────
async function checkAdminInitialized(): Promise<boolean> {
  if (!IS_PROD) {
    const db = await getLocalDB();
    return db.adminInitialSetup;
  }
  if (!HAS_REDIS) {
    const db = await getLocalDB();
    return db.adminInitialSetup;
  }
  const redis = await getRedis();
  if (!redis) return false;
  const val = await redis.get<string>(ADMIN_FLAG_KEY);
  return val === 'true';
}

async function setAdminInitialized(): Promise<void> {
  if (!IS_PROD) {
    const db = await getLocalDB();
    db.adminInitialSetup = true;
    await saveLocalDB(db);
    return;
  }
  if (!HAS_REDIS) {
    const db = await getLocalDB();
    db.adminInitialSetup = true;
    await saveLocalDB(db);
    return;
  }
  const redis = await getRedis();
  if (redis) await redis.set(ADMIN_FLAG_KEY, 'true');
}

// ─── Public API (all async) ────────────────────────────────────────────────
export async function createUser(data: {
  email: string;
  password: string;
  companyName: string;
  contactName: string;
  phone: string;
  country: string;
  industry: string;
  role?: UserRole;
}): Promise<AuthUser | null> {
  const db = await readDB();
  if (db.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    return null;
  }
  const now = new Date().toISOString();
  const user: AuthUser = {
    id: nanoid(16),
    email: data.email.toLowerCase().trim(),
    passwordHash: hashPassword(data.password),
    companyName: data.companyName.trim(),
    contactName: data.contactName.trim(),
    phone: data.phone.trim(),
    country: data.country,
    industry: data.industry,
    role: data.role || 'viewer',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastLogin: now,
    subscription: {
      planId: data.role === 'premium' ? 'pro' : data.role === 'member' ? 'member' : 'free',
      status: 'none',
      startDate: now,
      endDate: now,
    },
  };
  db.users.push(user);
  await writeDB(db);
  return user;
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  // Default admin always available (supports both prod and dev)
  if (ENV_ADMIN_EMAIL && email.toLowerCase() === ENV_ADMIN_EMAIL.toLowerCase()) {
    return buildEnvAdminUser();
  }
  const db = await readDB();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  // Env admin has fixed ID
  if (ENV_ADMIN_EMAIL && id === 'env-admin') {
    return buildEnvAdminUser();
  }
  const db = await readDB();
  return db.users.find((u) => u.id === id) || null;
}

function buildEnvAdminUser(): AuthUser {
  const now = new Date().toISOString();
  return {
    id: 'env-admin',
    email: ENV_ADMIN_EMAIL!.toLowerCase(),
    passwordHash: hashPassword(ENV_ADMIN_PASSWORD!),
    companyName: '平台管理',
    contactName: ENV_ADMIN_NAME,
    phone: '',
    country: '',
    industry: '',
    role: 'admin',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastLogin: now,
    subscription: { planId: 'admin', status: 'active', startDate: now, endDate: now },
  };
}

export async function updateUserLastLogin(id: string): Promise<void> {
  if (id === 'env-admin') return; // env admin can't be written back
  const db = await readDB();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    db.users[idx].lastLogin = new Date().toISOString();
    await writeDB(db);
  }
}

export async function updateUser(
  id: string,
  data: Partial<Pick<AuthUser, 'role' | 'status' | 'companyName' | 'contactName' | 'phone' | 'country' | 'industry' | 'subscription'>>
): Promise<AuthUser | null> {
  if (id === 'env-admin') return null; // env admin cannot be modified
  const db = await readDB();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  db.users[idx] = {
    ...db.users[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await writeDB(db);
  return db.users[idx];
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = await readDB();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  db.users.splice(idx, 1);
  await writeDB(db);
  return true;
}

export async function getAllUsers(): Promise<AuthUser[]> {
  const db = await readDB();
  if (ENV_ADMIN_EMAIL) {
    return [buildEnvAdminUser(), ...db.users];
  }
  return db.users;
}

export async function isAdminSetupDone(): Promise<boolean> {
  if (ENV_ADMIN_EMAIL) return true; // env admin always available
  return checkAdminInitialized();
}

export async function setAdminSetupDone(): Promise<void> {
  return setAdminInitialized();
}

export async function createAdminAccount(
  email: string,
  password: string,
  companyName: string,
  contactName: string
): Promise<AuthUser | null> {
  const alreadyDone = await isAdminSetupDone();
  if (alreadyDone) return null;
  const db = await readDB();
  if (db.adminInitialSetup) return null;
  const now = new Date().toISOString();
  const admin: AuthUser = {
    id: nanoid(16),
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    companyName: companyName.trim(),
    contactName: contactName.trim(),
    phone: '',
    country: '',
    industry: '',
    role: 'admin',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastLogin: now,
    subscription: { planId: 'admin', status: 'active', startDate: now, endDate: now },
  };
  db.users.push(admin);
  db.adminInitialSetup = true;
  await writeDB(db);
  await setAdminInitialized();
  return admin;
}

export function safeUser(user: AuthUser): User {
  const { passwordHash: _pw, ...result } = user;
  return result as User;
}
