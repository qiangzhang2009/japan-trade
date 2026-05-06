import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { slugify } from '@/lib/utils';
import { getSessionFromRequest } from '@/lib/session';

const OPP_FILE = path.join(process.cwd(), 'public', 'data', 'opportunities.json');

async function loadOpps() {
  try {
    return JSON.parse(await fs.readFile(OPP_FILE, 'utf8'));
  } catch { return []; }
}

async function saveOpps(opps: unknown[]) {
  await fs.writeFile(OPP_FILE, JSON.stringify(opps, null, 2));
}

// ─── POST: Submit a new opportunity (requires auth) ────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: '请先登录后再提交商机' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, type, country, industry, companyName, contactEmail, region, amount, currency } = body;

    if (!title || !description || !type || !country || !industry || !companyName || !contactEmail) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(contactEmail)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    const opps = await loadOpps();
    const id = 'submit_' + slugify(title).substring(0, 20) + '_' + Date.now();
    const newOpp = {
      id,
      title: title.trim(),
      titleCn: title.trim(),
      description: description.trim().substring(0, 400),
      descriptionCn: description.trim().substring(0, 400),
      type,
      country,
      industry,
      amount: amount || '面议',
      currency: currency || 'CNY',
      companyName: companyName.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      region: region || '',
      publishedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      isPremium: false,
      source: '用户提交',
      submittedBy: session.userId,
    };

    opps.unshift(newOpp);
    await saveOpps(opps.slice(0, 200));

    return NextResponse.json({ success: true, id, message: '商机已提交，审核通过后将展示' });
  } catch (e) {
    return NextResponse.json({ error: '服务器错误：' + (e as Error).message }, { status: 500 });
  }
}

// ─── GET: Method not allowed ───────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({ error: '请使用 POST 方法提交' }, { status: 405 });
}
