import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve collector script path relative to this file's location (not cwd)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COLLECTOR_SCRIPT = path.resolve(__dirname, '../../../../../scripts/collector.js');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET environment variable is not configured' }, { status: 500 });
  }

  if (process.env.CRON_SECRET !== secret) {
    return NextResponse.json({ error: 'Unauthorized: invalid secret' }, { status: 401 });
  }

  // Verify collector script exists
  try {
    const { statSync } = await import('fs');
    if (!statSync(COLLECTOR_SCRIPT).isFile()) {
      return NextResponse.json({ error: 'Collector script not found' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Collector script not found' }, { status: 404 });
  }

  return new Promise<NextResponse>((resolve) => {
    const startTime = Date.now();

    const proc = spawn(
      'node',
      [COLLECTOR_SCRIPT],
      {
        cwd: path.dirname(COLLECTOR_SCRIPT),
        env: { ...process.env },
        timeout: 180000,
      }
    );

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', async (code) => {
      const elapsed = Date.now() - startTime;
      const lines = stdout.split('\n').filter(Boolean);
      const lastLines = lines.slice(-20);

      let opportunitiesCount = 0;
      try {
        const { readFileSync } = await import('fs');
        const dataPath = path.join(process.cwd(), 'public', 'data', 'opportunities.json');
        const raw = readFileSync(dataPath, 'utf8');
        const data = JSON.parse(raw);
        opportunitiesCount = Array.isArray(data) ? data.length : 0;
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
