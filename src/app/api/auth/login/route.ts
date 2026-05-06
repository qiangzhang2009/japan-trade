import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword, updateUserLastLogin, safeUser } from '@/lib/auth';
import { createSession, sessionCookieOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    console.log('[login] email:', email, '| user found:', !!user, '| role:', user?.role, '| status:', user?.status);

    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    if (user.status === 'suspended') {
      return NextResponse.json({ error: '账号已被停用，请联系管理员' }, { status: 403 });
    }

    const isValid = verifyPassword(password, user.passwordHash);
    console.log('[login] email:', email, '| role:', user.role, '| status:', user.status, '| valid:', isValid);
    if (!isValid) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    await updateUserLastLogin(user.id);

    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: safeUser(user),
    });

    const cookieOpts = sessionCookieOptions(token);
    response.cookies.set(cookieOpts);

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 });
  }
}
