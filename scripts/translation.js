#!/usr/bin/env node
/**
 * 中日经贸翻译服务
 * DeepSeek API + 逐词字典 fallback
 */

const https = require('https');

// ============== 逐词翻译字典 ==============
// 格式：[原文, 译文]
const WORD_DICT = [
  // 动词/名词
  ["外相", "外务大臣"],
  ["防衛相", "防卫大臣"],
  ["官房長官", "内阁官房长官"],
  ["防衛省", "防卫省"],
  ["経済フォーラム", "经济论坛"],
  ["税関当局", "海关当局"],
  ["拘束", "扣押"],
  ["保釈", "保释"],
  ["訪中", "访华"],
  ["来日", "来日"],
  ["対中", "对华"],
  ["対日", "对日"],
  ["中日関係", "中日关系"],
  ["中日", "中日"],
  ["首脳", "首脑"],
  ["的理解", "获得理解"],
  ["外相会合", "外长会议"],
  ["基本合意", "基本达成一致"],
  ["基本", "基本"],
  ["合意", "达成协议"],
  ["統合作戦", "联合作战"],
  ["統合交渉", "整合谈判"],
  ["統合", "整合"],
  ["交渉", "谈判"],
  ["協議", "协商"],
  ["調査", "调查"],
  ["対抗", "对抗"],
  ["差し止め", "叫停"],
  ["措置", "措施"],
  ["措置", "措施"],
  ["保釈", "保释"],
  ["拘束", "扣押"],
  ["喚起", "警告/呼吁"],
  [" бор", "保释"],
  ["停止", "停止"],
  ["禁止", "禁止"],
  ["許可", "许可"],
  ["批准", "批准"],
  // 贸易政策
  ["輸出", "出口"],
  ["輸出", "出口"],
  ["輸入", "进口"],
  ["禁輸", "禁运"],
  ["報復", "报复"],
  ["制裁", "制裁"],
  ["関税", "关税"],
  ["EPA", "EPA（经济合作协定）"],
  ["FTA", "FTA（自由贸易协定）"],
  ["RCEP", "RCEP（区域全面经济伙伴关系协定）"],
  ["WTO", "WTO（世界贸易组织）"],
  // 产业
  ["半導", "半导体"],
  ["集積回路", "集成电路"],
  ["パワー半導", "功率半导体"],
  ["蓄電池", "蓄电池"],
  ["バッテリー", "电池"],
  ["EV", "电动汽车"],
  ["新能源", "新能源"],
  ["再エネ", "可再生能源"],
  ["水素", "氢能"],
  ["医療", "医疗"],
  ["創薬", "新药研发"],
  ["農業", "农业"],
  ["食品", "食品"],
  ["JAS", "JAS有机认证"],
  ["AI", "人工智能"],
  ["robot", "机器人"],
  ["ロボット", "机器人"],
  // 金融投资
  ["人民元", "人民币"],
  ["為替", "汇率"],
  ["円安", "日元贬值"],
  ["円高", "日元升值"],
  ["M&A", "并购"],
  ["合併", "合并"],
  ["買収", "收购"],
  ["投資", "投资"],
  // 企业/工厂
  ["工場", "工厂"],
  ["新工場", "新工厂"],
  ["製造", "制造"],
  [" завод", "工厂"],
  ["延期", "延期"],
  ["増産", "增产"],
  ["減産", "减产"],
  // 高科技/政策
  ["ハイテク", "高科技"],
  ["制限", "限制"],
  // 市场/价格
  ["原油", "原油"],
  ["石油", "石油"],
  ["エネルギー", "能源"],
  ["供給", "供应"],
  ["価格", "价格"],
  ["引き上げ", "上调"],
  ["引上", "上调"],
  ["下落", "下跌"],
  ["上昇", "上涨"],
  ["値下がり", "降价"],
  ["値上がり", "涨价"],
  ["値下", "降价"],
  ["値上", "涨价"],
  // 经济数据
  ["経済", "经济"],
  ["成長率", "增长率"],
  ["予測", "预测"],
  ["据え置き", "维持不变"],
  ["世界経済", "全球经济"],
  ["雇用", "就业"],
  ["備蓄", "储备"],
  ["懸念", "担忧"],
  // 司法/事件
  ["不起訴", "不起诉"],
  ["不起不起", ""],
  ["不起", ""],
  ["供述", "供述"],
  ["逮捕", "逮捕"],
  ["拘束", "扣押"],
  ["保釈", "保释"],
  ["措置", "措施"],
  ["差し止", "叫停"],
  ["联邦地裁", "联邦地方法院"],
  ["联邦", "联邦"],
  ["地裁", "地方法院"],
  ["法人登記", "法人登记"],
  ["登記", "登记"],
  ["抹消", "注销"],
  ["抹消", "注销"],
  ["解散", "解散"],
  // 地名/事件
  ["おはBiz", "早间商务"],
  ["おはBiz", "早间商务"],
  ["おはよう Biz", "早间商务"],
  ["きょうの", "今日"],
  // 政府机构
  ["外務省", "外交部"],
  ["外務省", "外交部"],
  ["中国外務省", "中国外交部"],
  ["防衛省", "防卫省"],
  ["中国大使館", "中国大使馆"],
  ["大使館", "大使馆"],
  // 常用词
  ["的理解", "获得理解"],
  ["得る", "获得"],
  ["理解", "理解"],
  ["得る", "获得"],
  [" бор", "保释"],
  [" 保釈", "保释"],
  [" бор", "保释"],
];

