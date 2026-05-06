#!/usr/bin/env node
/**
 * 出海通 AsiaBridge — 越南 FTA 关税数据采集器
 * =============================================
 * 数据源：
 *   - https://fta.moit.gov.vn (越南FTA关税门户)
 *   - RCEP, AANZFTA, EVFTA, ACFTA 等FTA关税信息
 *
 * 越南FTA关税门户提供中国-东盟自贸协定、RCEP等框架下的
 * 关税税率查询和贸易机会信息。
 *
 * 运行：
 *   node vnfta.js            # 采集FTA关税信息
 *   node vnfta.js --dry-run # 预览
 *
 * 参考：
 *   - daohoangson/js-fta-crawler (TypeScript原版)
 *   - https://fta.moit.gov.vn
 */

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_DIR     = path.join(__dirname, '..', 'public', 'data');
const LOG_DIR      = path.join(__dirname, '..', 'logs');
const LOG_FILE     = path.join(LOG_DIR, 'vnfta.log');
const TIMEOUT_MS   = 20000;
const CONTACT_EMAIL = 'zxq@zxqconsulting.com';

let IS_DRY_RUN = false;
for (const arg of process.argv) { if (arg === '--dry-run') IS_DRY_RUN = true; }

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6',
        'Referer': 'https://fta.moit.gov.vn/',
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
  return 'opp_vnfta_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

// ── Keywords ─────────────────────────────────────────────────────────────────
const CHINA_KW = [
  'Trung Quốc', '中国', 'China', 'Chinese',
  '中国向', '中国产', '中国制', '中国厂商', '中企',
  'việt-trung', 'Việt-Trung', 'hợp tác Trung Quốc',
  'nhập khẩu Trung Quốc', 'xuất khẩu Trung Quốc',
  'đầu tư Trung Quốc',
];

const BUSINESS_KW = [
  'tìm.*đối tác', 'tìm.*nhà cung cấp', 'tìm.*đại lý',
  'cần.*nhập.*Trung Quốc', 'nhập.*từ Trung Quốc',
  'xuất.*sang Trung Quốc', 'đầu tư.*Trung Quốc',
  'hợp tác.*Trung Quốc', 'việt-trung',
  'Trung Quốc.*đầu tư', 'Trung Quốc.*nhà máy',
  'seeking.*partner.*Vietnam', 'Vietnam.*Chinese supplier',
  'Vietnam.*China JV', 'Vietnam.*supply chain China',
];

const FTA_AGREEMENTS = [
  { name: 'RCEP', full: 'ASEAN+5 区域全面经济伙伴关系协定', countries: ['中国', '日本', '韩国', '澳大利亚', '新西兰'] },
  { name: 'AANZFTA', full: '东盟-澳大利亚-新西兰 FTA', countries: ['中国'] },
  { name: 'EVFTA', full: '欧盟-越南 FTA', countries: ['中国'] },
  { name: 'ACFTA', full: '中国-东盟 FTA', countries: ['中国'] },
  { name: 'VKFTA', full: '越南-韩国 FTA', countries: ['中国'] },
  { name: 'ATIGA', full: '东盟货物贸易协定', countries: ['中国'] },
];

const NOISE_RE = [
  /不起$/, /^[^\s]{0,10}$/,
  /vàng.*phục hồi/, /giá.*tuần/, /tỷ phú/, /bạc tỷ/,
  /lợi nhuận/, /doanh thu/, /tăng trưởng.*%/,
  /IPO/, /niêm yết/, /chứng khoán/, /cổ phiếu/,
  /COVID/, /pandemic/, /疫情/, /新冠/,
  /Russia.*Ukraine/, /Ukraine/,
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
  if (/điện tử|electronics|IC|bán dẫn|chip/i.test(text)) return '半导体/电子';
  if (/ô tô|EV|automotive|xe điện|battery/i.test(text)) return '新能源汽车';
  if (/dệt nhuộm|textile|vải|garment/i.test(text)) return '纺织服装';
  if (/nội thất|furniture|đồ gỗ/i.test(text)) return '家具制造';
  if (/thực phẩm|food|nông sản|agri/i.test(text)) return '食品农业';
  if (/nhựa|plastic|hóa chất|chemical/i.test(text)) return '化工材料';
  if (/dược phẩm|pharma|thuốc/i.test(text)) return '医疗器械';
  if (/công nghiệp|manufacturing|sản xuất/i.test(text)) return '综合商务';
  if (/thép|steel|gang|kim loại/i.test(text)) return '钢铁/金属';
  if (/năng lượng|energy|mặt trời|solar/i.test(text)) return '能源电力';
  return '综合商务';
}

