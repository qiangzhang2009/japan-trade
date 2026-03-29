/**
 * 中日经贸数据采集器 - 零成本自动化方案
 *
 * 使用方法:
 *   node scripts/collector.js
 *
 * 定时执行 (crontab -e):
 *   0 */6 * * * cd /path/to/project && node scripts/collector.js
 *
 * 或配合 GitHub Actions 使用 (见 .github/workflows/collect.yml)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ============== 配置 ==============
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'collector.log');

const RSS_FEEDS = {
  news: [
    { url: 'https://www.mofcom.gov.cn/article/rss/.xml', source: '商务部', country: 'cn' },
    { url: 'https://www.nikkei.com/rss/rss.aspx?ng=DP', source: '日本経済新聞', country: 'jp' },
    { url: 'https://www.jetro.go.jp/rss.html', source: 'JETRO', country: 'jp' },
  ],
};

const HTTP_TIMEOUT = 15000; // 15秒超时

// ============== 工具函数 ==============
function log(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}`;
  console.log(entry);

  try {
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, entry + '\n');
  } catch (e) {
    // 忽略日志写入错误
  }
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: HTTP_TIMEOUT }, (res) => {
      // 处理重定向
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        log(`Redirect: ${url} -> ${res.headers.location}`);
        resolve(httpGet(res.headers.location));
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const getTag = (tag) => {
      const m = itemXml.match(new RegExp(`<${tag}[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/${tag}|<${tag}[^>]*>([\s\S]*?)<\/${tag}`, 'i'));
      return m ? (m[1] || m[2] || '').trim() : '';
    };

    const title = getTag('title');
    const link = getTag('link');
    const description = getTag('description');
    const pubDate = getTag('pubDate');

    if (title) {
      items.push({ title, link, description, pubDate });
    }
  }

  return items;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

function estimateCategory(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  if (text.includes('政策') || text.includes('regulation') || text.includes('省') || text.includes('省')) return 'policy';
  if (text.includes('展会') || text.includes('博览会') || text.includes('conference') || text.includes('exhibition')) return 'event';
  if (text.includes('市场') || text.includes('电商') || text.includes('market') || text.includes('gmv')) return 'market';
  if (text.includes('行业') || text.includes('industry') || text.includes('合作') || text.includes('公司')) return 'industry';
  return 'trade';
}

// ============== 数据源采集 ==============
async function collectRSSFeed(feed) {
  try {
    log(`Fetching RSS: ${feed.url}`);
    const xml = await httpGet(feed.url);
    const items = parseRSS(xml);
    log(`  -> Got ${items.length} items from ${feed.source}`);

    return items.slice(0, 5).map((item) => ({
      id: slugify(item.title) + '-' + Date.now(),
      title: item.title || '无标题',
      summary: item.description
        .replace(/<[^>]+>/g, '')
        .substring(0, 300)
        .trim() || '暂无摘要',
      source: feed.source,
      sourceUrl: item.link || '',
      category: estimateCategory(item),
      country: feed.country,
      tags: [],
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      isFeatured: false,
    }));
  } catch (error) {
    log(`  -> ERROR fetching ${feed.url}: ${error.message}`);
    return [];
  }
}

async function collectFromNotion(databaseId, type) {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey || !databaseId) return [];

  try {
    log(`Fetching from Notion database: ${databaseId}`);
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_size: 20,
        sorts: [{ property: 'created_time', direction: 'descending' }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      log(`  -> Notion API error: ${data.message || response.statusText}`);
      return [];
    }

    log(`  -> Got ${data.results?.length || 0} items from Notion`);
    return data.results.map((page) => ({
      id: page.id,
      title: page.properties?.Name?.title?.[0]?.plain_text || '无标题',
      summary: page.properties?.Description?.rich_text?.[0]?.plain_text || '',
      source: 'Notion',
      sourceUrl: page.url || '',
      category: page.properties?.Category?.select?.name || 'trade',
      country: page.properties?.Country?.select?.name || 'bilateral',
      tags: page.properties?.Tags?.multi_select?.map((t) => t.name) || [],
      publishedAt: page.created_time,
      isFeatured: page.properties?.Featured?.checkbox || false,
    }));
  } catch (error) {
    log(`  -> Notion error: ${error.message}`);
    return [];
  }
}

// ============== 海关数据采集（模拟） ==============
async function collectCustomsData() {
  // 中国海关和统计数据需要官方账号，这里用结构化模拟
  // 真实场景: 可以接统计局API或手动更新CSV
  log('Customs data: using structured data (manual monthly update recommended)');

  return [
    { id: '1', hsCode: '8471', productName: '自动数据处理设备及部件', productNameJp: '自動データ処理装置及びその部品', cnExport: 125400, cnImport: 89200, jpExport: 45600, jpImport: 134500, trend: 'up', trendPercent: 8.3, month: '2026-02', year: 2026 },
    { id: '2', hsCode: '8542', productName: '集成电路及微电子组件', productNameJp: '電子、集積回路', cnExport: 98200, cnImport: 156800, jpExport: 67800, jpImport: 134200, trend: 'up', trendPercent: 12.1, month: '2026-02', year: 2026 },
    { id: '3', hsCode: '8507', productName: '锂离子蓄电池', productNameJp: 'リチウムイオン蓄電池', cnExport: 78900, cnImport: 23400, jpExport: 12300, jpImport: 82300, trend: 'up', trendPercent: 23.5, month: '2026-02', year: 2026 },
    { id: '4', hsCode: '8703', productName: '汽车及汽车底盘', productNameJp: '自動車及びその部品', cnExport: 45600, cnImport: 67800, jpExport: 89200, jpImport: 56700, trend: 'down', trendPercent: -5.2, month: '2026-02', year: 2026 },
    { id: '5', hsCode: '0306', productName: '鲜活及冷冻水产品', productNameJp: '生きている魚、冷凍魚', cnExport: 23400, cnImport: 34500, jpExport: 45600, jpImport: 12300, trend: 'up', trendPercent: 18.7, month: '2026-02', year: 2026 },
    { id: '6', hsCode: '5201', productName: '纺织纱线及织物', productNameJp: '紡織用糸及び織物', cnExport: 56700, cnImport: 12300, jpExport: 8900, jpImport: 67800, trend: 'stable', trendPercent: 1.2, month: '2026-02', year: 2026 },
    { id: '7', hsCode: '8473', productName: '机械零部件及附件', productNameJp: '機械類用の部品', cnExport: 34500, cnImport: 45600, jpExport: 56700, jpImport: 34500, trend: 'up', trendPercent: 6.8, month: '2026-02', year: 2026 },
    { id: '8', hsCode: '3004', productName: '医药品及制剂', productNameJp: '医薬品（制剂を含む）', cnExport: 12300, cnImport: 34500, jpExport: 56700, jpImport: 23400, trend: 'up', trendPercent: 9.4, month: '2026-02', year: 2026 },
  ];
}

// ============== 主采集流程 ==============
async function runCollection() {
  log('========== 开始数据采集 ==========');

  const results = {
    news: { fetched: 0, from: [] },
    opportunities: { fetched: 0 },
    tradeData: { fetched: 0 },
  };

  // 1. 从 RSS 采集新闻
  const newsItems = [];
  for (const feed of RSS_FEEDS.news) {
    const items = await collectRSSFeed(feed);
    newsItems.push(...items);
  }

  // 2. 从 Notion 采集（如果配置了）
  if (process.env.NEWS_DATABASE_ID) {
    const notionNews = await collectFromNotion(process.env.NEWS_DATABASE_ID, 'news');
    newsItems.push(...notionNews);
  }

  if (newsItems.length > 0) {
    // 去重（按标题）
    const seen = new Set();
    const uniqueNews = newsItems.filter((item) => {
      const key = item.title.substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 合并到现有数据（保留 mockData 的基础数据）
    const existingNewsPath = path.join(DATA_DIR, 'news.json');
    let existingNews = [];
    if (fs.existsSync(existingNewsPath)) {
      try {
        existingNews = JSON.parse(fs.readFileSync(existingNewsPath, 'utf8'));
      } catch (e) {
        existingNews = [];
      }
    }

    const mergedNews = [...uniqueNews, ...existingNews]
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 50); // 最多保留50条

    fs.writeFileSync(existingNewsPath, JSON.stringify(mergedNews, null, 2));
    results.news.fetched = uniqueNews.length;
    results.news.from = RSS_FEEDS.news.map((f) => f.source);
    log(`新闻已更新: ${uniqueNews.length} 条新数据 + ${existingNews.length} 条历史数据`);
  }

  // 3. 商机数据（Notion）
  if (process.env.OPPORTUNITIES_DATABASE_ID) {
    const opps = await collectFromNotion(process.env.OPPORTUNITIES_DATABASE_ID, 'opportunities');
    if (opps.length > 0) {
      const oppPath = path.join(DATA_DIR, 'opportunities.json');
      fs.writeFileSync(oppPath, JSON.stringify(opps, null, 2));
      results.opportunities.fetched = opps.length;
      log(`商机已更新: ${opps.length} 条`);
    }
  }

  // 4. 海关数据（月度手动更新提示）
  results.tradeData.fetched = 0;
  log('贸易数据: 建议每月手动从中国海关总署网站更新一次');

  // 5. 触发 Vercel ISR 重新验证
  if (process.env.VERCEL_REVALIDATE_HOOK) {
    try {
      log('触发 Vercel ISR 重新验证...');
      await fetch(process.env.VERCEL_REVALIDATE_HOOK, { method: 'POST' });
      log('Vercel ISR 触发成功');
    } catch (e) {
      log(`Vercel ISR 触发失败: ${e.message}`);
    }
  }

  log('========== 采集完成 ==========');
  log(JSON.stringify(results, null, 2));

  return results;
}

// ============== 入口 ==============
runCollection()
  .then((results) => {
    process.exit(0);
  })
  .catch((error) => {
    log(`采集器异常: ${error.message}`);
    process.exit(1);
  });
