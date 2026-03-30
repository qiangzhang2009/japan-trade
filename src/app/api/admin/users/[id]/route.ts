import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { updateUser, findUserById, safeUser, deleteUser } from '@/lib/auth';
import { UserRole, UserStatus } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');
  if (!userId) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  const user = await findUserById(userId);
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  return NextResponse.json({ user: safeUser(user) });
}

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }
  const body = await request.json();
  const { id, role, status, companyName, contactName, phone, country, industry } = body;

  if (!id) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });

  const target = await findUserById(id);
  if (!target) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  if (session.userId === id && role && role !== 'admin') {
    return NextResponse.json({ error: '不能修改自己的管理员权限' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (role && ['admin', 'premium', 'member', 'viewer'].includes(role)) {
    updates.role = role as UserRole;
  }
  if (status && ['active', 'suspended', 'pending'].includes(status)) {
    updates.status = status as UserStatus;
  }
  if (companyName !== undefined) updates.companyName = companyName;
  if (contactName !== undefined) updates.contactName = contactName;
  if (phone !== undefined) updates.phone = phone;
  if (country !== undefined) updates.country = country;
  if (industry !== undefined) updates.industry = industry;

  const updated = await updateUser(id, updates as Parameters<typeof updateUser>[1]);
  if (!updated) return NextResponse.json({ error: '更新失败' }, { status: 500 });

  return NextResponse.json({ success: true, user: safeUser(updated) });
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  if (session.userId === id) {
    return NextResponse.json({ error: '不能删除自己的账号' }, { status: 400 });
  }
  const ok = await deleteUser(id);
  if (!ok) return NextResponse.json({ error: '删除失败或用户不存在' }, { status: 404 });
  return NextResponse.json({ success: true });
}
