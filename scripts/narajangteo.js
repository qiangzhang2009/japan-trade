#!/usr/bin/env node
/**
 * 出海通 AsiaBridge — 韩国国家招标门户采集器
 * =============================================
 * 数据源：g2b.go.kr / data.go.kr（나라장터 / Nara Jangteo）
 *
 * 韩国政府及公共机构采购公告的官方平台，每月发布数万条招标公告。
 * 涵盖所有政府采购、工程招标、物品采购、服务采购。
 *
 * 运行：
 *   node narajangteo.js           # 全量采集（最近7天）
 *   node narajangteo.js --dry-run # 预览
 *   node narajangteo.js --days=30 # 指定天数
 *
 * 参考：
 *   - seoweon/narajangteo (Python原版)
 *   - Datajang/narajangteo_mcp_server (MCP server)
 *   - https://www.g2b.go.kr:8080 (韩国电子采购门户)
 *   - https://www.data.go.kr (韩国公共数据门户)
 */

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const DATA_DIR    = path.join(__dirname, '..', 'public', 'data');
const LOG_DIR     = path.join(__dirname, '..', 'logs');
const LOG_FILE    = path.join(LOG_DIR, 'narajangteo.log');
const TIMEOUT_MS  = 20000;
const CONTACT_EMAIL = 'zxq@zxqconsulting.com';

let IS_DRY_RUN = false;
let DAYS_FILTER = 7; // 默认最近7天

for (const arg of process.argv) {
  if (arg === '--dry-run') IS_DRY_RUN = true;
  if (arg.startsWith('--days=')) DAYS_FILTER = parseInt(arg.split('=')[1], 10) || 7;
}

