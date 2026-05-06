import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is not set. ' +
      'Please set it in .env.local (e.g. JWT_SECRET=$(openssl rand -hex 32))'
    );
  }
  if (secret.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters long.');
  }
  return new TextEncoder().encode(secret);
})();
const SESSION_COOKIE = 'asiabridge_session';
const SESSION_DURATION = '7d';

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  exp?: number;
}

export async function createSession(payload: Omit<SessionPayload, 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(JWT_SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
