import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'asiabridge_session';
const SESSION_DURATION = '7d';

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  exp?: number;
}

// Lazy initialization — only evaluates at runtime, not at module load / build time.
// Returns null if JWT_SECRET is not set, so auth fails gracefully without crashing the build.
function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: Omit<SessionPayload, 'exp'>): Promise<string> {
  const secret = getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  const secret = getJwtSecret();
  if (!secret) return null; // safe fallback — unauthenticated
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export const ROLE_PERMISSIONS = {
  admin: {
    canViewAllOpportunities: true,
    canViewPremiumOpportunities: true,
    canSubmitOpportunities: true,
    canAccessDashboard: true,
    canManageMembers: true,
    canManageContent: true,
    canViewAnalytics: true,
    canManageOpportunities: true,
  },
  premium: {
    canViewAllOpportunities: true,
    canViewPremiumOpportunities: true,
    canSubmitOpportunities: true,
    canAccessDashboard: false,
    canManageMembers: false,
    canManageContent: false,
    canViewAnalytics: false,
    canManageOpportunities: false,
  },
  member: {
    canViewAllOpportunities: false,
    canViewPremiumOpportunities: false,
    canSubmitOpportunities: true,
    canAccessDashboard: false,
    canManageMembers: false,
    canManageContent: false,
    canViewAnalytics: false,
    canManageOpportunities: false,
  },
  viewer: {
    canViewAllOpportunities: false,
    canViewPremiumOpportunities: false,
    canSubmitOpportunities: false,
    canAccessDashboard: false,
    canManageMembers: false,
    canManageContent: false,
    canViewAnalytics: false,
    canManageOpportunities: false,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.admin;

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
  if (!perms) return false;
  return !!perms[permission];
}
