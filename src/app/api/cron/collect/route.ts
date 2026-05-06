import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve collector script path relative to this file's location (not cwd)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.resolve(__dirname, '../../../../../scripts');
const COLLECTOR_SCRIPT = path.join(SCRIPTS_DIR, 'collector.js');
const COLLECT_ALL_SCRIPT = path.join(SCRIPTS_DIR, 'collect-all.js');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET environment variable is not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'standard'; // 'standard' | 'full'

  // Validate secret
  if (process.env.CRON_SECRET !== secret) {
    return NextResponse.json({ error: 'Unauthorized: invalid secret' }, { status: 401 });
  }

  const scriptToRun = mode === 'full' ? COLLECT_ALL_SCRIPT : COLLECTOR_SCRIPT;
  const scriptName = mode === 'full' ? 'collect-all.js' : 'collector.js';

  // Verify script exists
  try {
    const { statSync } = await import('fs');
    if (!statSync(scriptToRun).isFile()) {
      return NextResponse.json({ error: `${scriptName} not found` }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: `${scriptName} not found` }, { status: 404 });
  }

  return new Promise<NextResponse>((resolve) => {
    const startTime = Date.now();

    const proc = spawn(
      'node',
      [scriptToRun],
      {
        cwd: SCRIPTS_DIR,
        env: { ...process.env },
        timeout: mode === 'full' ? 600000 : 180000, // 10min for full suite, 3min for standard
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
        mode,
        script: scriptName,
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

    const timeout = mode === 'full' ? 600000 : 180000;
    setTimeout(() => {
      proc.kill();
      resolve(NextResponse.json({
        success: false,
        error: `Process timed out after ${timeout / 1000}s`,
      }, { status: 408 }));
    }, timeout);
  });
}
