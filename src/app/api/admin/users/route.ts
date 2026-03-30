import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getAllUsers, safeUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let users = (await getAllUsers()).map(safeUser);

  if (role && role !== 'all') {
    users = users.filter((u) => u.role === role);
  }
  if (status && status !== 'all') {
    users = users.filter((u) => u.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.companyName.toLowerCase().includes(q) ||
        u.contactName.toLowerCase().includes(q)
    );
  }

  users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allUsers = await getAllUsers();
  const total = allUsers.length;
  const stats = {
    total,
    admins: allUsers.filter((u) => u.role === 'admin').length,
    premium: allUsers.filter((u) => u.role === 'premium').length,
    members: allUsers.filter((u) => u.role === 'member').length,
    viewers: allUsers.filter((u) => u.role === 'viewer').length,
    active: allUsers.filter((u) => u.status === 'active').length,
    suspended: allUsers.filter((u) => u.status === 'suspended').length,
  };

  return NextResponse.json({ users, stats, total });
}
