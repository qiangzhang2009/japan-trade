#!/usr/bin/env node
/**
 * 出海通 AsiaBridge — 全量采集调度器 v14
 * =============================================
 * 统一调度所有数据采集模块：
 *   1. collector.js        — RSS + HTML 新闻采集（多维度增强评分，44个数据源）
 *   2. narajangteo.js      — 韩国国家招标门户 (g2b.go.kr)
 *   3. twtender.js        — 中国台湾政府采购招标
 *   4. vnfta.js           — 越南FTA关税及贸易促进
 *   5. tradestats.js      — OEC/WB贸易统计数据（参考数据）
 *   6. hfdatasets.js      — HuggingFace 贸易/招标数据集采集
 *   7. crawl4ai_scraper.py — Crawl4AI 高级HTML解析（可选，需要pip安装）
 *
 * 运行：
 *   node collect-all.js              # 全量采集（所有模块串行运行）
 *   node collect-all.js --dry-run     # 预览模式
 *   node collect-all.js --module=narajangteo  # 只运行指定模块
 *   node collect-all.js --fast       # 并行运行（减少延迟）
 *
 * 建议运行频率：
 *   - 基础采集 (collector.js): 每小时
 *   - 招标采集 (narajangteo + twtender): 每6小时
 *   - 贸易统计 (tradestats.js): 每天
 *   - HuggingFace 数据集: 每周一次
 */

'use strict';

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_DIR  = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'collect-all.log');

const SCRIPTS = {
  collector: {
    name: '基础采集器 (RSS+HTML)',
    file: 'collector.js',
    args: [],
    timeout: 300, // 5min
    enabled: true,
  },
  narajangteo: {
    name: '韩国国家招标门户 (g2b.go.kr)',
    file: 'narajangteo.js',
    args: ['--days=7'],
    timeout: 120,
    enabled: true,
  },
  twtender: {
    name: '中国台湾政府采购招标',
    file: 'twtender.js',
    args: ['--days=30'],
    timeout: 120,
    enabled: true,
  },
  vnfta: {
    name: '越南FTA关税及贸易促进',
    file: 'vnfta.js',
    args: [],
    timeout: 120,
    enabled: true,
  },
  tradestats: {
    name: '亚洲贸易统计数据 (OEC/WB)',
    file: 'tradestats.js',
    args: [],
    timeout: 180,
    enabled: true,
  },
  hfdatasets: {
    name: 'HuggingFace 数据集采集 (贸易/招标)',
    file: 'hfdatasets.js',
    args: [],
    timeout: 300,
    enabled: true,
  },
  crawl4ai: {
    name: 'Crawl4AI 高级HTML解析 (需要pip install)',
    file: 'crawl4ai_scraper.py',
    args: [],
    timeout: 600, // 10min
    enabled: false, // 默认关闭，需要 pip install crawl4ai
    interpreter: 'python3',
  },
};

let IS_DRY_RUN = false;
let MODULE_FILTER = null;
let IS_FAST = false;

for (const arg of process.argv) {
  if (arg === '--dry-run') IS_DRY_RUN = true;
  if (arg.startsWith('--module=')) MODULE_FILTER = arg.split('=')[1];
  if (arg === '--fast') IS_FAST = true;
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = (IS_DRY_RUN ? '[DRY-RUN] ' : '') + '[' + ts + '] ' + msg;
  console.log(line);
  if (!IS_DRY_RUN) {
    try {
      if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
      fs.appendFileSync(LOG_FILE, line + '\n');
    } catch (e) {}
  }
}