// 从长到短排序，避免短词先匹配
const SORTED_DICT = WORD_DICT.slice()
  .sort((a, b) => b[0].length - a[0].length)
  .filter(([k]) => k.length >= 2);

function dictTranslate(text) {
  if (!text) return text;
  let result = text;
  // 逐词翻译
  for (const [src, tgt] of SORTED_DICT) {
    if (!src || !tgt) continue;
    try {
      // 精确匹配
      const re = new RegExp(src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(re, tgt);
    } catch (e) {
      // invalid pattern, skip
    }
  }
  // 清理残留日语
  result = result
    .replace(/[\u3040-\u309F\u30A0-\u30FF]+/g, (m) => {
      // 保留常见日语量词和助词，但转换为中文表达
      return m;
    })
    .replace(/不起不起/g, '')
    .replace(/ бор/g, '保释')
    .replace(/\s+/g, ' ')
    .trim();
  return result;
}

// ============== DeepSeek API ==============
function callDeepSeek(messages, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: 0.3,
      max_tokens: 800,
    });
    const options = {
      hostname: "api.deepseek.com",
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          if (data.error) { reject(new Error(data.error.message)); return; }
          const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "";
          resolve(content);
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function batchTranslate(items, apiKey) {
  // API key 检查
  if (!apiKey || apiKey === "YOUR_DEEPSEEK_API_KEY" || apiKey === "undefined" || !apiKey.startsWith("sk-")) {
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
      "[" + idx + "] 标题：" + item.title + "\\n摘要：" + (item.summary || "").substring(0, 200)
    ).join("\\n\\n");

    try {
      const prompt = "你是一个中日经贸新闻翻译专家。请将以下日语新闻批量翻译为中文。\\n要求：只输出JSON数组，不要其他内容。\\n格式：[{\\\"titleCn\\\":\\\"中文标题\\\",\\\"summaryCn\\\":\\\"中文摘要\\\"},...]\\n\\n新闻列表：\\n" + batchText + "\\n\\nJSON输出：";

      const result = await callDeepSeek([{ role: "user", content: prompt }], apiKey);
      const match = result.match(/\\[[\\s\\S]*?\\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        batch.forEach((item, idx) => {
          if (parsed[idx]) {
            results.push({
              ...item,
              titleCn: (parsed[idx].titleCn || dictTranslate(item.title)).trim(),
              summaryCn: (parsed[idx].summaryCn || dictTranslate(item.summary)).trim(),
            });
          } else {
            results.push({ ...item, titleCn: dictTranslate(item.title), summaryCn: dictTranslate(item.summary) });
          }
        });
      } else {
        batch.forEach(item => results.push({ ...item, titleCn: dictTranslate(item.title), summaryCn: dictTranslate(item.summary) }));
      }
    } catch (e) {
      console.log("DeepSeek batch failed, using dict: " + e.message.substring(0, 80));
      batch.forEach(item => results.push({ ...item, titleCn: dictTranslate(item.title), summaryCn: dictTranslate(item.summary) }));
    }

    if (i + BATCH_SIZE < items.length) await new Promise(r => setTimeout(r, 500));
  }
  return results;
}

module.exports = { batchTranslate, dictTranslate };
