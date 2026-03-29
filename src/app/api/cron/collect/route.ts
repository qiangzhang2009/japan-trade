import { NextRequest, NextResponse } from 'next/server';

const CRON_SECRET = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Trigger revalidation via Vercel or just return success
    const revalidateHook = process.env.VERCEL_REVALIDATE_HOOK;
    if (revalidateHook) {
      await fetch(revalidateHook, { method: 'POST' });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Cron triggered successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Cron trigger failed', details: String(error) },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
