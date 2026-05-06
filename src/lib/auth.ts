import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import type { UserRole, UserStatus } from '@/types';
import type { User } from '@/types';

const IS_PROD = process.env.VERCEL === '1';
const HAS_REDIS = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// ─── Admin configuration from environment ────────────────────────────────────
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@asiabridge.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AsiaBridge2026!';
const ADMIN_NAME = process.env.ADMIN_NAME || '平台管理员';

// Pre-compute hash at module load time (env vars are set at startup)
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);
const ADMIN_ID = 'env-admin';

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

// ─── Admin singleton (always available, never persisted to JSON) ───────────────
function makeEnvAdmin(now: string): AuthUser {
  return {
    id: ADMIN_ID,
    email: ADMIN_EMAIL.toLowerCase(),
    passwordHash: ADMIN_PASSWORD_HASH,
    companyName: '平台管理',
    contactName: ADMIN_NAME,
    phone: '',
    country: '',
    industry: '',
    role: 'admin' as const,
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    lastLogin: now,
    subscription: { planId: 'admin', status: 'active' as const, startDate: now, endDate: now },
  };
}

function isEnvAdmin(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function isEnvAdminId(id: string): boolean {
  return id === ADMIN_ID;
}

// ─── Redis Client (lazy init to avoid build-time issues) ─────────────────────
async function getRedis() {
  if (!HAS_REDIS) return null;
  const { Redis } = await import('@upstash/redis');
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// ─── Local JSON fallback — stored outside public/ to prevent direct URL access ──
async function getLocalDB(): Promise<UsersDB> {
  if (!IS_PROD) {
    const fs = await import('fs');
    const path = await import('path');
    // Store users.json one level above public/ so it can't be accessed via URL
    const dataDir = path.join(process.cwd(), 'data');
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
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
  }
}

// ─── Redis helpers ────────────────────────────────────────────────────────────
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

// ─── Unified read/write ───────────────────────────────────────────────────────
async function readDB(): Promise<UsersDB> {
  return getRedisDB();
}

async function writeDB(db: UsersDB): Promise<void> {
  return saveRedisDB(db);
}

// ─── Password helpers ─────────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// ─── Public API ───────────────────────────────────────────────────────────────
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
  // Env-based admin is always available (bypasses DB)
  if (isEnvAdmin(email)) {
    return makeEnvAdmin(new Date().toISOString());
  }
  const db = await readDB();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  if (isEnvAdminId(id)) {
    return makeEnvAdmin(new Date().toISOString());
  }
  const db = await readDB();
  return db.users.find((u) => u.id === id) || null;
}

export async function updateUserLastLogin(id: string): Promise<void> {
  if (isEnvAdminId(id)) return; // env admin can't be written back
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
  if (isEnvAdminId(id)) return null; // env admin cannot be modified
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
  // Env admin always appears first in the list
  return [makeEnvAdmin(new Date().toISOString()), ...db.users];
}

export async function isAdminSetupDone(): Promise<boolean> {
  return true; // env admin is always available
}

export async function setAdminSetupDone(): Promise<void> {
  // No-op: env admin is always set up
}

export async function createAdminAccount(
  email: string,
  password: string,
  companyName: string,
  contactName: string
): Promise<AuthUser | null> {
  // Since env admin always exists, reject this request
  return null;
}

// Strip passwordHash before returning to the client
export function safeUser(user: AuthUser): User {
  const { passwordHash: _pw, ...result } = user;
  return result as User;
}