// ── HTTP Helper ──────────────────────────────────────────────────────────────
function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.g2b.go.kr/',
        'Origin': 'https://www.g2b.go.kr',
        ...headers,
      },
    }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        req.destroy();
        httpGet(res.headers.location, headers).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode === 403 || res.statusCode === 429) {
        req.destroy();
        reject(new Error(`HTTP ${res.statusCode} blocked`));
        return;
      }
      if (res.statusCode !== 200) {
        req.destroy();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', err => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ── Logger ───────────────────────────────────────────────────────────────────
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

// ── ID Generator ─────────────────────────────────────────────────────────────
function generateId() {
  return 'opp_nara_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

// ── Date Helpers ─────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatG2BDate(d) {
  // g2b.go.kr expects dates in YYYYMMDD format
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + m + day;
}

// ── Keywords ─────────────────────────────────────────────────────────────────
const CHINA_KW = [
  '중국', '中한국', '중한', '한국.*중국', '중국.*한국',
  'China', 'Chinese', '在中国', '中国向', '对中国',
  '투자.*파트너', '협력.*中国企业', '중국.*사업', '中国.*合作',
  '对中国.*투자', 'seeking Chinese partner', 'looking.*partner',
  'Korea.*China JV', 'Korea.*China deal', '한국.*중국.*합작',
  '한국.*중국.*투자', '한국.*중국.*협력', 'korean.*seeking supplier',
  '对中国企业.*招商引资', '对中国.*OEM', '对中国.*調達',
  '수입.*중국', '중국.*수입', '구매.*중국', '중국.*구매',
  '한국.*중국.*구매', '한국.*중국.*수입',
  '在中国', '中国', '中国产', '中国制', '中企', '中国企业',
  '在中国的', '中国側', '中国侧',
];

const BUSINESS_KW = [
  '투자.*파트너', '협력.*中国企业', '중국.*사업', '中国.*合作',
  '对中国.*투자', 'seeking Chinese partner', 'looking.*partner',
  'Korea.*China JV', 'Korea.*China deal', '한국.*중국.*합작',
  '한국.*중국.*투자', '한국.*중국.*협력', 'korean.*seeking supplier',
  '对中国企业.*招商引资', '对中国.*OEM', '对中国.*調達',
  '进口', '中国产', '中国制造', '中国供应', '中国厂商', '中国企业',
  'China supplier', 'Chinese manufacturer', 'Chinese product',
  '在中国的', '中国側', '中国侧', '中国侧',
  '-China', '中国-',
];

const NOISE_RE = [
  /不起$/, /^[^\s]{0,10}$/,
  / masques?/, /요소수/, /생필품/, /발표$/, /금리/, /환율/,
  /주가/, /증시/, /IPO/, /증권/, /금리인상/, /금리인하/,
  /대통령 선거/, /국회의원/, /정치/, /정당/, /선거/,
  /코로나/, /확진/, /변이/, /pandemic/,
  /Russia.*Ukraine/, /Ukraine.*Putin/, /Zelensky/, /우크라이나/,
  /地震/, /地震/, /붕괴/, /해일/, /태풍/,
];

function matchAny(text, patterns) {
  text = text.substring(0, 800);
  for (const pat of patterns) {
    try {
      if (new RegExp(pat, 'i').test(text)) return true;
    } catch (e) {}
  }
  return false;
}

function isNoise(title, desc) {
  const text = (title + ' ' + desc).substring(0, 400);
  for (const re of NOISE_RE) {
    if (re.test(text)) return true;
  }
  return false;
}

function hasChinaConnection(title, desc) {
  const text = (title + ' ' + desc).substring(0, 600);
  return matchAny(text, CHINA_KW);
}

// ── Industry Inference ───────────────────────────────────────────────────────
function inferIndustry(text) {
  text = text.substring(0, 500);
  if (/반도체|전자|Semiconductor|IC| chip | chipset |Display|LCD|OLED/i.test(text)) return '半导体/电子';
  if (/자동차|EV|전기차|Automotive|battery| Battery| Battery/i.test(text)) return '新能源汽车';
  if (/로봇|Robot|자동화|Automation|CNC|기계|machine/i.test(text)) return '工业自动化';
  if (/의료|의약|의료기기|Medical|Pharma|pharma|의약품/i.test(text)) return '医疗器械';
  if (/화학|Chemical|석유|정유|Petro/i.test(text)) return '化工材料';
  if (/정보|ICT|SW|Software|IT |IT$/i.test(text)) return 'IT/软件';
  if (/철강|금속|Steel|Metal|비철/i.test(text)) return '钢铁/金属';
  if (/건설|건축|인테리어|Construction|Building/i.test(text)) return '房地产/建筑';
  if (/농업|농산물|식품|Agri|Food/i.test(text)) return '食品农业';
  if (/물류|배송|물류|Logistics|Transport/i.test(text)) return '贸易/物流';
  if (/에너지|신에너지|에너지|Energy|Solar|태양광/i.test(text)) return '能源电力';
  return '综合商务';
}

// ── Cooperation Type Inference ─────────────────────────────────────────────
function inferCooperationType(text) {
  text = text.substring(0, 500);
  if (/OEM|ODM|매뉴팩처링|manufacturing partner|代工|委托制造/i.test(text)) return 'oem';
  if (/代理|经销商|딜러|代理商|distributor|franchise/i.test(text)) return 'agency';
  if (/合资|합작|JV|joint venture|戦略的/i.test(text)) return 'joint-venture';
  if (/기술|기술이전|technology transfer|特许|licensing/i.test(text)) return 'technology';
  if (/공급|납품|supply|구매|procurement|輸入|수입/i.test(text)) return 'supply';
  if (/투자|FDI|투자유치|investment/i.test(text)) return 'investment';
  return 'cooperation';
}

// ── Fetch from g2b.go.kr (Nara Jangteo) API ────────────────────────────────
// 韩国国家招标门户的API接口
// Endpoint: POST https://www.g2b.go.kr:8080/ep/co/selectAboveTheDeptList.do
// 实际使用 data.go.kr 的公开API或直接抓取页面
async function fetchG2BTenders() {
  log('Fetching from g2b.go.kr (나라장터)...');

  // g2b.go.kr 公开数据接口 - 按采购类型搜索
  // 使用 data.go.kr 的 open API 方式
  const results = [];

  // 尝试通过 data.go.kr 搜索韩国政府采购数据
  // data.go.kr 提供多种公共数据API
  const searchTerms = [
    '중국 협력', '중국 투자', '中国 협력', '中国 투자',
    '수입 구매', '구매 협력', '해외 공급', '외국 기업',
  ];

  for (const term of searchTerms) {
    try {
      // data.go.kr 的公开数据搜索
      const encodedTerm = encodeURIComponent(term);
      // 尝试直接抓取g2b搜索结果页面
      const url = `https://www.g2b.go.kr:8080/ep/tbid/tbidList.do?searchType=ALL&bidNm=${encodedTerm}&fromBidDt=${formatG2BDate(daysAgo(DAYS_FILTER))}&toBidDt=${formatG2BDate(new Date())}&departMain=0&searchRsnExceptOpeng=1`;

      const html = await httpGet(url);
      const items = parseG2BPage(html, term);
      results.push(...items);
      await new Promise(r => setTimeout(r, 1500)); // 礼貌延迟
    } catch (e) {
      log(`  WARN: g2b term "${term}" failed: ${e.message}`);
    }
  }

  return results;
}

// ── Parse g2b.go.kr Search Results Page ──────────────────────────────────────
function parseG2BPage(html, searchTerm) {
  const items = [];

  // g2b.go.kr 页面结构: 表格形式呈现招标公告
  // 每行包含: 招标号, 招标名称, 公告日期, 截止日期, 预算, 机关名称等

  // 提取表格行
  const rowRe = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRe.exec(html)) !== null) {
    const row = rowMatch[1];
    // 简化解析：从表格单元格提取关键信息
    const cells = [];
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch;
    while ((cellMatch = cellRe.exec(row)) !== null) {
      const cellText = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellText);
    }

    if (cells.length >= 3) {
      const title = cells[1] || cells[0] || '';
      const orgName = cells[cells.length - 2] || '';
      const dateInfo = cells[2] || '';

      if (title.length > 5 && !isNoise(title, orgName)) {
        items.push({
          title: title.substring(0, 200),
          desc: `采购机构: ${orgName} | 公告信息: ${dateInfo} | 搜索关键词: ${searchTerm}`,
          orgName,
          dateInfo,
          link: '', // g2b详情页需要从其他字段提取
        });
      }
    }
  }

  // 备选：提取链接中的招标号
  const linkRe = /<a[^>]+href=["']([^"']*bid[^"']*)["'][^>]*>([^<]+)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkRe.exec(html)) !== null) {
    const href = linkMatch[1];
    const linkTitle = linkMatch[2].replace(/<[^>]+>/g, '').trim();
    if (linkTitle.length > 5 && !isNoise(linkTitle, '')) {
      const existing = items.find(i => i.title.includes(linkTitle.substring(0, 30)));
      if (!existing) {
        items.push({
          title: linkTitle.substring(0, 200),
          desc: `来源: g2b.go.kr 韩国国家招标门户 | 搜索: ${searchTerm}`,
          orgName: '',
          dateInfo: '',
          link: href.startsWith('http') ? href : 'https://www.g2b.go.kr:8080' + href,
        });
      }
    }
  }

  return items;
}