function runScript(name, config) {
  const { file, args = [], timeoutSec = 120, interpreter = 'node' } = config;
  return new Promise((resolve) => {
    const fullArgs = [...args];
    if (IS_DRY_RUN) fullArgs.push('--dry-run');

    log(`\n=== 开始: ${name} ===`);

    const start = Date.now();
    const scriptPath = path.join(__dirname, file);
    const execCmd = interpreter;
    const execArgs = [scriptPath, ...fullArgs];

    try {
      const output = execSync(
        `${execCmd} ${execArgs.map(a => `'${a}'`).join(' ')}`,
        {
          timeout: timeoutSec * 1000,
          encoding: 'utf8',
          cwd: __dirname,
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      log(`=== 完成: ${name} (${elapsed}s) ===`);
      if (output && output.trim()) {
        console.log(output.trim().split('\n').slice(-5).join('\n'));
      }
      resolve({ name, success: true, elapsed, output });
    } catch (e) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const errorMsg = e.stderr || e.stdout || e.message;
      log(`=== 失败: ${name} (${elapsed}s) — ${errorMsg.substring(0, 200)} ===`);
      resolve({ name, success: false, elapsed, error: errorMsg });
    }
  });
}

async function runSequential(scripts) {
  const results = [];
  for (const [key, config] of Object.entries(scripts)) {
    if (!config.enabled) {
      log(`跳过 (已禁用): ${config.name}`);
      continue;
    }
    const result = await runScript(config.name, config);
    results.push(result);

    // 模块间延迟，避免请求过密
    await new Promise(r => setTimeout(r, 3000));
  }
  return results;
}

async function runParallel(scripts) {
  log('\n=== 快速模式: 并行运行所有模块 ===');

  const promises = Object.entries(scripts)
    .filter(([, config]) => config.enabled)
    .map(([key, config]) => runScript(config.name, config));

  const results = await Promise.all(promises);
  return results;
}

// ── Summary ─────────────────────────────────────────────────────────────────
function printSummary(results) {
  log('\n========== 采集汇总 ==========');

  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  log(`成功: ${succeeded.length}/${results.length} 模块`);
  if (failed.length > 0) {
    log('失败模块:');
    failed.forEach(r => log(`  - ${r.name}: ${r.error ? r.error.substring(0, 100) : 'unknown'}`));
  }

  // 读取 opportunities.json 统计
  try {
    const oppPath = path.join(__dirname, '..', 'public', 'data', 'opportunities.json');
    if (fs.existsSync(oppPath)) {
      const data = JSON.parse(fs.readFileSync(oppPath, 'utf8'));
      const opportunities = Array.isArray(data) ? data : (data.opportunities || []);
      const active = opportunities.filter(o => o.status === 'active');
      const premium = opportunities.filter(o => o.isPremium);

      log(`商机总数: ${opportunities.length} | 活跃: ${active.length} | 优质: ${premium.length}`);

      // 按国家分布
      const byCountry = {};
      active.forEach(o => { byCountry[o.country] = (byCountry[o.country] || 0) + 1; });
      const sorted = Object.entries(byCountry).sort((a, b) => b[1] - a[1]);
      log('按国家分布: ' + sorted.map(([c, n]) => `${c}:${n}`).join(' | '));

      // 按行业分布
      const byIndustry = {};
      active.forEach(o => { byIndustry[o.industry] = (byIndustry[o.industry] || 0) + 1; });
      const topIndustry = Object.entries(byIndustry).sort((a, b) => b[1] - a[1]).slice(0, 5);
      log('热门行业: ' + topIndustry.map(([i, n]) => `${i}:${n}`).join(' | '));
    }
  } catch (e) {
    log(`WARN: 无法读取商机数据统计: ${e.message}`);
  }

  log('==============================');
}

// ── Trigger ISR ──────────────────────────────────────────────────────────────
function triggerISR() {
  if (IS_DRY_RUN) return;
  if (process.env.VERCEL_REVALIDATE_HOOK) {
    try {
      execSync(`curl -s --max-time 15 -X POST "${process.env.VERCEL_REVALIDATE_HOOK}"`, { timeout: 20000 });
      log('ISR revalidation triggered');
    } catch (e) {
      log('ISR trigger WARN: ' + e.message.substring(0, 80));
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function run() {
  log('========================================');
  log('========== AsiaBridge 全量采集调度器 v14 启动 ==========');
  log('========================================');
  log(`模式: ${IS_DRY_RUN ? '预览' : IS_FAST ? '快速(并行)' : '标准(串行)'}`);

  // 筛选模块
  const scriptsToRun = {};
  if (MODULE_FILTER) {
    if (SCRIPTS[MODULE_FILTER]) {
      scriptsToRun[MODULE_FILTER] = SCRIPTS[MODULE_FILTER];
      log(`模块过滤: 只运行 ${SCRIPTS[MODULE_FILTER].name}`);
    } else {
      log(`未知模块: ${MODULE_FILTER}`);
      log('可用模块: ' + Object.keys(SCRIPTS).join(', '));
      return;
    }
  } else {
    Object.assign(scriptsToRun, SCRIPTS);
  }

  let results;
  if (IS_FAST) {
    results = await runParallel(scriptsToRun);
  } else {
    results = await runSequential(scriptsToRun);
  }

  printSummary(results);
  triggerISR();

  log('========================================');
  log('  全部采集完成');
  log('========================================');
}

run().catch(e => {
  log('FATAL: ' + e.message);
  process.exit(1);
});
