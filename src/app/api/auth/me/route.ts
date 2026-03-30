import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { findUserById, safeUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ user: null });
  }
  const user = await findUserById(session.userId);
  if (!user || user.status === 'suspended') {
    const response = NextResponse.json({ user: null });
    response.cookies.set('asiabridge_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  }
  return NextResponse.json({ user: safeUser(user) });
}
