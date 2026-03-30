import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const authHeader = process.env.CRON_SECRET;
  // Support both Bearer token in Authorization header and CRON_SECRET env var
  const requestSecret = authHeader;

  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET environment variable is not configured' }, { status: 500 });
  }
  if (requestSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized: invalid secret' }, { status: 401 });
  }

  const collectorPath = path.join(process.cwd(), 'scripts', 'collector.js');
  if (!fs.existsSync(collectorPath)) {
    return NextResponse.json({ error: 'Collector script not found' }, { status: 404 });
  }

  return new Promise<NextResponse>((resolve) => {
    const startTime = Date.now();
    const proc = spawn('node', [collectorPath], {
      cwd: process.cwd(),
      env: { ...process.env, VERCEL_REVALIDATE_HOOK: process.env.VERCEL_REVALIDATE_HOOK || '' },
      timeout: 180000,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      const elapsed = Date.now() - startTime;
      const lines = stdout.split('\n').filter(Boolean);
      const lastLines = lines.slice(-20);

      let opportunitiesCount = 0;
      try {
        const dataPath = path.join(process.cwd(), 'public', 'data', 'opportunities.json');
        if (fs.existsSync(dataPath)) {
          const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          opportunitiesCount = Array.isArray(data) ? data.length : 0;
        }
      } catch {}

      resolve(NextResponse.json({
        success: code === 0,
        code,
        elapsed: `${elapsed}ms`,
        itemsCollected: opportunitiesCount,
        log: lastLines,
        ...(stderr && process.env.NODE_ENV !== 'production' && { errors: stderr.substring(0, 500) }),
      }, { status: code === 0 ? 200 : 500 }));
    });

    proc.on('error', (err) => {
      resolve(NextResponse.json({
        success: false,
        error: 'Process spawn failed: ' + err.message,
      }, { status: 500 }));
    });

    setTimeout(() => {
      proc.kill();
      resolve(NextResponse.json({
        success: false,
        error: 'Process timed out after 180s',
      }, { status: 408 }));
    }, 180000);
  });
}
