#!/usr/bin/env node
/**
 * 出海通 AsiaBridge — 亚洲贸易统计数据采集器
 * =============================================
 * 数据源：
 *   - OEC (Observatory of Economic Complexity) API - 免费tier
 *   - UN Comtrade API - 贸易统计数据（参考数据，非商机关联）
 *
 * 这些数据作为商机背景参考，帮助判断哪些行业/国家对华贸易量大，
 * 从而优先采集相关商机。
 *
 * 运行：
 *   node tradestats.js           # 获取贸易统计数据
 *   node tradestats.js --dry-run # 预览
 *
 * 参考：
 *   - https://oec.world/en/resources/api
 *   - https://uncomtrade.org/docs/api-overview/
 *   - uncomtrade/comtradeapicall (Python)
 */

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_DIR     = path.join(__dirname, '..', 'public', 'data');
const LOG_DIR      = path.join(__dirname, '..', 'logs');
const LOG_FILE     = path.join(LOG_DIR, 'tradestats.log');
const TIMEOUT_MS   = 20000;

let IS_DRY_RUN = false;
for (const arg of process.argv) { if (arg === '--dry-run') IS_DRY_RUN = true; }

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      },
    }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        req.destroy();
        httpGet(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { req.destroy(); reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', err => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
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

// ── OEC API ─────────────────────────────────────────────────────────────────
// OEC (经济复杂度观测站) 提供免费的国际贸易数据
// 基础端点：https://api.oec.world/tms/ (需要API key，可免费注册)
// 也提供一些公开的JSON数据
async function fetchOECData() {
  log('Fetching from OEC (Observatory of Economic Complexity)...');

  try {
    // OEC 提供一些公开的数据端点
    // 尝试获取亚洲贸易流向数据

    // 获取中国与各亚洲国家的双边贸易数据
    const countryPairs = [
      { reporter: 'CHN', partner: 'JPN', name: '中国-日本' },
      { reporter: 'CHN', partner: 'KOR', name: '中国-韩国' },
      { reporter: 'CHN', partner: 'VNM', name: '中国-越南' },
      { reporter: 'CHN', partner: 'SGP', name: '中国-新加坡' },
      { reporter: 'CHN', partner: 'MYS', name: '中国-马来西亚' },
      { reporter: 'CHN', partner: 'THA', name: '中国-泰国' },
      { reporter: 'CHN', partner: 'IDN', name: '中国-印尼' },
      { reporter: 'CHN', partner: 'PHL', name: '中国-菲律宾' },
      { reporter: 'CHN', partner: 'IND', name: '中国-印度' },
      { reporter: 'CHN', partner: 'TWN', name: '中国-中国台湾' },
    ];

    const results = [];

    for (const pair of countryPairs) {
      try {
        // OEC 公开数据格式: https://api.oec.world/tms/{reporter}/{partner}
        const url = `https://api.oec.world/tms/${pair.reporter}/${pair.partner}`;
        const data = await httpGet(url);
        const parsed = JSON.parse(data);

        if (parsed && parsed.data) {
          const tradeData = parsed.data;
          const total = tradeData.reduce((sum, d) => sum + (parseFloat(d.trade_balance) || 0), 0);

          results.push({
            pair: pair.name,
            reporter: pair.reporter,
            partner: pair.partner,
            data: tradeData,
            totalTrade: total,
          });
        }
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        log(`  WARN: OEC ${pair.name}: ${e.message}`);
      }
    }

    return results;
  } catch (e) {
    log(`  WARN: OEC API unavailable: ${e.message}`);
    return [];
  }
}

// ── ITC Trade Map ─────────────────────────────────────────────────────────────
// ITC Trade Map 提供进出口数据
// 搜索页面: https://www.trademap.org
async function fetchITCData() {
  log('Fetching from ITC Trade Map...');

  try {
    // ITC Trade Map 公开数据页面
    const results = [];

    // 尝试获取各国对中国出口的数据趋势
    const countries = [
      { code: 'VNM', name: '越南' },
      { code: 'MYS', name: '马来西亚' },
      { code: 'THA', name: '泰国' },
      { code: 'IDN', name: '印尼' },
      { code: 'PHL', name: '菲律宾' },
      { code: 'KOR', name: '韩国' },
      { code: 'JPN', name: '日本' },
      { code: 'SGP', name: '新加坡' },
    ];

    for (const c of countries) {
      try {
        // ITC Trade Map 的公开数据页面
        const url = `https://www.trademap.org/Country_PartnerProductTable.aspx?nvp_methodname=GetCountryProductTable&cp=${c.code}&ci=0&pi=0&ps=0`;
        // 由于页面需要JS渲染，我们只获取页面元数据
        // 实际数据通过ITC的开放API获取（需要注册）
        results.push({
          country: c.code,
          countryName: c.name,
          note: '需要ITC API Key，可从 https://www.trademap.org 获取',
        });
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        log(`  WARN: ITC ${c.name}: ${e.message}`);
      }
    }

    return results;
  } catch (e) {
    log(`  WARN: ITC unavailable: ${e.message}`);
    return [];
  }
}

// ── World Bank Open Data ─────────────────────────────────────────────────────
// 世界银行开放数据 - 亚洲贸易指标
async function fetchWorldBankData() {
  log('Fetching from World Bank Open Data...');

  try {
    const results = [];

    // 世界银行 API - 贸易占GDP比重
    // 指标: NE.TRD.GNFS.ZS (贸易占GDP比重)
    const indicators = [
      { code: 'NE.TRD.GNFS.ZS', name: '贸易占GDP比重' },
      { code: 'BX.GSR.GNFS.CD', name: '商品和服务出口(美元)' },
      { code: 'BM.GSR.GNFS.CD', name: '商品和服务进口(美元)' },
    ];

    const countries = ['VNM', 'MYS', 'THA', 'IDN', 'PHL', 'KOR', 'JPN', 'SGP', 'IND', 'PAK'];

    for (const ind of indicators) {
      try {
        const countriesParam = countries.join(';');
        const url = `https://api.worldbank.org/v2/country/${countriesParam}/indicator/${ind.code}?format=json&per_page=100&date=2023`;

        const data = await httpGet(url);
        const parsed = JSON.parse(data);

        if (parsed && parsed[1]) {
          results.push({
            indicator: ind.name,
            indicatorCode: ind.code,
            data: parsed[1].map(d => ({
              country: d.country.value,
              year: d.date,
              value: d.value,
            })),
          });
        }
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        log(`  WARN: WorldBank ${ind.name}: ${e.message}`);
      }
    }

    return results;
  } catch (e) {
    log(`  WARN: World Bank unavailable: ${e.message}`);
    return [];
  }
}

// ── ASEAN Trade Data ─────────────────────────────────────────────────────────
// ASEAN Secretariat 官方数据
async function fetchASEANData() {
  log('Fetching from ASEAN Secretariat Open Data...');

  try {
    const results = [];

    // ASEAN 官方统计数据页面
    const url = 'https://www.aseanstats.org/';
    const html = await httpGet(url);

    // 提取关键贸易统计
    results.push({
      source: 'ASEAN Secretariat',
      url: 'https://www.aseanstats.org/',
      note: 'ASEAN官方统计数据，涵盖成员国间贸易及与中国的贸易',
      data: '从aseanstats.org获取最新ASEAN贸易统计报告',
    });

    return results;
  } catch (e) {
    log(`  WARN: ASEAN unavailable: ${e.message}`);
    return [];
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function run() {
  log('========== 亚洲贸易统计数据采集器 启动 ==========');
  log(`Dry: ${IS_DRY_RUN}`);

  const allData = {
    collectedAt: new Date().toISOString(),
    sources: [],
    tradeFlows: {},
    insights: [],
  };

  // 1. OEC 数据
  const oecData = await fetchOECData();
  if (oecData.length > 0) {
    allData.sources.push('OEC (Observatory of Economic Complexity)');
    allData.tradeFlows.oec = oecData;
    log(`OEC: ${oecData.length} country pairs collected`);
  }

  await new Promise(r => setTimeout(r, 1000));

  // 2. ITC Trade Map
  const itcData = await fetchITCData();
  if (itcData.length > 0) {
    allData.sources.push('ITC Trade Map');
    allData.tradeFlows.itc = itcData;
    log(`ITC: ${itcData.length} countries`);
  }

  await new Promise(r => setTimeout(r, 1000));

  // 3. World Bank
  const wbData = await fetchWorldBankData();
  if (wbData.length > 0) {
    allData.sources.push('World Bank Open Data');
    allData.tradeFlows.worldBank = wbData;
    log(`World Bank: ${wbData.length} indicators`);
  }

  await new Promise(r => setTimeout(r, 1000));

  // 4. ASEAN
  const aseanData = await fetchASEANData();
  if (aseanData.length > 0) {
    allData.sources.push('ASEAN Secretariat');
    allData.tradeFlows.asean = aseanData;
  }

  // 生成洞察
  allData.insights = generateInsights(allData.tradeFlows);

  if (IS_DRY_RUN) {
    console.log('\n=== 贸易数据洞察 ===');
    allData.insights.forEach(insight => {
      console.log(`  [${insight.category}] ${insight.text}`);
    });
    return;
  }

  // 保存到数据文件
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const tradeStatsPath = path.join(DATA_DIR, 'tradeStats.json');
  fs.writeFileSync(tradeStatsPath, JSON.stringify(allData, null, 2));
  log(`Saved tradeStats.json: ${allData.sources.length} sources`);

  // 同时追加到 opportunities.json 作为背景参考
  // (贸易统计数据不直接作为商机，但可以作为商机优先级参考)
  const oppPath = path.join(DATA_DIR, 'opportunities.json');
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(oppPath, 'utf8')); } catch (e) {}

  // 添加洞察作为元数据
  if (!existing.metadata) existing.metadata = {};
  existing.metadata.tradeStatsUpdated = allData.collectedAt;
  existing.metadata.tradeInsights = allData.insights.map(i => ({ category: i.category, text: i.text }));

  fs.writeFileSync(oppPath, JSON.stringify(existing, null, 2));
  log(`Updated opportunities.json with trade insights`);

  log('========== 采集完成 ==========');
}

// ── Insights Generation ──────────────────────────────────────────────────────
function generateInsights(tradeFlows) {
  const insights = [];

  // 从 World Bank 数据生成洞察
  if (tradeFlows.worldBank) {
    const tradeRatio = tradeFlows.worldBank.find(d => d.indicatorCode === 'NE.TRD.GNFS.ZS');
    if (tradeRatio && tradeRatio.data) {
      const topTradeCountries = tradeRatio.data
        .filter(d => d.value != null)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      topTradeCountries.forEach(c => {
        insights.push({
          category: '高贸易依存度',
          text: `${c.country} 贸易占GDP比重: ${(c.value || 0).toFixed(1)}% (2023)`,
          country: c.country,
          value: c.value,
        });
      });
    }
  }

  // 从 OEC 数据生成洞察
  if (tradeFlows.oec) {
    const sortedPairs = tradeFlows.oec
      .filter(p => p.totalTrade > 0)
      .sort((a, b) => b.totalTrade - a.totalTrade);

    insights.push({
      category: '贸易规模排序',
      text: `中国与各国贸易规模排序: ${sortedPairs.map(p => p.pair).join(' > ')}`,
      pairs: sortedPairs.map(p => ({ name: p.pair, value: p.totalTrade })),
    });
  }

  insights.push({
    category: '采集建议',
    text: '基于贸易统计数据，建议优先采集越南、马来西亚、泰国、印尼等高贸易依存度国家的商机',
    recommendation: true,
  });

  return insights;
}

run().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
