#!/usr/bin/env node
/**
 * 中日经贸翻译服务
 * DeepSeek API + 逐词字典 fallback
 */

const https = require('https');

// ============== 逐词翻译字典 ==============
const JP_DICT = [
  ['外相', '外务大臣'], ['防衛相', '防卫大臣'], ['官房长官', '内阁官房长官'],
  ['防衛省', '防卫省'], ['経済フォーラム', '经济论坛'], ['税関当局', '海关当局'],
  ['拘束', '扣押'], ['保釈', '保释'], ['訪中', '访华'], ['来日', '来日'],
  ['対中', '对华'], ['中日関係', '中日关系'], ['中日', '中日'],
  ['首脳', '首脑'], ['外相会合', '外长会议'], ['基本合意', '基本达成一致'],
  ['統合交渉', '整合谈判'], ['統合', '整合'], ['交渉', '谈判'], ['協議', '协商'],
  ['調査', '调查'], ['対抗', '对抗'], ['差し止め', '叫停'], ['措置', '措施'],
  ['輸出', '出口'], ['輸入', '进口'], ['禁輸', '禁运'], ['報復', '报复'],
  ['制裁', '制裁'], ['関税', '关税'], ['EPA', 'EPA（经济合作协定）'],
  ['FTA', 'FTA（自由贸易协定）'], ['RCEP', 'RCEP（区域全面经济伙伴关系协定）'],
  ['WTO', 'WTO（世界贸易组织）'], ['半導', '半导体'], ['集積回路', '集成电路'],
  ['パワー半導', '功率半导体'], ['蓄電池', '蓄电池'], ['バッテリー', '电池'],
  ['EV', '电动汽车'], ['新能源', '新能源'], ['再エネ', '可再生能源'],
  ['水素', '氢能'], ['医療', '医疗'], ['創薬', '新药研发'], ['農業', '农业'],
  ['食品', '食品'], ['AI', '人工智能'], ['robot', '机器人'],
  ['人民元', '人民币'], ['為替', '汇率'], ['円安', '日元贬值'], ['円高', '日元升值'],
  ['M&A', '并购'], ['合併', '合并'], ['買収', '收购'], ['投資', '投资'],
  ['工場', '工厂'], ['新工場', '新工厂'], ['製造', '制造'], ['延期', '延期'],
  ['増産', '增产'], ['減産', '减产'], ['ハイテク', '高科技'], ['制限', '限制'],
  ['原油', '原油'], ['石油', '石油'], ['エネルギー', '能源'], ['供給', '供应'],
  ['価格', '价格'], ['引き上げ', '上调'], ['下落', '下跌'], ['上昇', '上涨'],
  ['値下がり', '降价'], ['値上がり', '涨价'], ['経済', '经济'], ['成長率', '增长率'],
  ['予測', '预测'], ['据え置き', '维持不变'], ['世界経済', '全球经济'],
  ['雇用', '就业'], ['備蓄', '储备'], ['懸念', '担忧'], ['不起不起', ''],
  ['おはBiz', '早间商务'], ['きょうの', '今日'], ['外務省', '外交部'],
  ['中国外務省', '中国外交部'], ['中国大使館', '中国大使馆'], ['大使館', '大使馆'],
  ['联邦地裁', '联邦地方法院'], ['法人登記', '法人登记'], ['抹消', '注销'],
  ['解散', '解散'], ['不起訴', '不起诉'], ['供述', '供述'],
];

const SORTED_DICT = JP_DICT.slice()
  .sort((a, b) => b[0].length - a[0].length)
  .filter(([k]) => k && k.length >= 2);

function dictTranslate(text) {
  if (!text) return text || '';
  let result = text;
  for (const [src, tgt] of SORTED_DICT) {
    if (!src || !tgt) continue;
    try {
      const re = new RegExp(src.replace(/[.*+?^[]()|\]/g, '\$&'), 'g');
      result = result.replace(re, tgt);
    } catch (e) { /* skip bad pattern */ }
  }
  return result.replace(/s+/g, ' ').trim();
}

// ============== DeepSeek API ==============
function callDeepSeek(messages, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.3,
      max_tokens: 800,
    });
    const opts = {
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          if (data.error) { reject(new Error(data.error.message)); return; }
          const content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
          resolve(content);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function batchTranslate(items, apiKey) {
  const validKey = apiKey && apiKey.startsWith('sk-') && apiKey.length > 30;
  if (!validKey) {
    return items.map(item => ({
      ...item,
      titleCn: dictTranslate(item.title),
      summaryCn: dictTranslate(item.summary),
    }));
  }

  const BATCH_SIZE = 5;
  const results = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchText = batch.map((item, idx) =>
      '[' + idx + '] 标题：' + item.title + '\n摘要：' + (item.summary || '').substring(0, 200)
    ).join('\n\n');

    try {
      const prompt = '你是一个中日经贸新闻翻译专家。请将以下日语新闻批量翻译为中文。' +
        '要求：只输出JSON数组，不要其他内容。' +
        '格式：[{"titleCn":"中文标题","summaryCn":"中文摘要"},...]' +
        '新闻列表：' + batchText + 'JSON输出：';

      const result = await callDeepSeek([{ role: 'user', content: prompt }], apiKey);

      // Try JSON array first, then individual objects
      let parsed = null;
      const match = result.match(/\[[\s\S]*?\]/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch (e) { /* skip */ }
      }
      if (!parsed) {
        const objMatches = result.match(/\{[\s\S]*?\}/g);
        if (objMatches) {
          const objs = [];
          for (const m of objMatches) {
            try { objs.push(JSON.parse(m)); } catch (e) { /* skip */ }
          }
          if (objs.length === batch.length) parsed = objs;
        }
      }

      batch.forEach((item, idx) => {
        if (parsed && parsed[idx]) {
          results.push({
            ...item,
            titleCn: (parsed[idx].titleCn || dictTranslate(item.title)).trim(),
            summaryCn: (parsed[idx].summaryCn || dictTranslate(item.summary)).trim(),
          });
        } else {
          results.push({ ...item, titleCn: dictTranslate(item.title), summaryCn: dictTranslate(item.summary) });
        }
      });
    } catch (e) {
      console.log('DeepSeek batch failed: ' + e.message.substring(0, 80));
      batch.forEach(item => results.push({ ...item, titleCn: dictTranslate(item.title), summaryCn: dictTranslate(item.summary) }));
    }

    if (i + BATCH_SIZE < items.length) await new Promise(r => setTimeout(r, 500));
  }
  return results;
}

module.exports = { batchTranslate, dictTranslate };