function inferCooperationType(text) {
  text = text.substring(0, 500);
  if (/nhập khẩu|import|from China/i.test(text)) return 'supply';
  if (/xuất khẩu|export|to China/i.test(text)) return 'demand';
  if (/đầu tư|FDI|investment/i.test(text)) return 'investment';
  if (/hợp tác|joint venture|合资/i.test(text)) return 'joint-venture';
  if (/đại lý|distributor|franchise/i.test(text)) return 'agency';
  return 'cooperation';
}

// ── Fetch from fta.moit.gov.vn ─────────────────────────────────────────────
async function fetchFTAPortal() {
  log('Fetching from fta.moit.gov.vn (越南FTA关税门户)...');

  const results = [];

  // FTA门户主要页面
  const pages = [
    { url: 'https://fta.moit.gov.vn/', name: '首页' },
    { url: 'https://fta.moit.gov.vn/vi/news/thong-tin-chung', name: '新闻' },
    { url: 'https://fta.moit.gov.vn/vi/news/thong-tin-fta', name: 'FTA信息' },
  ];

  for (const page of pages) {
    try {
      log(`  Fetching ${page.name}...`);
      const html = await httpGet(page.url);
      const items = parseFTAHTML(html, page.name);
      results.push(...items);
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      log(`  WARN: ${page.name}: ${e.message}`);
    }
  }

  return results;
}

// ── Fetch Vietnam Customs / Trade Data ─────────────────────────────────────
// 越南海关数据门户
async function fetchVietnamCustoms() {
  log('Fetching from Vietnam Customs (海关数据)...');

  try {
    // 越南海关搜索接口
    const results = [];
    const searchTerms = [
      'nhập khẩu Trung Quốc', 'Trung Quốc nhập khẩu',
      'hợp tác Trung Quốc Việt Nam',
    ];

    for (const term of searchTerms) {
      try {
        const encoded = encodeURIComponent(term);
        // 越南海关数据搜索
        const url = `https://www.customs.gov.vn/SitePages/Trangchu.aspx`;
        const html = await httpGet(url);
        // 提取新闻/公告
        const items = parseCustomsPage(html, term);
        results.push(...items);
        await new Promise(r => setTimeout(r, 1500));
      } catch (e) {
        log(`  WARN: customs "${term}": ${e.message}`);
      }
    }
    return results;
  } catch (e) {
    log(`  WARN: Vietnam Customs unavailable: ${e.message}`);
    return [];
  }
}

// ── Fetch Vietnam Trade Promotion Portal ────────────────────────────────────
// 越南贸易促进局
async function fetchVietnamTradePromotion() {
  log('Fetching from Vietnam Trade Promotion (贸易促进局)...');

  try {
    // 越南贸易促进局 viettrade.gov.vn
    const results = [];
    const searchTerms = [
      'Trung Quốc', 'hợp tác', 'đầu tư', 'nhập khẩu', 'xuất khẩu',
    ];

    for (const term of searchTerms) {
      try {
        const encoded = encodeURIComponent(term);
        const url = `https://viettrade.gov.vn/vi/news?keyword=${encoded}`;
        const html = await httpGet(url);
        const items = parseTradePromoPage(html, term);
        results.push(...items);
        await new Promise(r => setTimeout(r, 1500));
      } catch (e) {
        log(`  WARN: viettrade "${term}": ${e.message}`);
      }
    }
    return results;
  } catch (e) {
    log(`  WARN: Vietnam Trade Promotion unavailable: ${e.message}`);
    return [];
  }
}