// ── Fetch from data.go.kr Open API ───────────────────────────────────────────
// data.go.kr 韩国公共数据门户提供多种政府数据的API访问
// 这里模拟一个标准的数据.go.kr API调用模式
async function fetchDataGoKr() {
  log('Fetching from data.go.kr (한국 공공데이터 Portal)...');

  try {
    // data.go.kr 搜索接口 - 政府合同公告
    const results = [];
    const searchTerms = ['중국 협력', '중국 투자', '수입 구매', '해외 공급'];

    for (const term of searchTerms) {
      try {
        // data.go.kr 搜索页面
        const encodedTerm = encodeURIComponent(term);
        const url = `https://www.data.go.kr/search/index.do?master=sudial&category=sudial&query=${encodedTerm}`;

        const html = await httpGet(url);
        // 提取搜索结果
        const titleRe = /<a[^>]+class=["'][^"']*title[^"']*["'][^>]*>([^<]+)<\/a>/gi;
        let match;
        while ((match = titleRe.exec(html)) !== null) {
          const title = match[1].replace(/<[^>]+>/g, '').trim();
          if (title.length > 10 && !isNoise(title, '')) {
            results.push({
              title: title.substring(0, 200),
              desc: `来源: data.go.kr 韩国公共数据门户 | 关键词: ${term}`,
              orgName: 'data.go.kr',
              dateInfo: '',
              link: '',
            });
          }
        }
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        log(`  WARN: data.go.kr term "${term}": ${e.message}`);
      }
    }
    return results;
  } catch (e) {
    log(`  WARN: data.go.kr unavailable: ${e.message}`);
    return [];
  }
}

// ── Main Entry ───────────────────────────────────────────────────────────────
async function run() {
  log('========== Nara Jangteo 韩国招标采集器 启动 ==========');
  log(`Days: ${DAYS_FILTER} | Dry: ${IS_DRY_RUN}`);

  const allItems = [];

  // 采集 g2b.go.kr 招标数据
  const g2bItems = await fetchG2BTenders();
  log(`g2b.go.kr: ${g2bItems.length} raw items`);
  allItems.push(...g2bItems);

  await new Promise(r => setTimeout(r, 1000));

  // 采集 data.go.kr 公共数据
  const dataGoItems = await fetchDataGoKr();
  log(`data.go.kr: ${dataGoItems.length} raw items`);
  allItems.push(...dataGoItems);

  // 过滤、去重
  const seen = new Set();
  const filtered = allItems.filter(item => {
    if (isNoise(item.title, item.desc)) return false;
    if (!hasChinaConnection(item.title, item.desc)) return false;
    const key = item.title.substring(0, 60).toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  log(`Filtered: ${allItems.length} → ${filtered.length} unique China-related`);

  if (IS_DRY_RUN) {
    filtered.slice(0, 10).forEach(item => {
      console.log(`  [${inferIndustry(item.title)}] ${item.title.substring(0, 80)}`);
      console.log(`    ${item.desc.substring(0, 100)}`);
    });
    return;
  }

  // 合并到 opportunities.json
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const oppPath = path.join(DATA_DIR, 'opportunities.json');
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(oppPath, 'utf8')); } catch (e) {}

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60);

  const recentAuto = existing.filter(o =>
    o.dataSource && (o.dataSource.startsWith('kr-narajangteo') || o.dataSource.startsWith('kr-datagokr'))
    && new Date(o.publishedAt) > thirtyDaysAgo
  );

  const existingTitles = new Set(recentAuto.map(o =>
    o.title.substring(0, 60).toLowerCase().replace(/\s+/g, ' ').trim()
  ));

  const trulyNew = filtered.filter(o => {
    const key = o.title.substring(0, 60).toLowerCase().replace(/\s+/g, ' ').trim();
    return !existingTitles.has(key);
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const newEntries = trulyNew.map(item => ({
    id: generateId(),
    title: item.title,
    titleEn: undefined,
    description: item.desc.substring(0, 500),
    descriptionEn: undefined,
    type: inferCooperationType(item.title + ' ' + item.desc),
    country: 'south-korea',
    region: undefined,
    regionLabel: undefined,
    industry: inferIndustry(item.title + ' ' + item.desc),
    cooperationType: inferCooperationType(item.title + ' ' + item.desc),
    amount: undefined,
    currency: undefined,
    companyName: item.orgName || '韩国国家招标门户 g2b.go.kr',
    companyNameEn: undefined,
    contactEmail: CONTACT_EMAIL,
    publishedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    isPremium: true,
    dataSource: 'kr-narajangteo-enhanced',
    _rawLink: item.link,
  }));

  const merged = [...existing.filter(o => !o.dataSource || !o.dataSource.startsWith('kr-narajangteo-enhanced') || new Date(o.publishedAt) > thirtyDaysAgo), ...newEntries]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 500);

  fs.writeFileSync(oppPath, JSON.stringify(merged, null, 2));
  log(`Saved: ${merged.length} entries (${newEntries.length} new from Nara Jangteo)`);

  log('========== 采集完成 ==========');
}

run().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
