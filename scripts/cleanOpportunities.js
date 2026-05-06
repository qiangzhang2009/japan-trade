#!/usr/bin/env node
/**
 * 商机数据清洗脚本
 * 移除：重复条目、新闻噪音、无关内容
 * 运行: node scripts/cleanOpportunities.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'public', 'data', 'opportunities.json');

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// ── 新闻噪音标题（这些不是商机，是新闻报道）───────────────────────────────
const NOISE_TITLES = [
  'Mint Investment Awards 2026',
  'Singapore, 65 other WTO members introduce',
  'Trào lưu công ty một người',
  'FLC tính làm loạt dự án',
  'VinEnergo đầu tư',
  'PH, China make',
  'Gia Lai thu hút đầu tư',
  'Xung đột Trung Đông',
  "China's AI boom is changing",
  'Two fund managers tapped',
  'Seacon lifts four MPP',
  'Trung Quốc điều tra',
  'Tăng trưởng 2 con số',
  'Anchorage queues swell',
  'ADB: 10 nước ASEAN',
  'Agribank khẳng định',
  'Thai factory output unexpectedly dips',
  'Norsepower and COSCO',
  'Long Châu được vinh danh',
  'Norden moves into ice-class',
  'UK earmarks shipyards',
  'Nông sản Việt đối mặt',
  'Netflix raises prices',
  'Dấu ấn Agribank',
  'Novaland được hoàn nhập',
  'Agribank tri ân',
  'Chứng khoán bật tăng',
  'Ngân hàng nhóm Big 4 đồng loạt tăng',
  'ジェトロとRISE-A',
  '新興国等への輸出を目指す',
  'アリゾナ州立大学',
  'J-StarX AI Medical',
  '世界16カ国のバイヤーが集結',
  '石油の「発見」そのものが戦争を生むわけではない',
  '再生医療分野のグローバルスタートアップ',
  'Singapore fintech company seeks',
  'Shanghai organic skincare brand',
  'Singapore fintech firm seeks',
  // 越南金融/银行新闻噪音（与中国-亚洲贸易无关）
  'Một ngân hàng Big 4 cho',
  'Trung tâm tài chính quốc tế TPHCM',
  'China.*AI boom is changing',
  'Agribank khẳng định',
  'Tập đoàn CEO hướng tới',
  'China.*AI boom is changing',
  // 多余的 mockData 条目（与 manual 条目重复）
  'Seeking China Premium Medical Device',
  'Osaka Robot Manufacturer Urgently',
  'Seoul Semiconductor Materials Firm Seeks',
  'HCMC Furniture Trader Urgently',
  'KL Electronics Manufacturer Seeks',
  'Singapore Seeks China AI Speech Recognition',
  'Singapore Fintech Seeks China Hardware Supplier',
  'Suzhou Industrial Robot Manufacturer',
  'Gujarat Pharma Company Seeks',
  'Tokyo Medical Device Distributor Seeks',
  'Kansai Automation',
  'Bangkok Auto Parts Company',
  'Shenzhen ESS Manufacturer',
  'Maharashtra Textile Company',
  'Shizuoka Food Company Seeks',
  'Hanoi Electronics Maker Seeks',
  'Busan Display Company Seeks',
  'Indonesian Battery Recycler Seeks',
  'Karachi Pharma Importer',
  'Jakarta Building Material Distributor',
  'Seeking China Organic Skincare Brand Japan',
  'Tokyo Automation Company Seeks',
  'HCMC Fashion Brand Seeks',
  'Singapore Seeks China Cold Chain',
  'Penang Medical Device Company',
  'Phnom Penh Garment Factory',
  'Manila EMS Company',
  'Vientiane Agriculture Company',
  'Thai Food Exporter',
  'Yangon Mining Company',
  'Osaka Manufacturer Seeks China Industrial',
];

function isNoiseTitle(title) {
  const clean = title.replace(/['\u2018\u2019\u201a\u201b]/g, "'");
  return NOISE_TITLES.some(noise => {
    if (noise.includes('.*')) {
      try { return new RegExp(noise, 'i').test(clean); } catch { return false; }
    }
    return clean.includes(noise);
  });
}

// ── 优先保留的 ID 前缀（manual 条目 > opp- 条目 > opp_ 采集条目）────────
const KEEP_ID_PREFIXES = ['manual-', 'opp-']; // 只保留这两种，不保留 opp_mnb* 采集条目

function shouldKeepItem(item) {
  // 1. 手动提交的条目直接保留
  if (item.id.startsWith('manual-')) return true;
  // 2. 旧的 mock 条目（opp-001 ~ opp-005），只保留不在 manual 里的
  if (/^opp-\d+$/.test(item.id)) return false;
  return false;
}

// ── 主逻辑 ────────────────────────────────────────────────────────────────
const seenTitles = new Set();
const result = [];
let removed = { noise: 0, duplicate: 0, kept: 0 };

for (const item of data) {
  // 1. 新闻噪音
  if (isNoiseTitle(item.title)) {
    removed.noise++;
    continue;
  }

  // 2. 重复检测（基于前80字符）
  const titleKey = item.title.substring(0, 80).toLowerCase().replace(/\s+/g, ' ').trim();
  if (seenTitles.has(titleKey)) {
    // 优先保留 manual 条目
    const existing = result.find(r => r.title.substring(0, 80).toLowerCase().replace(/\s+/g, ' ').trim() === titleKey);
    if (existing) {
      if (item.id.startsWith('manual-') && !existing.id.startsWith('manual-')) {
        // 替换为 manual 版本
        const idx = result.indexOf(existing);
        result[idx] = item;
        removed.duplicate++;
      } else {
        removed.duplicate++;
      }
    } else {
      removed.duplicate++;
    }
    continue;
  }

  seenTitles.add(titleKey);
  result.push(item);
  removed.kept++;
}

console.log(`清洗结果: 保留 ${removed.kept} 条, 移除噪音 ${removed.noise} 条, 移除重复 ${removed.duplicate} 条`);
console.log(`总计 ${result.length} 条商机数据`);

// 按发布时间排序
result.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

fs.writeFileSync(DATA_FILE, JSON.stringify(result, null, 2));
console.log(`已更新 ${DATA_FILE}`);
