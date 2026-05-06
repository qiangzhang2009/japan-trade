#!/usr/bin/env node
/**
 * 出海通 AsiaBridge — HuggingFace 数据集采集器
 * =============================================
 * 从 HuggingFace 下载与贸易/商机相关的免费数据集，
 * 用于训练 NLP 商机关联分类模型和背景参考数据。
 *
 * 当前集成的数据集：
 *   1. Qiaowenshu/bid-announcement-zh-v1.0 (2000条中国招标公告)
 *      — 训练商机关联分类模型
 *   2. lyutovad/TradeNewsEventDedup (17566对贸易新闻去重)
 *      — 过滤重复贸易新闻
 *   3. combatsolutions/tender_dataset (多行业招标描述)
 *      — 训练招标分类模型
 *   4. alerterra/trade_flow_simulations (贸易流向模拟数据)
 *      — 背景参考
 *
 * 运行：
 *   node hfdatasets.js           # 下载并处理所有数据集
 *   node hfdatasets.js --dry-run # 预览
 *   node hfdatasets.js --dataset=bid  # 只下载招标数据集
 *   node hfdatasets.js --update-classifier  # 更新训练数据
 *
 * 依赖：
 *   npm install @huggingface/hub  # HuggingFace Hub API
 */

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR     = path.join(__dirname, '..', 'public', 'data');
const DATASETS_DIR = path.join(__dirname, '..', 'datasets');
const LOG_DIR      = path.join(__dirname, '..', 'logs');
const LOG_FILE     = path.join(LOG_DIR, 'hfdatasets.log');

let IS_DRY_RUN = false;
let DATASET_FILTER = null;
let UPDATE_CLASSIFIER = false;

