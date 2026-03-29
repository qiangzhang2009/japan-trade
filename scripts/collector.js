#!/usr/bin/env node
/**
 * 中日经贸数据采集器 v6 — 精准过滤 + 零噪音
 * 
 * 核心策略：
 * - NHK 経済/政治/国際 = 日本权威经济来源
 * - BBC/NYT = 必须有明确的 CN-JP 关键词才保留
 * - 噪声过滤：大使馆事件、伊朗战争、地震、社会新闻全部排除
 * - 直接覆盖 news.json（每次都是最新真实数据）
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { batchTranslate } = require('./translation.js');
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'collector.log');
const RSS_FEEDS = [
  { url: 'https://www3.nhk.or.jp/rss/news/cat5.xml', source: 'NHK経済', type: 'jp' },
  { url: 'https://www3.nhk.or.jp/rss/news/cat4.xml', source: 'NHK政治', type: 'jp' },
  { url: 'https://www3.nhk.or.jp/rss/news/cat6.xml', source: 'NHK国際', type: 'jp' },
  { url: 'https://www3.nhk.or.jp/rss/news/cat1.xml', source: 'NHK国内', type: 'jp' },
  { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', source: 'BBC Asia', type: 'global' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC Business', type: 'global' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NYT World', type: 'global' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', source: 'NYT Business', type: 'global' },
];
// CN/JP 直接关系关键词（全球来源必须匹配）
const GEO_RELEVANCE = [
  /中日|Chinese.*Japan|Japan.*China|China-Japan|Japan-China/i,
  /中国.*日本|中国向け|中国市場|中国本土|中国側/i,
  /日本.*中国|東京都|GE.*日本|来日.*要人|訪中|日中/i,
  /対中|対日|中国側|中国企|中国産物/i,
  /Chinese.*(Japan|Japanese)|Japanese.*(China|Chinese)/i,
  /在华日系|日企.*中国|中企.*日本/i,
];
// 日本来源评分关键词
const JP_SCORE = [
  // CN/JP 直接关系 — 高分
  [/中国|中華人民共和国|訪中来日|日中関係|日中/i, 5],
  // 贸易政策
  [/輸出|輸入|禁輸|報復|制裁|関税/i, 3],
  [/EPA|FTA|RCEP|WTO|通商|批准|首脳/i, 3],
  // 重点产业
  [/半導|集積回路|IC|chips/i, 3],
  [/蓄電池|バッテリー|EV|リリウム|新能源/i, 3],
  [/医療|創薬|医薬/i, 2],
  [/農業|農産|JAS|食品/i, 2],
  [/水素|再エネ|エネルギー/i, 2],
  [/人民元|為替|円安/i, 2],
  [/M&A|合併|買収/i, 2],
  [/robot|自動化|AI/i, 1],
  [/robot|自動化|AI/i, 1],
];
// 噪声（标题含这些直接丢弃）
const NOISE_RE = [
  // 中东/伊朗战争
  /イラン.*軍事作戦|イラン.*攻撃|Houthis/i,
  /Russia.*Ukraine|Ukraine.*Russia|Putin|Zelensky|NATO.*Russia/i,
  /Middle East.*war|Iran.*war|oil market|energy crisis.*iran/i,
  // 大使馆/领事馆侵入（外交安全，非中日经贸）
  /大使[舘館]侵入|大師[舘館]侵入/i,
  // 国内社会新闻（无贸易价值）
  /不起不起|不起不起不起|不起不起不起不起不起不起/i,
  /不起$/,
  // 地震/海啸/地质灾害
  /震度\d|地震情報|了么|土砂崩れ|津浪|了么/i,
  // 证券/金融犯罪
  /証券口座|相場操縦|IPO.*中止|刑事事件/i,
  // 空标题
  /^.{0,5}$/,
];
function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (_) {}
}
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 JapanTradeBot/1.0' }
    }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        resolve(httpGet(res.headers.location));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}
function isNoise(title, desc) {
  const text = (title + ' ' + desc).substring(0, 500);
  for (const re of NOISE_RE) {
    if (re.test(text)) return true;
  }
  return false;
}
function hasGeoRelevance(title, desc) {
  const text = (title + ' ' + desc).substring(0, 500);
  return GEO_RELEVANCE.some(re => re.test(text));
}
function jpScoreCalc(title, desc) {
  const text = (title + ' ' + desc).substring(0, 500);
  return JP_SCORE.reduce((s, [re, pts]) => s + (re.test(text) ? pts : 0), 0);
}
function parseItems(xml) {
  if (!xml || xml.length < 100) return [];
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const gt = tag => {
      const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i').exec(b);
      const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(b);
      return cdata ? cdata[1].trim() : plain ? plain[1].trim() : '';
    };
    const rawTitle = gt('title').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    const rawDesc = (gt('description') + ' ' + gt('summary'))
      .replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!rawTitle || rawTitle.length < 5) continue;
    items.push({
      title: rawTitle,
      desc: rawDesc.substring(0, 400),
      link: gt('link'),
      pd: gt('pubDate') || gt('dc:date') || '',
      guid: gt('guid') || '',
    });
  }
  return items;
}
function inferCountry(title, desc) {
  const t = (title + ' ' + desc);
  if (/中国側|中国企|中国産物|中国市場|中国向け|GE.*日本来日|Chinese.*Japan(?!.*Korea)/i.test(t)) return 'cn';
  if (/日本側|株式会社|GE.*日本|来日.*要人|Japanese.*China(?!.*Korea)/i.test(t)) return 'jp';
  return 'bilateral';
}
function inferCategory(title, desc) {
  const t = (title + ' ' + desc);
  if (/関税|禁輸|EPA|FTA|RCEP|WTO|規制|制裁|通商|批准|訪中|来日|首脳|調査|対抗/i.test(t)) return 'policy';
  if (/博览会|展示会|conference|Exhibition/i.test(t)) return 'event';
  if (/市場|market|shop|retail|EC|越境/i.test(t)) return 'market';
  if (/輸出|輸入|trade|export|import|増産|減産/i.test(t)) return 'trade';
  return 'industry';
}
function extractTags(title, desc) {
  const t = (title + ' ' + desc);
  const tags = [];
  const map = [
    ['半导体', /半導|集積回路|semiconductor|IC|chips/i],
    ['锂电池', /蓄電池|锂离子|リリウム|バッテリー|lithium|battery/i],
    ['汽车', /EV|電気自動車|新能源車|automobile/i],
    ['氢能源', /水素|氢|hydrogen|再エネ/i],
    ['医药', /医療|医药|pharmaceutical|創薬/i],
    ['农业', /農業|农业|农产品/i],
    ['关税', /関税|关税|tariff|報複/i],
    ['电商', /EC|越境|跨境|e-commerce/i],
    ['AI', /AI|人工智能| deep.?learning/i],
    ['机器人', /robot|ロボット|automation/i],
    ['汇率', /為替|円安|人民元|USDJPY/i],
    ['投资', /投資|investment|M&A|合併|買収/i],
  ];
  for (const [tag, re] of map) {
    if (re.test(t)) tags.push(tag);
  }
  return [...new Set(tags)].slice(0, 4);
}
function slugify(text) {
  return text.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '').substring(0, 80);
}
function loadJSON(name) {
  try {
    const f = path.join(DATA_DIR, name);
    if (fs.existsSync(f)) {
      const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      return Array.isArray(d) ? d : [];
    }
  } catch (_) {}
  return [];
}
function saveJSON(name, data) {
  const f = path.join(DATA_DIR, name);
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(f, JSON.stringify(data, null, 2));
  log(`Saved ${name}: ${data.length} items`);
}
function triggerISR() {
  if (process.env.VERCEL_REVALIDATE_HOOK) {
    try {
      execSync(`curl -s --max-time 10 -X POST "${process.env.VERCEL_REVALIDATE_HOOK}"`, { timeout: 15000 });
      log('ISR OK');
    } catch (e) { log(`ISR fail: ${e.message}`); }
  }
}
async function run() {
  log('========== 采集开始 v6 ==========');
  const allNews = [];
  const stats = {};
  for (const feed of RSS_FEEDS) {
    log(`Fetching ${feed.source}...`);
    let xml;
    try {
      xml = await httpGet(feed.url);
    } catch (e) {
      log(`  FAIL: ${e.message}`);
      continue;
    }
    const raw = parseItems(xml);
    const kept = [];
    for (const item of raw) {
      // Step 1: 噪声过滤（最先执行）
      if (isNoise(item.title, item.desc)) continue;
      let score = 0;
      if (feed.type === 'global') {
        // 全球来源：必须有 CN/JP 关键词
        if (!hasGeoRelevance(item.title, item.desc)) continue;
        score = 5;
      } else {
        // 日本来源：评分 >= 4（必须有 CN/JP 关系含义）
        score = jpScoreCalc(item.title, item.desc);
        if (score < 4) continue;
      }
      const id = slugify(item.guid || item.link || item.title);
      kept.push({
        id,
        title: item.title,
        summary: item.desc.substring(0, 280) || '暂无摘要',
        source: feed.source,
        sourceUrl: item.link || '',
        category: inferCategory(item.title, item.desc),
        country: inferCountry(item.title, item.desc),
        tags: extractTags(item.title, item.desc),
        publishedAt: item.pd ? new Date(item.pd).toISOString() : new Date().toISOString(),
        isFeatured: score >= 5,
      });
    }
    log(`  ${raw.length} raw -> ${kept.length} kept`);
    stats[feed.source] = kept.length;
    allNews.push.apply(allNews, kept);
  }
  // 去重 + 排序
  const seen = {};
  const unique = allNews.filter(n => {
    const k = n.title.substring(0, 60);
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  });
  const sorted = unique
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 100);
  log(`News: ${unique.length} unique -> ${sorted.length} total`);
  log('Stats: ' + JSON.stringify(stats));

  // 翻译为中文（使用 DeepSeek API 或本地字典 fallback）
  log('Translating to Chinese...');
  const translated = await batchTranslate(sorted, process.env.DEEPSEEK_API_KEY);
  translated.forEach((item, i) => {
    sorted[i].titleCn = item.titleCn || sorted[i].title;
    sorted[i].summaryCn = item.summaryCn || sorted[i].summary;
  });
  log('Translation done');

  saveJSON('news.json', sorted);

  // =============================================
  // 商机采集：JETRO + 贸促会 + 贸易展会 RSS
  // =============================================
  const OPP_FEEDS = [
    { url: 'https://www.jetro.go.jp/rss/news.xml', source: 'JETRO日本贸易振兴机构', type: 'jp' },
    { url: 'https://www.ccpit.org/rss/news.xml', source: '中国贸促会', type: 'cn' },
    { url: 'https://www.nikkeibp.co.jp/rss/techbiz.rdf', source: '日经BP', type: 'jp' },
    { url: 'https://www.caefi.org.cn/rss.xml', source: '中日经济贸易信息', type: 'cn' },
    { url: 'https://www.ciie.org/rss/news', source: '中国国际进口博览会', type: 'cn' },
    { url: 'https://www.meti.go.jp/rss/seisansei/sangyo.xml', source: '日本经产省产业', type: 'jp' },
  ];

  const COUNTRY_PATTERNS = [
    [/中国|中国企業|Chinese|中華人民共和国|在华/i, 'cn'],
    [/日本|日系|Japanese|東京都|株式会社|（株）|経団連/i, 'jp'],
    [/日中|中日|两国|バイリンガル| bilateral /i, 'bilateral'],
  ];

  function inferOppCountry(title, desc) {
    const text = title + desc;
    for (const [pat, country] of COUNTRY_PATTERNS) {
      if (pat.test(text)) return country;
    }
    return 'bilateral';
  }

  const TYPE_PATTERNS = [
    [/募集|招募|Wanted |代理店|经销商|合伙人|供应|寻找合作/i, 'supply'],
    [/采购|Wanted |需求|募集|探す|仕入| OEM |ODM /i, 'demand'],
    [/投資|M&A|收购|合资|融资/i, 'investment'],
    [/共同研发|Joint |提携|合作|コンソーシアム|联盟/i, 'cooperation'],
  ];

  function inferOppType(title, desc) {
    const text = title + desc;
    for (const [pat, type] of TYPE_PATTERNS) {
      if (pat.test(text)) return type;
    }
    return 'demand';
  }

  const INDUSTRY_PATTERNS = [
    [/半導|集積回路|EV|蓄電池|バッテリー|新能源|リチウム/i, '半导体/新能源'],
    [/医療|医薬|創薬|制药|健康|长生/i, '医疗健康'],
    [/robot|ロボ|自動化|automation|FA |工作機械/i, '智能制造'],
    [/食品|農産| Agriculture |食品安全|検疫/i, '食品农业'],
    [/環境|水処理|省エネ|CO2|脱炭素/i, '环保节能'],
    [/化学|新材料|素材|ハイテク/i, '化工材料'],
    [/電子|精密|部品|デバイス/i, '精密制造'],
    [/物流|Eコマース|跨境|通関/i, '跨境电商'],
  ];

  function inferIndustry(title, desc) {
    const text = title + desc;
    for (const [pat, industry] of INDUSTRY_PATTERNS) {
      if (pat.test(text)) return industry;
    }
    return '综合商务';
  }

  async function collectOpportunities() {
    const newOpps = [];
    for (const feed of OPP_FEEDS) {
      try {
        log('Fetching opps from ' + feed.source + '...');
        const xml = await httpGet(feed.url);
        const items = parseItems(xml);
        log('  ' + items.length + ' items from ' + feed.source);
        for (const item of items) {
          const score = jpScoreCalc(item.title, item.desc);
          if (score < 3) continue;
          const type = inferOppType(item.title, item.desc);
          const industry = inferIndustry(item.title, item.desc);
          const country = inferOppCountry(item.title, item.desc);
          const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 90);
          const publishedAt = item.pd ? new Date(item.pd).toISOString() : new Date().toISOString();
          const id = 'auto_' + slugify(item.title).substring(0, 24) + '_' + Date.now();
          newOpps.push({
            id, title: item.title,
            titleCn: dictTranslate(item.title),
            description: (item.desc || '暂无详细描述').substring(0, 250),
            descriptionCn: dictTranslate((item.desc || '').substring(0, 250)),
            type, country, industry,
            amount: score >= 5 ? '面议（优选）' : '面议',
            currency: 'CNY',
            companyName: feed.source,
            contactEmail: 'contact@china-japan-trade.com',
            publishedAt, expiresAt: expiresAt.toISOString(),
            status: 'active', isPremium: score >= 5,
            region: feed.type === 'jp' ? '日本' : feed.type === 'cn' ? '中国' : '中日',
            source: feed.source,
          });
        }
      } catch (e) {
        log('  Opp fetch failed: ' + e.message.substring(0, 50));
      }
    }
    log('Auto opportunities: ' + newOpps.length + ' new items');
    return newOpps;
  }

  // 商机持久化
  let opps = loadJSON('opportunities.json');
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 6);
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeExisting = opps.filter(o => {
    if (o.status === 'closed') return false;
    if (o.expiresAt && new Date(o.expiresAt) < cutoff) return false;
    if (o.id && o.id.startsWith('auto_') && new Date(o.publishedAt) < thirtyDaysAgo) return false;
    return true;
  });

  try {
    const autoOpps = await collectOpportunities();
    const existingTitles = new Set(activeExisting.map(o => o.title.substring(0, 40)));
    const uniqueNew = autoOpps.filter(o => !existingTitles.has(o.title.substring(0, 40)));
    opps = [...activeExisting, ...uniqueNew];
    log('Opportunities: ' + opps.length + ' total (' + uniqueNew.length + ' new auto)');
  } catch (e) {
    opps = activeExisting;
    log('Opp collection failed, keeping ' + opps.length);
  }
  saveJSON('opportunities.json', opps.slice(0, 200));
  triggerISR();
  log('========== 完成 ==========');
  log(`Summary: ${sorted.length} news | ${opps.length} opportunities`);
}
run().then(() => process.exit(0)).catch(e => { log('ERR: ' + e.message); process.exit(1); });
