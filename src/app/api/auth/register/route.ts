import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail, isAdminSetupDone, createAdminAccount } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, companyName, contactName, phone, country, industry, isFirstAdmin } = body;

    if (!email || !password || !companyName) {
      return NextResponse.json({ error: '请填写所有必填项' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少需要6个字符' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: '两次输入的密码不一致' }, { status: 400 });
    }

    if (isFirstAdmin) {
      const done = await isAdminSetupDone();
      if (done) {
        return NextResponse.json({ error: '管理员账号已存在，请登录' }, { status: 409 });
      }
      const admin = await createAdminAccount(email, password, companyName, contactName || '管理员');
      if (!admin) {
        return NextResponse.json({ error: '创建管理员失败' }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: '管理员账号创建成功',
        isAdmin: true,
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册，请直接登录' }, { status: 409 });
    }

    const user = await createUser({
      email,
      password,
      companyName,
      contactName: contactName || '',
      phone: phone || '',
      country: country || '',
      industry: industry || '',
      role: 'viewer',
    });

    if (!user) {
      return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '注册成功，请登录',
      isAdmin: false,
    });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 });
  }
}