for (const arg of process.argv) {
  if (arg === '--dry-run') IS_DRY_RUN = true;
  if (arg.startsWith('--dataset=')) DATASET_FILTER = arg.split('=')[1];
  if (arg === '--update-classifier') UPDATE_CLASSIFIER = true;
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

// ── HTTP Download Helper ───────────────────────────────────────────────────
function httpDownload(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 AsiaBridge-DataCollector/1.0',
        'Accept': 'application/json, text/plain, */*',
      },
    }, res => {
      if (res.statusCode === 403 || res.statusCode === 429) {
        file.close(); fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${res.statusCode} rate limited`));
        return;
      }
      if (res.statusCode !== 200) {
        file.close(); fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => {
      try { file.close(); fs.unlinkSync(destPath); } catch (e) {}
      reject(err);
    });
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 AsiaBridge-DataCollector/1.0',
        'Accept': 'application/json, text/plain, */*',
      },
    }, res => {
      if (res.statusCode !== 200) { req.destroy(); reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', reject);
  });
}

// ── HuggingFace Hub API ───────────────────────────────────────────────────
const HF_API = 'https://huggingface.co/api';

async function getDatasetInfo(repoId) {
  try {
    const url = `${HF_API}/datasets/${repoId}`;
    const data = await httpGet(url);
    return JSON.parse(data);
  } catch (e) {
    log(`  WARN: Cannot get info for ${repoId}: ${e.message}`);
    return null;
  }
}

async function getDatasetFiles(repoId) {
  try {
    const url = `${HF_API}/datasets/${repoId}/tree/main`;
    const data = await httpGet(url);
    const files = JSON.parse(data);
    return Array.isArray(files) ? files : [];
  } catch (e) {
    log(`  WARN: Cannot list files for ${repoId}: ${e.message}`);
    return [];
  }
}

async function downloadHfFile(repoId, filePath, destPath) {
  const url = `https://huggingface.co/datasets/${repoId}/resolve/main/${filePath}`;
  log(`  Downloading: ${filePath}`);

  try {
    await httpDownload(url, destPath);
    const stat = fs.statSync(destPath);
    log(`  Downloaded: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
    return true;
  } catch (e) {
    log(`  WARN: Failed to download ${filePath}: ${e.message}`);
    return false;
  }
}

// ── Dataset Definitions ───────────────────────────────────────────────────
const DATASETS = [
  {
    id: 'bid-announcement-zh',
    repoId: 'Qiaowenshu/bid-announcement-zh-v1.0',
    name: '中国招标公告数据集',
    description: '2000条中国招标公告（Alpaca格式），用于训练商机关联分类模型',
    license: 'MIT',
    rows: 2000,
    relevance: 'HIGH — 直接用于训练中文商机关联分类模型',
    useCases: ['商机关联分类', '文本分类', 'NER实体抽取', '摘要生成'],
    fields: ['instruction', 'input', 'output'],
    filterKW: [
      '采购', '招标', '供应商', '经销商', '代理',
      'OEM', '合作', '投资', '合资', '采购商',
      '寻求', '招募', '供应', '代理',
    ],
    priority: 1,
  },
  {
    id: 'trade-news-dedup',
    repoId: 'lyutovad/TradeNewsEventDedup',
    name: '贸易新闻事件去重数据集',
    description: '17566对贸易新闻事件去重数据集（俄/英），用于过滤重复贸易商机',
    license: 'Unknown',
    rows: 17566,
    relevance: 'MEDIUM — 用于训练去重模型，过滤重复贸易新闻',
    useCases: ['新闻去重', '事件匹配', '贸易商机去重'],
    fields: ['text_a', 'text_b', 'label'],
    priority: 2,
  },
  {
    id: 'tender-classification',
    repoId: 'combatsolutions/tender_dataset',
    name: '多行业招标分类数据集',
    description: '多行业招标描述及AI分类，用于训练招标自动分类模型',
    license: 'Unknown',
    rows: 1000,
    relevance: 'MEDIUM — 用于训练招标行业分类模型',
    useCases: ['招标行业分类', '行业标签自动标注'],
    fields: ['description', 'category', 'sector'],
    priority: 2,
  },
  {
    id: 'trade-news-sum',
    repoId: 'lyutovad/TradeNewsSum',
    name: '贸易新闻摘要数据集',
    description: '59000对多语言贸易新闻摘要（俄/英），用于训练翻译/摘要模型',
    license: 'Unknown',
    rows: 59000,
    relevance: 'LOW — 用于训练翻译/摘要模型（需要中俄/中英翻译能力）',
    useCases: ['新闻摘要', '多语言翻译'],
    fields: ['text', 'summary'],
    priority: 3,
  },
  {
    id: 'asia-financial',
    repoId: 'electricsheepasia/asia-financial-services-all',
    name: '亚洲金融服务数据集',
    description: 'World Bank亚洲金融部门指标数据（620条），宏观经济参考',
    license: 'Unknown',
    rows: 620,
    relevance: 'LOW — 宏观经济参考，非商机关联',
    useCases: ['宏观经济分析', '金融指标参考'],
    fields: ['indicator_name', 'country_name', 'year', 'value'],
    priority: 3,
  },
  {
    id: 'asia-economic',
    repoId: 'electricsheepasia/asia-economic-indicators-all',
    name: '亚洲经济指标数据集',
    description: 'World Bank亚洲GDP/贸易/投资数据（10986条），贸易流向参考',
    license: 'Unknown',
    rows: 10986,
    relevance: 'MEDIUM — 贸易流向分析参考',
    useCases: ['贸易流向分析', 'GDP/贸易趋势', '投资参考'],
    fields: ['indicator_name', 'country_name', 'year', 'value'],
    priority: 2,
  },
];

// ── Download & Process Dataset ────────────────────────────────────────────
async function downloadDataset(dataset) {
  log(`\n=== Processing: ${dataset.name} (${dataset.repoId}) ===`);
  log(`  Rows: ${dataset.rows} | License: ${dataset.license}`);
  log(`  Relevance: ${dataset.relevance}`);
  log(`  Use cases: ${dataset.useCases.join(', ')}`);

  const dsDir = path.join(DATASETS_DIR, dataset.id);
  if (!fs.existsSync(dsDir)) fs.mkdirSync(dsDir, { recursive: true });

  const files = await getDatasetFiles(dataset.repoId);
  if (!files.length) {
    log(`  WARN: No files found for ${dataset.repoId}`);
    return null;
  }

  log(`  Files: ${files.map(f => f.path || f.rfilename || f).join(', ')}`);

  const downloadedFiles = [];
  for (const file of files) {
    const fileName = file.path || file.rfilename || '';
    if (!fileName || fileName.includes('README') || fileName.includes('.gitattributes')) continue;

    const ext = path.extname(fileName);
    if (!['.json', '.jsonl', '.csv', '.parquet', '.txt'].includes(ext)) continue;

    const destPath = path.join(dsDir, path.basename(fileName));
    const ok = await downloadHfFile(dataset.repoId, fileName, destPath);
    if (ok) downloadedFiles.push(destPath);
  }

  return downloadedFiles.length > 0 ? { dataset, files: downloadedFiles } : null;
}

// ── Generate Training Data ─────────────────────────────────────────────────
function generateClassifierTrainingData(datasetFiles) {
  log('  Generating classifier training data...');

  const trainingData = [];

  for (const filePath of datasetFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const ext = path.extname(filePath);

      if (ext === '.json' || ext === '.jsonl') {
        const lines = content.split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const item = JSON.parse(line) || JSON.parse(content);
            if (Array.isArray(item)) {
              for (const it of item) {
                const text = extractText(it, datasetFiles[0]);
                if (text) trainingData.push(text);
              }
              break;
            } else if (item) {
              const text = extractText(item, filePath);
              if (text) trainingData.push(text);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    } catch (e) {
      log(`  WARN: Cannot process ${filePath}: ${e.message}`);
    }
  }

  log(`  Generated ${trainingData.length} training samples`);
  return trainingData;
}

function extractText(item, filePath) {
  // Alpaca format: instruction, input, output
  if (item.instruction || item.input || item.output) {
    const text = [item.instruction, item.input, item.output]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (text.length > 20) {
      return { text, format: 'alpaca' };
    }
  }

  // Generic JSON: look for common text fields
  const textFields = ['title', 'description', 'text', 'content', 'summary', 'body'];
  for (const field of textFields) {
    if (item[field] && typeof item[field] === 'string' && item[field].length > 20) {
      return { text: item[field], format: 'generic' };
    }
  }

  // CSV-like: description, category, sector
  if (item.description && (item.category || item.sector)) {
    return {
      text: `${item.description} [分类: ${item.category || item.sector}]`,
      format: 'tender'
    };
  }

  return null;
}

// ── Build Business Classifier ──────────────────────────────────────────────
function buildClassifierRules() {
  // 从关键词生成朴素的商机关联分类规则
  // 这些规则可以用于快速预筛选，也可以作为LLM分类的few-shot示例

  const rules = {
    POSITIVE: [
      // 商业合作类型
      '寻求中国合作伙伴', '寻找中国供应商', '寻找中国代理商',
      '招募中国经销商', '中国OEM合作', '中国ODM合作',
      '中国合资企业', 'joint venture China', 'JV China partner',
      'seeking Chinese supplier', 'Chinese distributor wanted',
      '对中国企业招商引资', '中国侧合作伙伴', '中国侧調達',

      // 采购需求
      '需要从中国进口', '采购中国产品', '中国产品供应',
      '寻找中国制造', '中国制造商', '中国工厂合作',
      '中国供应商', '中国产', '中国制',

      // 投资合作
      '中国投资', '中国资本', '中资合作',
      '对中国投资', '中国侧投资', '中国Inbound FDI',

      // 两岸四地
      '两岸贸易', '两岸经贸', 'ECFA',
      '中国大陆', '中国厂商', '台商', '港商',
      '中国台湾', 'Taiwan.*China',
    ],

    NEGATIVE: [
      // 新闻报道噪音
      '股价', '股价上涨', '股价下跌', 'IPO',
      '选举', '公投', '政治',
      'COVID', '疫情', '新冠',
      '地震', '海啸', '台风',
      '汇率', '汇率波动', '人民币升值',
      '娱乐', '明星', '演唱会',
      '体育', '比赛', '联赛',
      '天气预报', '气象',
    ],

    CATEGORIES: {
      '半导体/电子': ['半导体', 'IC', '芯片', '晶圆', '封测', '面板', 'OLED', 'LCD', '电子零件', 'semiconductor', 'chip', 'IC design', 'display'],
      '新能源汽车': ['电动车', 'EV', '电池', '电机', '电控', 'Automotive', 'battery', '电动汽车', 'electric vehicle'],
      '工业自动化': ['机器人', 'robot', '自动化', 'CNC', '机械', 'machine', '工业机器人', 'automation'],
      '医疗器械': ['医疗', '医药', '制药', 'medical', 'pharma', '医疗器材', '诊断'],
      '化工材料': ['化工', '化学', '石化', '新材料', 'chemical', 'plastic', 'polymer'],
      '纺织服装': ['纺织', '面料', '成衣', 'textile', 'fabric', 'garment', 'yarn'],
      'IT/软件': ['IT', '软件', 'software', 'SaaS', 'AI', 'cloud', '数据'],
      '能源电力': ['能源', '储能', 'solar', '光伏', '风电', '电网', 'electricity'],
      '贸易/物流': ['物流', '货运', 'shipping', '海运', '仓储', '报关', '货代'],
      '金融科技': ['金融', '支付', 'fintech', '银行', '保险', '数字货币'],
      '食品农业': ['食品', '农业', '农产品', 'food', 'agri', '出口', '进口'],
      '钢铁/金属': ['钢铁', 'steel', '金属', 'metal', '铜', '铝', '镍'],
    },

    AMOUNT_PATTERNS: [
      /(?:预算|金额|价款|价格|estimate|budget|amount|value)[:\s]*[¥$€£]?\s*([\d,]+(?:\.\d+)?)\s*(?:万|亿|K|M|千|百万)?/i,
      /(?:USD|JPY|KRW|RMB|人民币|美元|日元|韩元)[\s:]*([\d,]+(?:\.\d+)?)/i,
      /(?:约|约合|约等于)[\s]*([\d,]+)\s*(?:万美元|万人民币|万日元|万韩元)/i,
    ],
  };

  return rules;
}

// ── Main ─────────────────────────────────────────────────────────────────
async function run() {
  log('========== HuggingFace 数据集采集器 启动 ==========');
  log(`Dry: ${IS_DRY_RUN} | Filter: ${DATASET_FILTER || 'ALL'}`);

  const results = [];

  // 筛选数据集
  let datasetsToProcess = DATASETS;
  if (DATASET_FILTER) {
    datasetsToProcess = DATASETS.filter(d =>
      d.id.includes(DATASET_FILTER) || d.repoId.toLowerCase().includes(DATASET_FILTER)
    );
  } else {
    // 默认按优先级排序
    datasetsToProcess.sort((a, b) => a.priority - b.priority);
  }

  log(`\nProcessing ${datasetsToProcess.length} datasets`);

  for (const dataset of datasetsToProcess) {
    try {
      const result = await downloadDataset(dataset);
      if (result) results.push(result);

      // 礼貌延迟，避免过快请求
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      log(`ERROR processing ${dataset.repoId}: ${e.message}`);
    }
  }

  log(`\nDownloaded: ${results.length}/${datasetsToProcess.length} datasets`);

  // 生成分类器训练数据
  if (results.length > 0 && !IS_DRY_RUN) {
    log('\n=== Generating Classifier Training Data ===');

    const classifierData = buildClassifierRules();
    const classifierPath = path.join(DATASETS_DIR, 'classifier_rules.json');
    fs.writeFileSync(classifierPath, JSON.stringify(classifierData, null, 2));
    log(`Saved: classifier_rules.json`);

    // 生成商机关联标注指南
    const guidelinesPath = path.join(DATASETS_DIR, 'annotation_guidelines.json');
    const guidelines = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      description: '商机关联分类标注指南 — AsiaBridge v14',
      labelDefinitions: {
        'positive': '与中国-亚洲贸易直接相关的商业机会（采购、供应、投资、合作、代理等）',
        'negative': '不相关的新闻报道、噪音内容（股价、政治、娱乐、灾害等）',
      },
      annotationRules: {
        include: [
          '明确提到寻求中国供应商/合作伙伴',
          '采购公告中提到进口或从中国采购',
          '投资公告中提到中国投资或中国资本',
          '合资/JV公告中提到中国侧合作方',
          '招标公告中提到中国产品或中国制造商',
        ],
        exclude: [
          '纯新闻报道（股价、汇率、会议报道）',
          '政治新闻（选举、外交）',
          '娱乐新闻（明星、演唱会）',
          '自然灾害报道（地震、台风）',
          '纯国内新闻（不涉及中国或亚洲贸易）',
        ],
      },
      fewShotExamples: {
        positive: [
          '东京医疗器械公司寻求中国CT设备供应商，要求有PMDA认证',
          '越南电子制造商招募中国18650锂电池PACK供应商，月供5万支',
          '印尼矿业公司寻求中国选矿设备和技术许可合作',
          '泰国汽车OEM寻求中国驱动电机供应商，要求IATF16949认证',
        ],
        negative: [
          '华为发布最新款智能手机，股价上涨3%',
          '日本央行宣布维持利率不变，市场震荡',
          '泰国选出新总理，经济政策引关注',
          '越南发生5级地震，暂无伤亡报告',
        ],
      },
    };
    fs.writeFileSync(guidelinesPath, JSON.stringify(guidelines, null, 2));
    log(`Saved: annotation_guidelines.json`);
  }

  // 生成采集报告
  if (!IS_DRY_RUN) {
    const reportPath = path.join(DATASETS_DIR, '采集报告.json');
    const report = {
      generatedAt: new Date().toISOString(),
      datasetsProcessed: results.length,
      datasets: results.map(r => ({
        id: r.dataset.id,
        repoId: r.dataset.repoId,
        name: r.dataset.name,
        rows: r.dataset.rows,
        relevance: r.dataset.relevance,
        useCases: r.dataset.useCases,
        files: r.files.map(f => path.basename(f)),
      })),
      classifierRules: !IS_DRY_RUN,
      totalRowsAvailable: results.reduce((sum, r) => sum + r.dataset.rows, 0),
      nextSteps: [
        '使用 Qiaowenshu/bid-announcement-zh-v1.0 训练商机关联分类模型',
        '使用 combatsolutions/tender_dataset 训练招标行业分类模型',
        '将 classifier_rules.json 集成到采集器作为规则预筛选',
        '将 annotation_guidelines.json 用于人工标注数据',
      ],
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\nSaved: 采集报告.json`);

    // 打印汇总
    log('\n========== 数据集采集汇总 ==========');
    results.forEach(r => {
      log(`  [${r.dataset.priority}] ${r.dataset.name} (${r.dataset.rows} rows)`);
      log(`    Repo: ${r.dataset.repoId}`);
      log(`    Use: ${r.dataset.useCases.join(', ')}`);
    });
  }

  log('\n========== 采集完成 ==========');
}

run().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
