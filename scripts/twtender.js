#!/usr/bin/env node
/**
 * 出海通 AsiaBridge — 中国台湾政府采购招标采集器
 * =============================================
 * 数据源：
 *   - 政府电子采购网站 (https://web.pcc.gov.tw)
 *   - 台北市政府采购 (https://www.pcc.gov.tw)
 *
 * 台湾政府采购规模庞大，每月数万笔采购公告，
 * 包括工程、财物、劳务三大类采购。
 *
 * 运行：
 *   node twtender.js            # 全量采集（最近30天）
 *   node twtender.js --dry-run  # 预览
 *   node twtender.js --days=7   # 指定天数
 *
 * 参考：
 *   - hunglin59638/twtender (Python原版)
 *   - https://web.pcc.gov.tw (政府电子采购门户)
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR      = path.join(__dirname, '..', 'public', 'data');
const LOG_DIR       = path.join(__dirname, '..', 'logs');
const LOG_FILE      = path.join(LOG_DIR, 'twtender.log');
const TIMEOUT_MS    = 20000;
const CONTACT_EMAIL  = 'zxq@zxqconsulting.com';

let IS_DRY_RUN = false;
let DAYS_FILTER = 30;

for (const arg of process.argv) {
  if (arg === '--dry-run') IS_DRY_RUN = true;
  if (arg.startsWith('--days=')) DAYS_FILTER = parseInt(arg.split('=')[1], 10) || 30;
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://web.pcc.gov.tw/',
        ...headers,
      },
    }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        req.destroy();
        httpGet(res.headers.location, headers).then(resolve).catch(reject);
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

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Referer': 'https://web.pcc.gov.tw/',
        'Origin': 'https://web.pcc.gov.tw',
        ...headers,
      },
    }, res => {
      if (res.statusCode !== 200 && res.statusCode !== 201) { req.destroy(); reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', err => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(bodyStr);
    req.end();
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

function generateId() {
  return 'opp_tw_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── Keywords ─────────────────────────────────────────────────────────────────
const CHINA_KW = [
  '中国大陆', '中国内陆', '中国厂商', '台商', '台资',
  '两岸', '两岸贸易', '两岸经贸', 'ECFA', 'cross-strait',
  '中国台湾', 'Taiwan.*China', 'China.*Taiwan',
  'China', 'Chinese', '中国的', '中国向', '对中国',
  '对台', '台湾对中国', '台陆', '两岸四地',
  '港商', 'Hong Kong', '港资',
  '中国大陆厂商', '大陆制造', '陆制',
];

const BUSINESS_KW = [
  '中国大陆', '中国厂商', '中国供应商', '中国制造',
  'Taiwan.*China', 'China.*Taiwan', 'cross-strait', 'ECFA',
  '对台采购', '台商', '台资', '两岸贸易',
  '台湾对中国', '寻求中国', '中国合作',
  '港商', '港资', 'Hong Kong',
];

const NOISE_RE = [
  /不起$/, /^[^\s]{0,10}$/,
  /COVID|新冠|疫情|防疫/,
  /地震|海啸|台风|台风/,
  /选举|公投/,
  /股价|股价|证券|期货/,
  /汇率|币值/,
];

function matchAny(text, patterns) {
  text = text.substring(0, 800);
  for (const pat of patterns) {
    try { if (new RegExp(pat, 'i').test(text)) return true; } catch (e) {}
  }
  return false;
}

function isNoise(title, desc) {
  const text = (title + ' ' + desc).substring(0, 400);
  for (const re of NOISE_RE) { if (re.test(text)) return true; }
  return false;
}

function hasChinaConnection(title, desc) {
  const text = (title + ' ' + desc).substring(0, 600);
  return matchAny(text, CHINA_KW);
}

// ── Industry Inference ───────────────────────────────────────────────────────
function inferIndustry(text) {
  text = text.substring(0, 500);
  if (/半導|半導體|積體電路|IC|Semiconductor|IC設計|晶片|芯片/i.test(text)) return '半导体/电子';
  if (/電子|电机|資訊|ICT|Software|資訊系統|IT |科技/i.test(text)) return 'IT/软件';
  if (/汽車|電動車|EV|車輛|Automotive/i.test(text)) return '汽车/摩托车';
  if (/醫療|醫藥|製藥|醫材|醫療器材/i.test(text)) return '医疗器械';
  if (/機械|工具機|CNC|精密|工具機/i.test(text)) return '工业自动化';
  if (/化工|化學|塑膠|石化/i.test(text)) return '化工材料';
  if (/紡織|成衣|布料|織品/i.test(text)) return '纺织服装';
  if (/食品|農產|水產|農漁/i.test(text)) return '食品农业';
  if (/能源|光電|太陽能|儲能|風電/i.test(text)) return '能源电力';
  if (/營建|建築|景觀|裝修/i.test(text)) return '房地产/建筑';
  if (/物流|運輸|貨運|船務/i.test(text)) return '贸易/物流';
  if (/金融|銀行|保險|Fintech|支付/i.test(text)) return '金融科技';
  if (/鋼鐵|金屬|鋁|銅|特殊鋼/i.test(text)) return '钢铁/金属';
  return '综合商务';
}

function inferCooperationType(text) {
  text = text.substring(0, 500);
  if (/OEM|ODM|代工|委託製造|製造商/i.test(text)) return 'oem';
  if (/代理|經銷|經銷商|代理商/i.test(text)) return 'agency';
  if (/合資|JV|合资|合作/i.test(text)) return 'joint-venture';
  if (/技術轉讓|技術移轉|授权|授權/i.test(text)) return 'technology';
  if (/供應|供貨|採購|採購|輸入/i.test(text)) return 'supply';
  if (/投資|FDI|設廠|設立/i.test(text)) return 'investment';
  return 'cooperation';
}

function inferRegion(text) {
  text = text.substring(0, 300);
  if (/台北|新北|桃園|基隆|汐止|士林/i.test(text)) return 'tw-taipei';
  if (/新竹|竹北|竹南|苗栗/i.test(text)) return 'tw-hsinchu';
  if (/高雄|台南|屏東|嘉義/i.test(text)) return 'tw-kaohsiung';
  if (/台中|彰化|南投|雲林/i.test(text)) return 'tw-other';
  return 'tw-other';
}

const REGION_LABELS = {
  'tw-taipei': '中国台北新北桃园大都会',
  'tw-hsinchu': '中国新竹科学园区',
  'tw-kaohsiung': '中国高雄台南南台湾',
  'tw-other': '中国台湾其他地区',
};

// ── Fetch Taiwan PCC Tender API ─────────────────────────────────────────────
// 台湾政府电子采购网站的搜索API
// https://web.pcc.gov.tw 提供采购公告查询服务
async function fetchPCTTenders() {
  log('Fetching from web.pcc.gov.tw (政府電子採購)...');

  const results = [];
  const categories = [
    { name: '财物采购', code: 'CA' },
    { name: '工程采购', code: 'CB' },
    { name: '劳务采购', code: 'CC' },
  ];

  // 两岸/中国相关采购搜索关键词
  const searchTerms = [
    '中国', '大陆', '中国制造', '两岸', '台商', 'cross-strait',
  ];

  for (const { name, code } of categories) {
    for (const term of searchTerms) {
      try {
        const encoded = encodeURIComponent(term);
        // PCC采购搜索URL格式
        const url = `https://web.pcc.gov.tw/prms/report/tenderReport?searchType=advance&category=${code}&query=${encoded}`;

        const html = await httpGet(url);
        const items = parsePCCPage(html, term, code);
        results.push(...items);
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        log(`  WARN: PCC ${name} "${term}": ${e.message}`);
      }
    }
  }

  return results;
}

// ── Parse PCC Page ──────────────────────────────────────────────────────────
function parsePCCPage(html, searchTerm, category) {
  const items = [];

  // 提取采购名称
  const titleRe = /<td[^>]*headers=["']tenderName["'][^>]*>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = titleRe.exec(html)) !== null) {
    const raw = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (raw.length > 5 && !isNoise(raw, '')) {
      items.push({ title: raw.substring(0, 200), searchTerm, category, rawHtml: m[1] });
    }
  }

  // 备选：从链接提取
  if (items.length === 0) {
    const linkRe = /<a[^>]+href=["']([^"']*pcc[^"']*)["'][^>]*>([^<]{10,})<[^>]*>/gi;
    let lm;
    while ((lm = linkRe.exec(html)) !== null) {
      const title = lm[2].replace(/<[^>]+>/g, ' ').trim();
      if (!isNoise(title, '')) {
        items.push({ title: title.substring(0, 200), searchTerm, category, link: lm[1] });
      }
    }
  }

  return items.map(item => ({
    title: item.title,
    desc: `采购类别: ${item.category} | 搜索关键词: ${item.searchTerm} | 来源: 台湾政府电子采购`,
    category: item.category,
    link: item.link || '',
  }));
}

// ── Fetch Taiwan GCIO (Government Cheung) ───────────────────────────────────
// 台湾政府资料开放平台 - 可能有采购数据
async function fetchTaiwanOpenData() {
  log('Fetching from data.gov.tw (政府資料開放平台)...');

  try {
    const results = [];
    // data.gov.tw 搜索接口
    const searchTerms = ['两岸贸易', '对中国采购', '大陆制造', '台商'];

    for (const term of searchTerms) {
      try {
        const encoded = encodeURIComponent(term);
        const url = `https://data.gov.tw/search?r=1&q=${encoded}&type=dataset`;

        const html = await httpGet(url);
        // 提取数据集标题
        const titleRe = /<a[^>]+class=["'][^"']*result-title[^"']*["'][^>]*>([^<]+)<\/a>/gi;
        let m;
        while ((m = titleRe.exec(html)) !== null) {
          const title = m[1].replace(/<[^>]+>/g, ' ').trim();
          if (title.length > 5 && !isNoise(title, '')) {
            results.push({
              title: title.substring(0, 200),
              desc: `来源: data.gov.tw 政府资料开放平台 | 关键词: ${term}`,
              category: '开放数据',
              link: '',
            });
          }
        }
        await new Promise(r => setTimeout(r, 1500));
      } catch (e) {
        log(`  WARN: data.gov.tw "${term}": ${e.message}`);
      }
    }
    return results;
  } catch (e) {
    log(`  WARN: data.gov.tw unavailable: ${e.message}`);
    return [];
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function run() {
  log('========== 中国台湾政府采购采集器 启动 ==========');
  log(`Days: ${DAYS_FILTER} | Dry: ${IS_DRY_RUN}`);

  const allItems = [];

  const pccItems = await fetchPCTTenders();
  log(`PCC采购: ${pccItems.length} items`);
  allItems.push(...pccItems);

  await new Promise(r => setTimeout(r, 1000));

  const openDataItems = await fetchTaiwanOpenData();
  log(`政府开放数据: ${openDataItems.length} items`);
  allItems.push(...openDataItems);

  // 过滤
  const seen = new Set();
  const filtered = allItems.filter(item => {
    if (isNoise(item.title, item.desc)) return false;
    if (!hasChinaConnection(item.title, item.desc)) return false;
    const key = item.title.substring(0, 50).toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  log(`Filtered: ${allItems.length} → ${filtered.length} China-related`);

  if (IS_DRY_RUN) {
    filtered.slice(0, 10).forEach(item => {
      console.log(`  [${inferIndustry(item.title)}] ${item.title.substring(0, 80)}`);
      console.log(`    ${item.desc.substring(0, 100)}`);
    });
    return;
  }

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const oppPath = path.join(DATA_DIR, 'opportunities.json');
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(oppPath, 'utf8')); } catch (e) {}

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60);

  const recentAuto = existing.filter(o =>
    o.dataSource && o.dataSource.startsWith('tw-tender')
    && new Date(o.publishedAt) > thirtyDaysAgo
  );

  const existingTitles = new Set(recentAuto.map(o =>
    o.title.substring(0, 50).toLowerCase().replace(/\s+/g, ' ').trim()
  ));

  const trulyNew = filtered.filter(o => {
    const key = o.title.substring(0, 50).toLowerCase().replace(/\s+/g, ' ').trim();
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
    country: 'taiwan',
    region: inferRegion(item.title + ' ' + item.desc),
    regionLabel: REGION_LABELS[inferRegion(item.title + ' ' + item.desc)],
    industry: inferIndustry(item.title + ' ' + item.desc),
    cooperationType: inferCooperationType(item.title + ' ' + item.desc),
    amount: undefined,
    currency: undefined,
    companyName: '中国台湾政府采购 web.pcc.gov.tw',
    companyNameEn: 'Taiwan Government Procurement',
    contactEmail: CONTACT_EMAIL,
    publishedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    isPremium: true,
    dataSource: 'tw-tender-enhanced',
    _rawLink: item.link,
  }));

  const merged = [
    ...existing.filter(o => !o.dataSource || !o.dataSource.startsWith('tw-tender') || new Date(o.publishedAt) > thirtyDaysAgo),
    ...newEntries,
  ]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 500);

  fs.writeFileSync(oppPath, JSON.stringify(merged, null, 2));
  log(`Saved: ${merged.length} entries (${newEntries.length} new from Taiwan PCC)`);

  log('========== 采集完成 ==========');
}

run().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