// ── Parse Functions ──────────────────────────────────────────────────────────
function parseFTAHTML(html, source) {
  const items = [];

  // 提取文章标题
  const titleRe = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  let m;
  while ((m = titleRe.exec(html)) !== null) {
    const raw = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (raw.length > 10 && !isNoise(raw, '')) {
      items.push({ title: raw.substring(0, 200), source });
    }
  }

  // 从链接提取
  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]{15,})<[^>]*>/gi;
  let lm;
  while ((lm = linkRe.exec(html)) !== null) {
    const title = lm[2].replace(/<[^>]+>/g, ' ').trim();
    const href = lm[1];
    if (title.length > 10 && !isNoise(title, '') && !href.includes('javascript')) {
      const existing = items.find(i => i.title.includes(title.substring(0, 30)));
      if (!existing) {
        items.push({
          title,
          source,
          link: href.startsWith('http') ? href : 'https://fta.moit.gov.vn' + href,
        });
      }
    }
  }

  return items.map(item => ({
    title: item.title,
    desc: `来源: ${item.source} (fta.moit.gov.vn) | FTA关税门户`,
    link: item.link || '',
    fta: 'FTA门户',
  }));
}

function parseCustomsPage(html, term) {
  const items = [];
  const titleRe = /<a[^>]+class=["'][^"']*news[^"']*["'][^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = titleRe.exec(html)) !== null) {
    const raw = m[1].replace(/<[^>]+>/g, ' ').trim();
    if (raw.length > 10 && !isNoise(raw, '')) {
      items.push({ title: raw.substring(0, 200), term });
    }
  }
  return items.map(item => ({
    title: item.title,
    desc: `来源: 越南海关 customs.gov.vn | 关键词: ${item.term}`,
    link: '',
    fta: '海关数据',
  }));
}

function parseTradePromoPage(html, term) {
  const items = [];
  const titleRe = /<h[234][^>]*>([\s\S]*?)<\/h[234]>/gi;
  let m;
  while ((m = titleRe.exec(html)) !== null) {
    const raw = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (raw.length > 10 && !isNoise(raw, '')) {
      items.push({ title: raw.substring(0, 200), term });
    }
  }
  return items.map(item => ({
    title: item.title,
    desc: `来源: 越南贸易促进局 viettrade.gov.vn | 关键词: ${item.term}`,
    link: '',
    fta: '贸易促进',
  }));
}

// ── Main ────────────────────────────────────────────────────────────────────
async function run() {
  log('========== 越南 FTA 关税采集器 启动 ==========');
  log(`Dry: ${IS_DRY_RUN}`);

  const allItems = [];

  const ftaItems = await fetchFTAPortal();
  log(`FTA门户: ${ftaItems.length} items`);
  allItems.push(...ftaItems);

  await new Promise(r => setTimeout(r, 1000));

  const customsItems = await fetchVietnamCustoms();
  log(`越南海关: ${customsItems.length} items`);
  allItems.push(...customsItems);

  await new Promise(r => setTimeout(r, 1000));

  const tradeItems = await fetchVietnamTradePromotion();
  log(`贸易促进: ${tradeItems.length} items`);
  allItems.push(...tradeItems);

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
    o.dataSource && o.dataSource.startsWith('vn-fta')
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
    country: 'vietnam',
    region: undefined,
    regionLabel: undefined,
    industry: inferIndustry(item.title + ' ' + item.desc),
    cooperationType: inferCooperationType(item.title + ' ' + item.desc),
    amount: undefined,
    currency: undefined,
    companyName: item.fta || '越南FTA关税门户 fta.moit.gov.vn',
    companyNameEn: 'Vietnam FTA Tariff Portal',
    contactEmail: CONTACT_EMAIL,
    publishedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    isPremium: true,
    dataSource: 'vn-fta-enhanced',
    _rawLink: item.link,
  }));

  const merged = [
    ...existing.filter(o => !o.dataSource || !o.dataSource.startsWith('vn-fta') || new Date(o.publishedAt) > thirtyDaysAgo),
    ...newEntries,
  ]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 500);

  fs.writeFileSync(oppPath, JSON.stringify(merged, null, 2));
  log(`Saved: ${merged.length} entries (${newEntries.length} new from Vietnam FTA)`);

  log('========== 采集完成 ==========');
}

run().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
