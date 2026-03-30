const https = require('https');
const http = require('http');

async function fetch(url, label) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const xml = Buffer.concat(chunks).toString('utf8');
        const items = (xml.match(/<item>/gi) || []).length;
        resolve({ label, status: res.statusCode, items, sz: xml.length });
      });
    });
    req.on('error', e => resolve({ label, status: 'err', items: 0, err: e.message.substring(0, 50) }));
    req.on('timeout', () => { req.destroy(); resolve({ label, status: 'timeout' }); });
    setTimeout(() => { if (!req.destroyed) { req.destroy(); resolve({ label, status: 'timeout' }); } }, 10000);
  });
}

const urls = [
  ['SG Asia One', 'https://www.asiaone.com/rss.xml'],
  ['KR Maeil', 'https://www.mk.co.kr/rss/news/news_section.xml'],
  ['KR Korea Times', 'https://www.koreatimes.co.kr/rss/news_section.xml'],
  ['KR Chosun', 'https://biz.chosun.com/rss/rss.xml'],
  ['ID Investor Daily', 'https://investor.id/rss'],
  ['ID Sindonews', 'https://english.sindonews.com/rss'],
  ['MY Focus Malaysia', 'https://focusmalaysia.my/rss.xml'],
  ['PH ABS-CBN', 'https://news.abs-cbn.com/rss/business'],
  ['IN Zee Biz', 'https://www.zeebiz.com/rss/topstories.xml'],
  ['IN Business Today', 'https://www.businesstoday.in/rssfeed/today.xml'],
  ['PK Daily Times', 'https://dailytimes.com.pk/rss/business.xml'],
  ['KH Phnom Penh Post', 'https://www.phnompenhpost.com/rss/business'],
  ['MM The Irrawaddy', 'https://www.irrawaddy.com/feed/business'],
  ['Global East Asia Forum', 'https://eastasiaforum.org/feed/'],
  ['Global Nikkei RSS', 'https://www.nikkei.com/content/rss2/nky.xml'],
];

(async () => {
  const r = await Promise.all(urls.map(([l, u]) => fetch(u, l)));
  r.forEach(x => {
    const icon = x.items > 5 ? '✅' : x.items > 0 ? '⚠️' : '❌';
    console.log(icon + ' [' + x.status + '] ' + x.label + ': ' + x.items + ' items' + (x.err ? ' (' + x.err + ')' : ''));
  });
})();
