#!/usr/bin/env node
/**
 * 出海通 AsiaBridge — 智能数据采集器 v11
 * =============================================
 * 支持方式：
 *   - RSS/Atom feeds（主流）
 *   - HTML页面抓取（cheerio，备选）
 *   - 政府贸易门户（KOTRA/BOI/METI/贸工部等，高质量数据源）
 * 
 * 运行:
 *   node collector.js              # 全量采集
 *   node collector.js --dry-run   # 预览
 *   node collector.js --country=japan  # 只采集日本
 *   node collector.js --limit=5    # 每源最多5条
 */

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Dependencies (optional, graceful degradation) ──────────────────────────────
let cheerio;
try {
  cheerio = require('cheerio');
} catch (e) {
  cheerio = null;
}
let axiosLib;
try {
  axiosLib = require('axios');
} catch (e) {
  axiosLib = null;
}

// ── Config ────────────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const LOG_DIR  = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'collector.log');

let IS_DRY_RUN    = false;
let COUNTRY_FILTER = '';
let LIMIT_PER_SOURCE = 999;

for (const arg of process.argv) {
  if (arg === '--dry-run') IS_DRY_RUN = true;
  if (arg.startsWith('--country=')) COUNTRY_FILTER = arg.split('=')[1];
  if (arg.startsWith('--limit='))  LIMIT_PER_SOURCE = parseInt(arg.split('=')[1], 10) || 999;
}

const CONCURRENCY = 4; // parallel fetches
const TIMEOUT_MS  = 15000;
const DELAY_MS    = 2000; // delay between waves

// ─────────────────────────────────────────────────────────────────────────────
// DATA SOURCES — Verified 2026-03-29
// Format: { id, country, tier(1-3,0=global), name, type:'rss'|'html',
//           url, method, selectors,
//           scoreKW, industryKW, threshold }
// ─────────────────────────────────────────────────────────────────────────────
const SOURCES = [
  // ══════════════════════════ 日本 ══════════════════════════
  {
    id: 'jp-jetro',
    country: 'japan', tier: 1, name: 'JETRO 日本贸易振兴机构',
    type: 'rss', url: 'https://www.jetro.go.jp/rss/news.xml',
    // 强商机关键词 — 必须含其中1个
    bizKW: [
      '代理店', '经销', '代理商', '代理商募集', '招募经销商', 'distributor sought',
      '調達.*中国企业', '中国側.*調達', '中国企业提供', 'looking for supplier',
      '对中国企业感兴趣', '中国侧合作伙伴', '合资', 'JV', 'joint venture',
      'OEM.*募集', 'manufacturing partner', '中国側.*工場', 'license.*production',
    ],
    // 弱相关关键词 — 辅助加分
    contextKW: [
      '中国', 'Chinese', '中国企業', 'GE.*日本', 'Japan-China', 'RCEP',
      '日中', '対中', 'ASEAN', 'Southeast Asia', 'bilateral', '輸出', '輸入',
    ],
    // 行业关键词
    industryKW: [
      '半導', 'EV', '蓄電池', '医療', 'robot', 'AI', '新材料', '工作機械',
      'semiconductor', 'battery', 'medical', 'manufacturing', 'automotive',
      'chemical', 'precision', ' electronics', ' robot'
    ],
    threshold: 2,
  },
  {
    id: 'jp-jcast',
    country: 'japan', tier: 1, name: 'J-CAST ビジネス',
    type: 'rss', url: 'https://www.j-cast.com/index.xml',
    bizKW: [
      '代理店', '经销', '代理商募集', '招募经销商', 'OEM.*募集', 'ODM.*募集',
      '調達.*中国企业', '对中国企业.*感兴趣', '中国企业提供',
      'looking for supplier', 'seeking Chinese', 'distributor sought',
      '对中国進出', '中国側.*パートナー', 'joint venture.*募集',
    ],
    contextKW: [
      '中国', 'China', 'Chinese', 'ASEAN', 'Southeast Asia', '東南ア',
      '輸出', '輸入', '製造業', 'bilateral', 'supply chain'
    ],
    industryKW: [
      '半导体', 'EV', '蓄電池', '医療', 'ロボット',
      'AI', '再エネ', '化学', '精密機械', 'manufacturing', 'electronics'
    ],
    threshold: 2,
  },
  {
    id: 'jp-nhk',
    country: 'japan', tier: 1, name: 'NHK World Japan',
    type: 'rss', url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',
    bizKW: [],
    contextKW: [
      '中国', 'China', 'ASEAN', 'trade', 'export', 'invest',
      '輸出', '製造', '東南ア', 'Japan-China', 'global economy'
    ],
    industryKW: [
      '半導', 'EV', 'robot', 'AI', '精密機械', 'manufacturing',
      'electronics', 'chemical', 'medical', 'semiconductor'
    ],
    threshold: 2,
  },

  // ══════════════════════════ 越南 ══════════════════════════
  {
    id: 'vn-dantri',
    country: 'vietnam', tier: 1, name: 'DanTri 今日电子报（经济版）',
    type: 'rss', url: 'https://dantri.com.vn/rss/kinh-doanh.rss',
    bizKW: [
      'tìm.*đối tác', 'tìm.*nhà cung cấp', 'tìm.*đại lý',
      'cần.*nhập.*Trung Quốc', 'nhập.*từ Trung Quốc',
      'xuất.*sang Trung Quốc', 'đầu tư.*Trung Quốc',
      'FDI.*Vietnam', 'hợp tác.*Trung Quốc', 'việt-trung',
      'Trung Quốc.*đầu tư', 'Trung Quốc.*nhà máy',
      'seeking.*partner.*Vietnam', 'Vietnam.*Chinese supplier',
      'Vietnam.*China JV', 'Vietnam.*supply chain China',
      'Belt and Road.*Vietnam',
    ],
    contextKW: [
      'Trung Quốc', '中国', 'xuất khẩu', 'nhập khẩu', 'đầu tư FDI',
      'Chinese', 'import', 'export', 'invest', 'manufacturing', 'ASEAN',
      'FDI', 'supply chain', 'outsourcing', 'cán cân thương mại',
      'nhập khẩu', 'xuất khẩu', 'thương mại điện tử'
    ],
    industryKW: [
      'điện tử', 'electronics', 'thép', 'steel', 'dệt nhuộm', 'textile',
      'nội thất', 'furniture', 'manufacturing', 'nông sản', 'agri',
      'logistics', 'EV', 'semi', 'battery', 'ô tô', 'automotive',
      'thực phẩm', 'food', 'cơ khí', 'machinery', 'gang', 'xi măng', 'cement',
      'nhựa', 'plastic', 'hóa chất', 'chemical', 'dược phẩm', 'pharma',
      'công nghiệp', ' FDI'
    ],
    threshold: 2,
  },
  {
    id: 'vn-vnexpress',
    country: 'vietnam', tier: 1, name: 'VnExpress 商业版',
    type: 'rss', url: 'https://vnexpress.net/rss/kinh-doanh.rss',
    bizKW: [
      'tìm.*đối tác', 'tìm.*nhà cung cấp', 'tìm.*đại lý',
      'cần.*nhập', 'cần.*xuất', 'tìm kiếm.*đối tác',
      'muốn.*hợp tác', 'cần tìm.*Trung Quốc',
      'seeking.*partner', 'looking.*supplier', 'agent.*wanted',
      'distributor.*wanted', 'FDI.*investment.*opportunity',
    ],
    contextKW: [
      'Trung Quốc', '中国', 'xuất khẩu', 'nhập khẩu', 'đầu tư',
      'import', 'export', 'invest', 'manufacturing', 'ASEAN',
      'FDI', 'nhập khẩu', 'xuất khẩu', 'cán cân thương mại'
    ],
    industryKW: [
      'điện tử', 'electronics', 'thép', 'steel', 'dệt nhuộm', 'textile',
      'nội thất', 'furniture', 'manufacturing', 'nông sản', 'agri',
      'logistics', 'EV', 'semi', 'battery', 'ô tô', 'automotive',
      'thực phẩm', 'food', 'cơ khí', 'machinery', 'gang', 'xi măng', 'cement',
      'nhựa', 'plastic', 'hóa chất', 'chemical', 'dược phẩm', 'pharma'
    ],
    threshold: 2,
  },

  // ══════════════════════════ 韩国 ══════════════════════════
  {
    id: 'kr-yonhap',
    country: 'south-korea', tier: 1, name: 'Yonhap Economy News',
    type: 'rss', url: 'https://www.yna.co.kr/rss/economy.xml',
    bizKW: [
      '투자.* 파트너', '협력.*中国企业', '중국.*사업',
      '中国.*合作', '对中国.*투자', 'seeking Chinese partner',
      'looking.*Korea.*partner', 'Korea.*China JV', 'Korea.*China.*deal',
      '对中国企业.*招商引资', '한국.*중국.*합작',
      '对中国.*OEM', '对中国.*調達', 'korean.*seeking supplier',
    ],
    contextKW: [
      '중국', '中한국', '한중', '중한', '한국.*중국', '중국.*한국',
      'China', 'ASEAN', 'Southeast Asia', 'trade', 'export', 'import',
      'investment', 'manufacturing', 'supply chain', 'Japan-China',
      'US-China', 'bilateral', 'economy', 'global trade', '경제'
    ],
    industryKW: [
      'semiconductor', 'display', ' automobile', 'EV',
      'battery', 'robot', '조선', 'shipbuilding', 'chemical', ' pharma', 'automotive'
    ],
    threshold: 2,
  },

  // ══════════════════════════ 新加坡 ══════════════════════════
  {
    id: 'sg-straitstimes',
    country: 'singapore', tier: 1, name: 'Straits Times Business',
    type: 'rss', url: 'https://www.straitstimes.com/news/business/rss.xml',
    bizKW: [
      'seeking.*partner', 'looking for investor', 'joint venture',
      'franchise.*Singapore', 'Singapore.*China JV', 'RCEP.*opportunity',
      'APAC.*deal', 'SGD.*investment', 'Singapore.*Chinese partnership',
      'Singapore invests in', 'China-Singapore', 'Gulf of Thailand.*oil',
    ],
    contextKW: [
      'China', 'Chinese', 'Japan', 'ASEAN', 'Southeast Asia',
      'bilateral', 'trade', 'investment', 'export', 'import', 'RCEP'
    ],
    industryKW: [
      'semiconductor', 'electronics', 'finance', 'logistics', 'biotech',
      'pharma', 'manufacturing', 'oil.*gas', 'shipping'
    ],
    threshold: 2,
  },

  // ══════════════════════════ 马来西亚 ══════════════════════════
  {
    id: 'my-thestar',
    country: 'malaysia', tier: 2, name: 'The Star Malaysia',
    type: 'rss', url: 'https://www.thestar.com.my/rss/news',
    bizKW: [
      'Malaysia.*China.*investment', 'seeking.*partner', 'joint venture',
      'looking for supplier', 'franchise Malaysia', 'RM.*investment',
      'China.*Malaysia JV', 'Malaysia.*China deal',
      'Wetable.*Malaysia', 'looking for buyer', 'supplier wanted',
    ],
    contextKW: [
      'China', 'Chinese', 'ASEAN', 'Southeast Asia', 'bilateral',
      'trade', 'export', 'import', 'investment', 'manufacturing', 'supply chain'
    ],
    industryKW: [
      'semiconductor', 'electronics', 'E&E', 'automotive', 'solar',
      'oil.*gas', 'palm oil', 'medical', 'glove', 'manufacturing'
    ],
    threshold: 2,
  },

  // ══════════════════════════ 泰国 ══════════════════════════
  {
    id: 'th-bangkokpost',
    country: 'thailand', tier: 2, name: 'Bangkok Post Business',
    type: 'rss', url: 'https://www.bangkokpost.com/rss/data/business.xml',
    bizKW: [
      'Thailand.*China investment', 'seeking partner Thailand',
      'EEC.*China', 'Thailand.*China JV', 'joint venture Thailand',
      'looking for Thai partner', 'Thailand.*Chinese.*deal',
      'Thailand.*supply chain', 'Thai.*OEM', 'Thai.*procurement China',
    ],
    contextKW: [
      'China', 'Chinese', 'ASEAN', 'EEC', 'bilateral',
      'trade', 'export', 'import', 'investment', 'manufacturing', 'BCG'
    ],
    industryKW: [
      'automotive', 'EV', 'electronics', 'food', 'agri', 'rubber',
      'tourism', 'pharma', 'auto parts', 'manufacturing'
    ],
    threshold: 2,
  },

  // ══════════════════════════ 菲律宾 ══════════════════════════
  {
    id: 'ph-philstar',
    country: 'philippines', tier: 3, name: 'Philippine Star Business',
    type: 'rss', url: 'https://www.philstar.com/rss/business',
    bizKW: [
      'Philippines.*China investment', 'seeking Philippine partner',
      'joint venture Philippines', 'Philippines.*China deal',
      'looking for Filipino partner', 'Philippines.*OEM',
      'Philippines.*supply chain', 'Philippines.*procurement',
    ],
    contextKW: [
      'China', 'Chinese', 'ASEAN', 'Southeast Asia', 'bilateral',
      'trade', 'export', 'import', 'investment', 'manufacturing'
    ],
    industryKW: [
      'semiconductor', 'electronics', 'BPO', 'manufacturing',
      'agri', 'tourism', 'infrastructure', 'logistics'
    ],
    threshold: 2,
  },
  {
    id: 'ph-rappler',
    country: 'philippines', tier: 3, name: 'Rappler Business',
    type: 'rss', url: 'https://www.rappler.com/feed/',
    bizKW: [
      'Philippines.*China', 'joint venture Philippines',
      'Filipino.*Chinese partner', 'Philippines investment deal',
      'BPO.*Philippines', 'semiconductor Philippines',
    ],
    contextKW: [
      'China', 'Chinese', 'ASEAN', 'Southeast Asia',
      'trade', 'export', 'import', 'investment', 'business'
    ],
    industryKW: [
      'technology', 'digital', 'BPO', 'manufacturing', 'logistics'
    ],
    threshold: 2,
  },

  // ══════════════════════════ 印度尼西亚 ══════════════════════════
  {
    id: 'id-detikfinance',
    country: 'indonesia', tier: 2, name: 'Detik Finance Indonesia',
    type: 'rss', url: 'https://finance.detik.com/rss/',
    bizKW: [
      'Indonesia.*China investasi', 'mitra Indonesia China',
      'kerja sama Indonesia.*China', 'joint venture Indonesia',
      'Indonesia.*import dari China', 'Indonesia.*Tiongkok',
      'Indonesia.*pasokan dari China', 'Indonesia OEM', 'Indonesia.*RCEP',
    ],
    contextKW: [
      'China', 'Cina', 'Tiongkok', 'ASEAN', 'trade', 'export', 'import',
      'investasi', 'manufacturing', 'bilateral', 'RCEP'
    ],
    industryKW: [
      'semiconductor', 'EV', 'nikel', 'nickel', 'battery', 'textile',
      'manufacturing', 'coal', 'palm oil', 'agri', 'FMCG'
    ],
    threshold: 2,
  },

  // ══════════════════════════ 印度 ══════════════════════════
  {
    id: 'in-moneycontrol',
    country: 'india', tier: 3, name: 'MoneyControl India',
    type: 'rss', url: 'https://www.moneycontrol.com/rss/latestnews.xml',
    bizKW: [
      'India.*China.*investment', 'India.*China JV', 'India.*Chinese partner',
      'seeking India partner', 'India.*import.*China', 'India.*supply chain',
      'PLI.*investment', 'India.*China deal', 'India.*China trade corridor',
    ],
    contextKW: [
      'China', 'Chinese', 'ASEAN', 'trade', 'export', 'import',
      'investment', 'manufacturing', 'bilateral', 'PLI', 'Corridor'
    ],
    industryKW: [
      'semiconductor', 'pharma', 'textile', 'chemical', 'steel',
      'auto', 'EV', 'electronics', 'IT', 'manufacturing', 'API'
    ],
    threshold: 2,
  },
  {
    id: 'in-livemint',
    country: 'india', tier: 3, name: 'Livemint India',
    type: 'rss', url: 'https://www.livemint.com/rss/news',
    bizKW: [
      'India.*China', 'India.*Chinese', 'India.*PLI investment',
      'India.*semiconductor', 'India.*supply chain shift',
      'India.*manufacturing deal', 'India.*GIFT City.*China',
    ],
    contextKW: [
      'China', 'Chinese', 'trade', 'export', 'import',
      'investment', 'manufacturing', 'PLI', 'GIFT City'
    ],
    industryKW: [
      'semiconductor', 'IT', 'pharma', 'textile', 'chemical',
      'manufacturing', 'fintech', 'EV', 'electronics'
    ],
    threshold: 2,
  },

  // ══════════════════════════ 全球泛亚洲 ══════════════════════════
  {
    id: 'bbc-asia',
    country: 'all', tier: 0, name: 'BBC World Asia Business',
    type: 'rss', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml',
    bizKW: [
      'China.*ASEAN.*investment', 'China.*Southeast Asia deal',
      'Southeast Asia.*manufacturing shift', 'China.*Vietnam investment',
      'China.*Asia.*supply chain', 'Asia.*investment opportunity',
      'China.*outbound investment', 'RCEP.*trade deal',
    ],
    contextKW: [
      'China-ASEAN', 'China.*Southeast', 'China.*Vietnam',
      'China.*Japan', 'China.*South.*Korea', 'China outbound',
      'Southeast Asia.*trade', 'Asia.*manufacturing', 'supply chain.*shift'
    ],
    industryKW: [
      'semiconductor', 'technology', 'EV', 'battery', 'manufacturing',
      'supply.*chain', 'trade', 'AI', 'chips', 'outsourcing'
    ],
    threshold: 2,
  },
  {
    id: 'cnbc-asia',
    country: 'all', tier: 0, name: 'CNBC Asia Pacific',
    type: 'rss', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    bizKW: [
      'China.*investment deal', 'Asia.*M&A', 'China.*semiconductor deal',
      'Asia.*manufacturing shift', 'China.*supply chain', 'Asia IPO',
    ],
    contextKW: [
      'China', 'Asia', 'ASEAN', 'trade', 'investment', 'manufacturing',
      'supply chain', 'semiconductor', 'EV'
    ],
    industryKW: [
      'technology', 'finance', 'semiconductor', 'EV', 'manufacturing',
      'energy', 'banking', 'real estate'
    ],
    threshold: 2,
  },
  {
    id: 'sg-mothership',
    country: 'all', tier: 0, name: 'Mothership Singapore',
    type: 'rss', url: 'https://mothership.sg/feed/',
    bizKW: [
      'Singapore.*China deal', 'Singapore.*investment',
      'Singapore.*China partnership', 'Singapore.*manufacturing',
      'Singapore.*semiconductor', 'Singapore.*tech deal',
    ],
    contextKW: [
      'China', 'Chinese', 'ASEAN', 'trade', 'investment',
      'Southeast Asia', 'Singapore', 'business'
    ],
    industryKW: [
      'technology', 'fintech', 'logistics', 'semiconductor', 'manufacturing'
    ],
    threshold: 2,
  },
  {
    id: 'trade-splash',
    country: 'all', tier: 0, name: 'Splash247 Maritime Trade',
    type: 'rss', url: 'https://splash247.com/feed/',
    bizKW: [
      'China.*shipping deal', 'Singapore.*port deal',
      'Asia.*shipping contract', 'shipping.*China.*Asia',
      'port.*investment Asia', 'freight.*contract Asia',
      'Maritime.*China.*Southeast', 'supply chain.*Asia',
    ],
    contextKW: [
      'China', 'Asia', 'ASEAN', 'Vietnam', 'Japan', 'Korea',
      'trade', 'shipping', 'logistics', 'export', 'import'
    ],
    industryKW: [
      'shipping', 'logistics', 'freight', 'supply chain', 'trade finance',
      'port', 'manufacturing', 'automotive'
    ],
    threshold: 2,
  },

  // ══════════════════════════ 政府贸易门户 (Government Trade Portals) ══════════════════════════
  // 来自各国政府机构的数据源，商机关联性更强，噪音更低
  {
    id: 'gov-kotra-news',
    country: 'south-korea', tier: 1,
    name: 'KOTRA 韩国贸易协会',
    type: 'rss', url: 'https://www.kotra.or.kr/khotlinks/cnnews/rss/mainNews.do',
    bizKW: [
      '투자.*中国', '협력.*中国企业', '中国.*사업',
      '对中国.*OEM', '对中国.*調達', '中国企业.*招商引资',
      '한국.*中国.*합작', '한국.*中国.*투자', '한국.*中国.*협력',
      'korean.*seeking supplier', 'Korea.*China JV', 'Korea.*China deal',
    ],
    contextKW: [
      '중국', '한중', '중한', '한국.*중국', 'China', 'Chinese',
      '투자', '협력', '합작', '사업', '투자유치'
    ],
    industryKW: [
      '반도체', '전자', '자동차', 'EV', ' Battery', '로봇',
      '정밀기계', '화학', '의료', '바이오', 'pharma', 'semiconductor'
    ],
    threshold: 2,
  },
  {
    id: 'gov-thai-boi',
    country: 'thailand', tier: 2,
    name: 'BOI Thailand 投资促进委员会',
    type: 'rss', url: 'https://www.boi.go.th/feed/news/boi-news',
    bizKW: [
      'China.*investment', 'Chinese investor', 'Thailand.*China.*project',
      'EEC.*China', 'Thailand.*China JV', 'Thai.*China deal',
      'Thailand.*China FDI', 'Thai.*procurement.*China',
      'BOI.*incentive.*China', 'Thailand.*supply chain.*China',
    ],
    contextKW: [
      'China', 'Chinese', 'ASEAN', 'EEC', 'FDI', 'BOI',
      'trade', 'export', 'import', 'investment', 'manufacturing'
    ],
    industryKW: [
      'EV', 'electronics', 'automotive', 'battery', 'semiconductor',
      'food', 'agri', 'pharma', 'machinery', 'manufacturing',
      'circuit', 'chip', 'robot', 'digital', 'bio'
    ],
    threshold: 2,
  },
  {
    id: 'gov-sg-esh',
    country: 'singapore', tier: 1,
    name: 'ESG Singapore 企业发展局',
    type: 'html',
    url: 'https://www.enterprisesg.gov.sg/media-centre',
    bizKW: [
      'Singapore.*China partnership', 'Singapore.*China JV',
      'Singapore.*Chinese investor', 'Singapore.*ASEAN.*China',
      'Singapore.*manufacturing.*China', 'Singapore.*technology.*China',
      'Singapore.*investment.*China', 'Singapore.*deal.*China',
    ],
    contextKW: [
      'China', 'Chinese', 'ASEAN', 'Singapore', 'enterprise',
      'investment', 'manufacturing', 'technology', 'trade', 'partnership'
    ],
    industryKW: [
      'semiconductor', 'electronics', 'precision', 'pharma', 'biomedical',
      'fintech', 'AI', 'manufacturing', 'logistics', 'chemicals',
      'machinery', 'robot', 'EV', 'battery'
    ],
    threshold: 2,
  },
  {
    id: 'gov-vn-moit',
    country: 'vietnam', tier: 1,
    name: 'MOIT Vietnam 工业与贸易部',
    type: 'html',
    url: 'https://moit.gov.vn/vn/tin-tuc/',
    bizKW: [
      'tìm.*đối tác', 'tìm.*nhà cung cấp', 'nhập.*từ Trung Quốc',
      'xuất.*sang Trung Quốc', 'đầu tư.*Trung Quốc', 'hợp tác.*Trung Quốc',
      'Vietnam.*China JV', 'Vietnam.*Chinese supplier',
      'Vietnam.*import.*China', 'Vietnam.*export.*China',
    ],
    contextKW: [
      'Trung Quốc', '中国', 'xuất khẩu', 'nhập khẩu', 'đầu tư FDI',
      'Chinese', 'import', 'export', 'invest', 'manufacturing',
      'FDI', 'supply chain', 'cán cân thương mại', 'MOIT', 'Bộ Công Thương'
    ],
    industryKW: [
      'điện tử', 'electronics', 'thép', 'steel', 'dệt nhuộm', 'textile',
      'nội thất', 'furniture', 'manufacturing', 'nông sản', 'agri',
      'logistics', 'EV', 'semi', 'battery', 'ô tô', 'automotive',
      'thực phẩm', 'food', 'cơ khí', 'machinery', 'nhựa', 'plastic',
      'hóa chất', 'chemical', 'dược phẩm', 'pharma', 'bán dẫn'
    ],
    threshold: 2,
  },
  {
    id: 'gov-my-miti',
    country: 'malaysia', tier: 2,
    name: 'MATRADE Malaysia 对外贸易发展局',
    type: 'html',
    url: 'https://www.matrade.gov.my/en/media/news',
    bizKW: [
      'Malaysia.*China.*investment', 'Malaysia.*China deal',
      'China.*Malaysia JV', 'Malaysia.*Chinese partner',
      'Malaysia.*supply chain.*China', 'Malaysia.*import.*China',
      'MATRADE.*China', 'Malaysia.*RCEP.*China',
      'looking.*supplier.*Malaysia',
    ],
    contextKW: [
      'China', 'Chinese', 'MATRADE', 'Malaysia', 'ASEAN',
      'trade', 'export', 'import', 'investment', 'manufacturing',
      'supply chain', 'RCEP', 'E&E', 'halal'
    ],
    industryKW: [
      'semiconductor', 'electronics', 'E&E', 'automotive', 'solar',
      'oil.*gas', 'palm oil', 'medical', 'glove', 'manufacturing',
      'chemical', 'pharma', 'food', 'halal', 'machinery'
    ],
    threshold: 2,
  },
  {
    id: 'gov-id-bkpm',
    country: 'indonesia', tier: 2,
    name: 'BKPM Indonesia 投资统筹机构',
    type: 'html',
    url: 'https://nsop.go.id/news',
    bizKW: [
      'Indonesia.*China investasi', 'mitra.*China',
      'kerja sama.*China', 'joint venture.*Indonesia',
      'Indonesia.*import dari China', 'Indonesia.*RCEP',
      'Indonesia.*FDI.*China', 'Indonesia OEM',
    ],
    contextKW: [
      'China', 'Cina', 'Indonesia', 'ASEAN', 'BKPM',
      'trade', 'export', 'import', 'investasi', 'manufacturing',
      'bilateral', 'RCEP', 'FDI', 'investment'
    ],
    industryKW: [
      'nickel', 'nikel', 'EV', 'battery', 'semiconductor',
      'textile', 'manufacturing', 'coal', 'palm oil', 'agri',
      'FMCG', 'chemical', 'mining', 'smelter'
    ],
    threshold: 2,
  },
  {
    id: 'gov-jp-meti',
    country: 'japan', tier: 1,
    name: 'METI 日本经济产业省',
    type: 'rss', url: 'https://www.meti.go.jp/english/rss/0201.xml',
    bizKW: [
      '代理店', '经销', '代理商募集', '招募经销商', 'OEM.*募集',
      '調達.*中国企业', '中国側.*調達', '中国企业提供',
      '对中国企业感兴趣', '中国侧合作伙伴', 'joint venture.*募集',
      '对中国.*進出', '中国側.*パートナー', 'manufacturing partner',
    ],
    contextKW: [
      '中国', 'China', 'Chinese', 'ASEAN', '日中', '対中',
      '輸出', '輸入', '製造業', 'trade', 'industry', 'cooperation'
    ],
    industryKW: [
      '半導', 'EV', 'robot', 'AI', '精密機械', 'manufacturing',
      'electronics', 'chemical', 'medical', 'semiconductor',
      'battery', '新材料', ' hydrogen', ' factory'
    ],
    threshold: 2,
  },
  {
    id: 'gov-in-dpiit',
    country: 'india', tier: 3,
    name: 'DPIIT India 工业与内贸促进部',
    type: 'html',
    url: 'https://dipp.gov.in/latest-announcements',
    bizKW: [
      'India.*China.*investment', 'India.*China JV', 'India.*Chinese partner',
      'seeking India partner', 'India.*import.*China', 'India.*supply chain',
      'PLI.*investment.*China', 'India.*China deal', 'India.*manufacturing deal',
    ],
    contextKW: [
      'China', 'Chinese', 'DPIIT', 'India', 'ASEAN',
      'trade', 'export', 'import', 'investment', 'manufacturing',
      'bilateral', 'PLI', 'Make in India', 'FDI'
    ],
    industryKW: [
      'semiconductor', 'pharma', 'textile', 'chemical', 'steel',
      'auto', 'EV', 'electronics', 'IT', 'manufacturing', 'API',
      'machinery', 'battery', 'solar', 'toy', 'furniture'
    ],
    threshold: 2,
  },
  {
    id: 'gov-pk-boi',
    country: 'pakistan', tier: 3,
    name: 'BOI Pakistan 投资委员会',
    type: 'html',
    url: 'https://boi.gov.pk/News',
    bizKW: [
      'Pakistan.*China.*investment', 'CPEC.*partner',
      'Pakistan.*Chinese partner', 'Pakistan.*China deal',
      'Pakistan.*China JV', 'Pakistan.*import.*China',
      'Pakistan.*manufacturing.*China', 'Karachi.*China',
      'China.*Pakistan.*FDI',
    ],
    contextKW: [
      'China', 'Chinese', 'Pakistan', 'CPEC', 'BOI',
      'trade', 'export', 'import', 'investment', 'manufacturing', 'FDI'
    ],
    industryKW: [
      'textile', 'pharma', 'chemical', 'steel', 'machinery',
      'electronics', 'agri', 'food processing', 'manufacturing',
      'automotive', 'solar', 'EV', 'construction'
    ],
    threshold: 2,
  },
  {
    id: 'gov-kh-cci',
    country: 'cambodia', tier: 3,
    name: 'CCI Cambodia 商会',
    type: 'html',
    url: 'https://www.cciscam.org/en/news',
    bizKW: [
      'Cambodia.*China investment', 'Cambodia.*Chinese partner',
      'Cambodia.*China JV', 'Cambodia.*manufacturing.*China',
      'Cambodia.*FDI.*China', 'Sihanoukville.*China',
      'Cambodia.*supply chain',
    ],
    contextKW: [
      'China', 'Chinese', 'Cambodia', 'Cambodian', 'ASEAN', 'CCI',
      'trade', 'export', 'import', 'investment', 'manufacturing', 'FDI'
    ],
    industryKW: [
      'garment', 'textile', 'agriculture', 'agri', 'manufacturing',
      'construction', 'tourism', 'logistics', 'food processing',
      'electronics', 'machinery', 'furniture'
    ],
    threshold: 2,
  },
  {
    id: 'gov-mm-dica',
    country: 'myanmar', tier: 3,
    name: 'DICA Myanmar 投资与公司管理局',
    type: 'html',
    url: 'https://www.dica.gov.mm/news',
    bizKW: [
      'Myanmar.*China investment', 'Myanmar.*Chinese partner',
      'Myanmar.*China JV', 'Myanmar.*manufacturing.*China',
      'Yangon.*China', 'Myanmar.*FDI.*China',
      'Myanmar.*supply chain',
    ],
    contextKW: [
      'China', 'Chinese', 'Myanmar', 'Burmese', 'ASEAN', 'DICA',
      'trade', 'export', 'import', 'investment', 'manufacturing', 'FDI'
    ],
    industryKW: [
      'garment', 'textile', 'agriculture', 'mining',
      'manufacturing', 'construction', 'logistics', 'food processing',
      'electronics', 'machinery', 'natural gas', 'oil'
    ],
    threshold: 2,
  },
  {
    id: 'gov-la-pci',
    country: 'laos', tier: 3,
    name: 'PCI Laos 投资促进委员会',
    type: 'html',
    url: 'https://www.investlaos.gov.la/news',
    bizKW: [
      'Laos.*China investment', 'Laos.*Chinese partner',
      'Laos.*China JV', 'Laos.*manufacturing.*China',
      'Laos.*railway.*China', 'Boten.*China', 'Vientiane.*China',
      'Laos.*FDI.*China', 'Laos.*supply chain',
    ],
    contextKW: [
      'China', 'Chinese', 'Laos', 'Laotian', 'ASEAN', 'PCI',
      'trade', 'export', 'import', 'investment', 'manufacturing',
      'FDI', 'railway', 'hydropower', 'mining'
    ],
    industryKW: [
      'hydropower', 'mining', 'agriculture', 'agri', 'manufacturing',
      'construction', 'logistics', 'tourism', 'rubber',
      'coffee', 'food processing', 'battery', 'EV'
    ],
    threshold: 2,
  },
  {
    id: 'gov-ph-peza',
    country: 'philippines', tier: 2,
    name: 'PEZA Philippines 经济特区管理局',
    type: 'html',
    url: 'https://peza.gov.ph/index.php/news-and-announcements',
    bizKW: [
      'Philippines.*China investment', 'Philippines.*Chinese partner',
      'Philippines.*China deal', 'Philippines.*China JV',
      'PEZA.*China', 'Philippines.*FDI.*China',
      'Philippines.*supply chain.*China',
    ],
    contextKW: [
      'China', 'Chinese', 'Philippines', 'Filipino', 'ASEAN', 'PEZA',
      'trade', 'export', 'import', 'investment', 'manufacturing', 'FDI'
    ],
    industryKW: [
      'semiconductor', 'electronics', 'BPO', 'manufacturing',
      'agri', 'tourism', 'infrastructure', 'logistics',
      'garment', 'food processing', 'IT', 'ICT'
    ],
    threshold: 2,
  },
  {
    id: 'gov-jetro-match',
    country: 'japan', tier: 1,
    name: 'JETRO ビジネス・マッチング',
    type: 'html',
    url: 'https://www.jetro.go.jp/services/matching.html',
    bizKW: [
      '代理店', '经销', '代理商募集', '招募经销商', 'OEM.*募集',
      '調達.*中国企业', '中国側.*調達', '中国企业提供',
      '对中国企业感兴趣', '中国侧合作伙伴', '合资', 'JV',
      'joint venture', 'manufacturing partner', 'license.*production',
    ],
    contextKW: [
      '中国', 'China', 'Chinese', 'ASEAN', '日中', '対中',
      '輸出', '輸入', '製造業', 'trade', 'JETRO', 'マッチング'
    ],
    industryKW: [
      '半導', 'EV', 'robot', 'AI', '精密機械', 'manufacturing',
      'electronics', 'chemical', 'medical', 'semiconductor',
      'battery', '新材料'
    ],
    threshold: 2,
  },
  {
    id: 'gov-jetro-china',
    country: 'japan', tier: 1,
    name: 'JETRO 中国ビジネス支援',
    type: 'html',
    url: 'https://www.jetro.go.jp/world/asia/cn/',
    bizKW: [
      '代理店', '经销', '代理商募集', '招募经销商', 'OEM.*募集',
      '調達.*中国企业', '中国側.*調達', '中国企业提供',
      '对中国企业感兴趣', '中国侧合作伙伴', 'joint venture',
      'manufacturing partner', 'license.*production',
    ],
    contextKW: [
      '中国', 'China', 'Chinese', 'ASEAN', '日中', '対中',
      '輸出', '輸入', '製造業', 'trade', 'JETRO'
    ],
    industryKW: [
      '半導', 'EV', 'robot', 'AI', '精密機械', 'manufacturing',
      'electronics', 'chemical', 'medical', 'semiconductor', 'battery'
    ],
    threshold: 2,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// PATTERNS — industry / cooperation / type inference
// ═════════════════════════════════════════════════════════════════════════════
const INDUSTRY_PATTERNS = [
  ['半导体/电子', ['半導', '集積回路', 'semiconductor', 'IC', 'chips', '디스플레이', 'display', 'E&E', '電子', '전자', 'DRAM', 'NAND', 'SOC', 'GPU', 'PCB', 'LED', 'LSI', 'chipsets', 'fab', 'foundry', 'CPU', '传感器', 'sensor', 'sensor', 'カメラ', '镜头', '光学']],
  ['新能源汽车', ['EV', 'Electric Vehicle', '전기자동차', '완성차', ' automobile', ' automotive', '배터리', 'battery', '蓄电池', '新能源', 'E-car', ' Electrified', 'xEV', '电动汽车', '电瓶', '充电桩']],
  ['工业自动化', ['robot', 'ロボット', ' automation', 'FA', '工作機械', '산업로봇', 'machinery', '自动化', 'PLC', 'sensor', 'DCS', ' IoT', '自动化设备', '工业机器人', '自动化系统']],
  ['医疗器械', ['医療', '医薬', '創薬', 'pharma', 'pharmaceutical', 'biomedical', '의료', '병원', 'healthcare', 'medical device', '制药', 'drug', 'clinical', '医药', '生物医药', '医院']],
  ['化工材料', ['化学', '新材料', '素材', 'chemical', 'steel', '化学品', '新材料', 'polymer', 'resin', 'elastomer', '化工', '石化', '树脂', '橡胶', '新材料']],
  ['纺织服装', ['纺织', '衣類', 'textile', 'fabric', '生地', 'garment', 'ตัดเย็บ', 'เสื้อผ้า', 'dệt nhuộm', 'nội thất', 'yarn', 'denim', 'woven', '服装', '面料', '纱线']],
  ['家具制造', ['家具', 'furniture', 'mebel', 'interior', '木工', ' fixture', 'upholstery', 'solid wood', '木质', '家私', '室内装饰']],
  ['食品农业', ['農業', '农业', 'agri', '食品', 'food', '加工食品', '농업', 'Palm Oil', 'nông sản', 'seed', 'fertilizer', 'agrochemical', '农产品', '种植', '畜牧业', '养殖']],
  ['金融服务', ['金融', 'finance', 'fintech', '保险', 'bank', '銀行', '투자', 'investment', 'trading', 'wealth', 'insurtech', '银行', '基金', '投资', '财富管理', '资产管理']],
  ['能源电力', ['エネルギー', '能源', '再エネ', 'hydrogen', ' 水素', 'solar', '光伏', 'EV charging', '電力', 'hydropower', 'coal', 'electric power', 'LNG', 'lng', 'renewable', '电力', '风电', '光伏发电', '天然气', '煤炭']],
  ['IT/软件', ['IT', 'software', 'AI', 'internet', 'IoT', '通信', 'telecom', 'digital', '데이터', '로봇', 'cloud', 'cyber', 'data center', 'SaaS', '人工智能', '数字经济', '数据中心', '云计算']],
  ['贸易/物流', ['logistics', '物流', 'Eコマース', '跨境', 'trade', '通関', 'customs', 'shipping', 'freight', 'supply chain', 'vận tải', 'warehouse', '3PL', 'ecommerce', '供应链', '仓储', '跨境电商', '通关']],
  ['钢铁/金属', ['steel', '鉄', '금속', 'nickel', 'coal', '铝', 'copper', 'mining', 'thép', 'mining', 'metals', 'aluminum', 'zinc', '冶金', '矿产', '稀土', '铝材', '铜材']],
  ['房地产/建筑', ['real estate', '不动', '不動産', 'property', 'construction', '建设', 'infrastructure', 'building', 'bất động sản', 'cement', 'concrete', ' REIT', '基建', '不动产', '地产']],
  ['汽车/摩托车', ['automotive', 'automobile', 'cars', 'vehicles', 'motorcycle', 'OEM', 'auto parts', ' 汽车', '摩托车', '整车', '零部件', '车载']],
  ['教育培训', ['教育', 'education', '培训', 'training', '人才', 'talent', 'HR', 'edtech', '人才培训', '技能培训']],
  ['消费电子', ['consumer electronics', 'smartphone', '手机', '家电', ' home appliance', 'Wearable', 'tablets', 'TV', 'oled', 'lcd panel', '手机', '电视', '显示屏']],
  ['海洋工程', ['shipbuilding', '조선', 'ship', '船舶', 'maritime', '海工', '造船', '航海', '港口', 'port', '码头', '海洋']],
  ['航空航天', ['航空', 'aerospace', 'aviation', 'aircraft', 'drone', ' UAV', '飞机', '无人机', '航天']],
];

const COOPERATION_PATTERNS = [
  ['agency', ['代理店', '经销', '代理商', 'agent', 'distributor', '经销商', 'franchise', 'exclusive rights', 'sole agent']],
  ['distribution', ['分销', '经销', '流通', 'distribution', 'distribution rights', 'regional rights', 'wholesale', '零售']],
  ['oem', ['OEM', 'ODM', '代工', 'manufacturing partner', 'production partner', 'CM', 'contract manufacturer']],
  ['joint-venture', ['合资', '合弁', 'JV', 'joint venture', '合資', 'strategic partnership', '战略合作', 'consortium']],
  ['technology', ['技术合作', 'technology transfer', 'licensing', '技術移転', '专利', 'patent license', 'IP transfer', 'technology sharing']],
];

const TYPE_PATTERNS = [
  ['supply', ['供应', 'Wanted supply', '調達', '募集供应', 'looking supplier', '寻找供应商', 'supplier', 'exports from', 'source from China']],
  ['demand', ['采购', '需求', 'Wanted', 'searching', 'looking buyer', '寻找合作方', '募集', '仕入れ', '求购', 'procurement', 'purchase', 'buyer sought']],
  ['investment', ['投资', '投資', 'M&A', '收购', '参入', '設立', '工場建設', 'investment', 'license factory', '绿地投资', 'FDI inflow']],
  ['cooperation', ['合作', '提携', 'partner', 'joint', 'コンソーシアム', 'business match', 'collaboration', 'joint development']],
];

const NOISE_RE = [
  /不起$/, /^[^\s]{0,10}$/,
  /Russia.*Ukraine/, /Ukraine.*Putin/, /Zelensky/,
  /Houthis/, /Gaza/, /Hamas/, /Israel.*war/, /Palestine/, /mideast war/, /Middle East.*conflict/,
  /地震/, /震度/, /了么/, /海啸/, /台风/, /颱風/, /tembl?or/, /暴雨/, /洪水/,
  /stock market/, /IPO中止/, /証券/, /股价/, /株[javascript]/, /syariah/,
  /COVID/, /pandemic/, /感染/, /疫情/, /防疫/, /coronavirus/,
  /选举/, /election.*result/, /scandal/, /sex.*abuse/, /murder/, /fraud case/,
  // 通用噪音
  /Quote of the Day/, /今日の./, /오늘의/, /ngày.*trích dẫn/,
  /giá vàng/, /gold price/, / ценна/, /油价/, /xăng/, /石油価格/,
  /celebrity/, /star.*news/, /gossip/, /scandal.*update/, /fame.*shame/,
  /Sports.*News/, /politics.*news/, /entertainment.*news/, /lifestyle/,
  /美容/, /美妆/, /整形/, /护肤/, /化妆/, /韩流/, /K-POP/, /Kpop/,
  / тенге/, /円高/, /円安/, /人民元/, /USD/,
  // 娱乐新闻噪音
  /藤原/, /張本/, /瀬戸/, /山下/, /BLACKPINK/, /森/, /出口/,
  // 印度噪音
  /\(.*Taylor Swift.*\)/, /Bill Gates.*Quote/, /Steve Jobs.*Quote/, /No matter.*people/,
  /Dogs can't digest/, /Harbhajan Singh/,
  // 越南噪音
  /vàng.*phục hồi/, /giá.*tuần/,
  // 韩国噪音
  / 마스크/, /요소수/, /생필품/, /발표$/, /금리/, /환율/,
];

// ═════════════════════════════════════════════════════════════════════════════
// REGIONS per country
// ═════════════════════════════════════════════════════════════════════════════
const REGION_MAP = {
  japan: [
    ['jp-tokyo', ['東京', 'Tokyo', '首都圈', '関東', '神奈川', '埼玉', '千葉', 'Kanto']],
    ['jp-osaka', ['大阪', 'Osaka', '関西', '京都', '兵庫', '奈良', 'Kansai', 'Kinki']],
    ['jp-nagoya', ['名古屋', 'Nagoya', '愛知', '岐阜', '三重', 'Chubu', '中部']],
  ],
  vietnam: [
    ['vn-hanoi', ['Hanoi', '河内', '北宁', '北江', '海防', 'Northern Vietnam', 'Bac Ninh', 'Bac Giang', 'Vinh Phuc']],
    ['vn-hcmc', ['Ho Chi Minh', 'Saigon', '胡志明', '同奈', '平阳', '隆安', '南部', 'Southern Vietnam', 'Southeast', 'Vung Tau']],
  ],
  malaysia: [
    ['my-kl', ['Kuala Lumpur', 'Selangor', '吉隆坡', '雪兰莪', 'Greater KL', 'Klang Valley']],
    ['my-penang', ['Penang', '槟城', '威省', 'Kedah', '北部']],
    ['my-johor', ['Johor', '柔佛', '新山', '依斯干达', 'Iskandar']],
  ],
  thailand: [
    ['th-bangkok', ['Bangkok', '曼谷', '中部泰国', 'Krung Thep']],
    ['th-eea', ['Eastern Economic', 'EEC', '罗勇', '春武里', '北柳', 'Chonburi', 'Rayong', 'Samut Prakan']],
  ],
  'south-korea': [
    ['kr-seoul', ['Seoul', '首尔', '仁川', '京畿', 'Gyeonggi']],
    ['kr-busan', ['Busan', '釜山', '蔚山', '岭南', 'Yeongnam']],
  ],
};

const REGION_LABELS = {
  'jp-tokyo': '东京首都圈', 'jp-osaka': '大阪关西圈', 'jp-nagoya': '爱知名古屋圈',
  'vn-hanoi': '河内-北宁工业圈', 'vn-hcmc': '胡志明市南越经济圈',
  'my-kl': '吉隆坡雪兰莪', 'my-penang': '槟城', 'my-johor': '柔佛依斯干达',
  'th-bangkok': '曼谷大都会区', 'th-eea': '东部经济走廊',
  'kr-seoul': '首尔首都圈', 'kr-busan': '釜山岭南圈',
};

// ═════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═════════════════════════════════════════════════════════════════════════════
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

function httpGet(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,ja;q=0.6,ko;q=0.5',
        ...extraHeaders,
      },
    }, res => {
      // follow redirects (up to 3)
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        req.destroy();
        const loc = res.headers.location;
        const newUrl = loc.startsWith('http') ? loc : new URL(loc, url).toString();
        if (newUrl.length < 500) {
          httpGet(newUrl, extraHeaders).then(resolve).catch(reject);
        } else {
          reject(new Error('redirect URL too long'));
        }
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

function matchAny(text, patterns) {
  text = text.substring(0, 800);
  for (const pat of patterns) {
    try {
      const re = new RegExp(pat, 'i');
      if (re.test(text)) return true;
    } catch (e) {}
  }
  return false;
}

function inferIndustry(title, desc) {
  const text = (title + ' ' + desc).substring(0, 800);
  for (const [name, patterns] of INDUSTRY_PATTERNS) {
    if (matchAny(text, patterns)) return name;
  }
  // Only default to 综合商务 if NO industry keyword found at all
  const hasAnyIndustry = INDUSTRY_PATTERNS.some(([, p]) => matchAny(text, p));
  if (!hasAnyIndustry) return '综合商务';
  return '其他行业';
}

function inferCooperationType(title, desc) {
  const text = (title + ' ' + desc).substring(0, 500);
  for (const [type, patterns] of COOPERATION_PATTERNS) {
    if (matchAny(text, patterns)) return type;
  }
  return undefined;
}

function inferOpportunityType(title, desc) {
  const text = (title + ' ' + desc).substring(0, 500);
  for (const [type, patterns] of TYPE_PATTERNS) {
    if (matchAny(text, patterns)) return type;
  }
  return 'cooperation';
}

function inferRegion(title, desc, country) {
  const text = (title + ' ' + desc).substring(0, 600);
  const regions = REGION_MAP[country];
  if (!regions) return undefined;
  for (const [regionId, patterns] of regions) {
    if (matchAny(text, patterns)) return regionId;
  }
  return undefined;
}

function inferRegionLabel(regionId) {
  return REGION_LABELS[regionId] || regionId;
}

function inferCountryFromText(text) {
  text = text.substring(0, 400);
  const m = [
    [['Japan', 'Japanese', 'Nippon', '東京'], 'japan'],
    [['Korea', 'South Korea', 'Korean', 'Seoul', 'Busan'], 'south-korea'],
    [['Singapore', 'Singaporean'], 'singapore'],
    [['Vietnam', 'Vietnamese', 'Hanoi', 'Ho Chi Minh', 'Saigon', 'Việt Nam'], 'vietnam'],
    [['Indonesia', 'Indonesian', 'Jakarta', 'Bandung'], 'indonesia'],
    [['Malaysia', 'Malaysian', 'Kuala Lumpur', 'Penang'], 'malaysia'],
    [['Thailand', 'Thai', 'Bangkok', 'Krung Thep'], 'thailand'],
    [['Philippines', 'Filipino', 'Manila', 'Cebu'], 'philippines'],
    [['India', 'Indian', 'Gujarat', 'Mumbai', 'Bengaluru'], 'india'],
    [['Pakistan', 'Pakistani', 'Karachi', 'Lahore'], 'pakistan'],
    [['Cambodia', 'Cambodian', 'Phnom Penh', 'Sihanouk'], 'cambodia'],
    [['Myanmar', 'Burma', 'Yangon', 'Mandalay'], 'myanmar'],
    [['Laos', 'Laotian', 'Vientiane'], 'laos'],
  ];
  for (const [[kw], id] of m) {
    if (matchAny(text, [kw])) return id;
  }
  return undefined;
}

function isNoise(title, desc) {
  const text = (title + ' ' + desc).substring(0, 600);
  for (const re of NOISE_RE) {
    if (re.test(text)) return true;
  }
  return false;
}

function calcScore(item, source) {
  const text = (item.title + ' ' + item.desc).substring(0, 800);
  const bizKW = source.bizKW || [];
  const contextKW = source.contextKW || source.scoreKW || [];
  const industryKW = source.industryKW || [];

  // bizKW 命中：直接标记为优先商机
  if (bizKW.length > 0 && matchAny(text, bizKW)) return 5;

  // 评分系统（无 bizKW 时）
  let score = 0;

  // 背景/国家关键词命中（亚洲-中国贸易核心信号） +1
  if (matchAny(text, contextKW)) score += 1;

  // 高价值来源 +1
  if (source.tier === 1) score += 1;

  // 行业关键词命中 +1
  if (matchAny(text, industryKW)) score += 1;

  return score;
}

function generateId() {
  return 'opp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

// ── Parse RSS / Atom ─────────────────────────────────────────────────────────
function parseRSS(xml) {
  if (!xml || xml.length < 50) return [];
  const items = [];

  // Try <item> (RSS 2.0)
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const b = m[1];
    const gt = tag => {
      const cd = new RegExp('<' + tag + '[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/' + tag + '>', 'i').exec(b);
      const pl = new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i').exec(b);
      return cd ? cd[1].trim() : (pl ? pl[1].trim() : '');
    };
    const strip = s => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const title = strip(gt('title'));
    const desc  = strip(gt('description') + ' ' + gt('summary') + ' ' + gt('content:encoded') + ' ' + gt('summary'));
    if (!title || title.length < 5) continue;
    items.push({
      title,
      desc:  desc.substring(0, 600) || '暂无描述',
      link:  gt('link'),
      pd:    gt('pubDate') || gt('dc:date') || gt('updated') || gt('published') || '',
      guid:  gt('guid') || gt('id') || gt('link') || '',
    });
  }

  // Try <entry> (Atom)
  if (!items.length) {
    const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((m = entryRe.exec(xml)) !== null) {
      const b = m[1];
      const gt = tag => {
        const cd = new RegExp('<' + tag + '[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/' + tag + '>', 'i').exec(b);
        const pl = new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i').exec(b);
        return cd ? cd[1].trim() : (pl ? pl[1].trim() : '');
      };
      const strip = s => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const title = strip(gt('title'));
      const desc  = strip(gt('summary') + ' ' + gt('content'));
      if (!title || title.length < 5) continue;
      items.push({
        title,
        desc:  desc.substring(0, 600) || '暂无描述',
        link:  gt('link'),
        pd:    gt('published') || gt('updated') || gt('dc:date') || '',
        guid:  gt('id') || gt('link') || '',
      });
    }
  }

  return items;
}

// ── Parse HTML (cheerio fallback) ─────────────────────────────────────────────
function parseHTML(html) {
  if (!cheerio || !html || html.length < 200) return [];
  const $ = cheerio.load(html);
  const items = [];
  $('article, .article, .news-item, .post, .entry').slice(0, 20).each((i, el) => {
    const $el = $(el);
    const title = $el.find('h1,h2,h3,.title,a').first().text().trim().substring(0, 200);
    const desc  = $el.find('p,.excerpt,.summary,.description').first().text().trim().substring(0, 300);
    const link  = $el.find('a').first().attr('href') || '';
    if (title && title.length > 5) {
      items.push({ title, desc, link, pd: '', guid: '' });
    }
  });
  return items;
}

// ── Fetch single source ────────────────────────────────────────────────────────
async function fetchSource(source) {
  if (COUNTRY_FILTER && source.country !== COUNTRY_FILTER && source.country !== 'all') {
    return [];
  }

  log(`Fetching [${source.country}] ${source.name}...`);

  try {
    let xml;
    if (source.type === 'rss') {
      xml = await httpGet(source.url);
    } else if (source.type === 'html' && cheerio) {
      xml = await httpGet(source.url); // we use xml var name for HTML content
    } else {
      return [];
    }

    if (!xml || xml.length < 50) {
      log(`  WARN: empty response from ${source.name}`);
      return [];
    }

    const raw = source.type === 'rss' ? parseRSS(xml) : parseHTML(xml);
    if (!raw.length) {
      log(`  WARN: no items parsed from ${source.name}`);
      return [];
    }

    const results = [];
    for (const item of raw.slice(0, LIMIT_PER_SOURCE)) {
      if (isNoise(item.title, item.desc)) continue;
      const score = calcScore(item, source);
      if (score < source.threshold) continue;

      const industry     = inferIndustry(item.title, item.desc);
      const coopType     = inferCooperationType(item.title, item.desc);
      const oppType      = inferOpportunityType(item.title, item.desc);
      const region       = inferRegion(item.title, item.desc, source.country);
      const countryId    = source.country === 'all'
        ? (inferCountryFromText(item.title + ' ' + item.desc) || 'vietnam')
        : source.country;

      const expiresAt    = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);
      let publishedAt;
      try { publishedAt = item.pd ? new Date(item.pd).toISOString() : new Date().toISOString(); }
      catch (e) { publishedAt = new Date().toISOString(); }

      results.push({
        id:             generateId(),
        title:           item.title.substring(0, 200),
        titleEn:         undefined,
        description:     item.desc.substring(0, 500),
        descriptionEn:   undefined,
        type:            oppType,
        country:         countryId,
        region:          region,
        regionLabel:     region ? inferRegionLabel(region) : undefined,
        industry,
        cooperationType: coopType,
        amount:          undefined,
        currency:        undefined,
        companyName:     source.name,
        companyNameEn:   undefined,
        contactEmail:    'customer@zxqconsulting.com',
        publishedAt,
        expiresAt:       expiresAt.toISOString(),
        status:          'active',
        isPremium:       score >= 6,
        dataSource:      source.id,
        _rawLink:        item.link,
      });
    }

    log(`  ${raw.length} raw → ${results.length} kept (score≥${source.threshold})`);
    return results;
  } catch (e) {
    log(`  FAIL: ${e.message.substring(0, 80)}`);
    return [];
  }
}

// ── Main run ─────────────────────────────────────────────────────────────────
async function run() {
  log('========== AsiaBridge 采集器 v11 启动 ==========');
  log(`Sources: ${SOURCES.length} configured | Dry: ${IS_DRY_RUN} | Filter: ${COUNTRY_FILTER || 'none'} | Limit: ${LIMIT_PER_SOURCE}/source`);

  // Run in waves of CONCURRENCY
  const allItems = [];
  for (let i = 0; i < SOURCES.length; i += CONCURRENCY) {
    const wave = SOURCES.slice(i, i + CONCURRENCY);
    const waveResults = await Promise.all(wave.map(fetchSource));
    for (const items of waveResults) {
      allItems.push(...items);
    }
    if (i + CONCURRENCY < SOURCES.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  // Deduplicate by title (first 70 chars)
  const seen = {};
  const unique = allItems.filter(item => {
    const key = item.title.substring(0, 70).toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });

  log(`Collected: ${allItems.length} items → ${unique.length} unique`);

  // Stats
  const byCountry = {};
  unique.forEach(o => { byCountry[o.country] = (byCountry[o.country] || 0) + 1; });
  const sortedCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]);
  log('By country: ' + sortedCountries.map(([c, n]) => c + ':' + n).join(', '));

  const byIndustry = {};
  unique.forEach(o => { byIndustry[o.industry] = (byIndustry[o.industry] || 0) + 1; });
  const topIndustry = Object.entries(byIndustry).sort((a, b) => b[1] - a[1]).slice(0, 5);
  log('Top industries: ' + topIndustry.map(([i, n]) => i + ':' + n).join(', '));

  // Merge with existing
  if (!IS_DRY_RUN) {
    let existing = [];
    const existingPath = path.join(DATA_DIR, 'opportunities.json');
    try { if (fs.existsSync(existingPath)) existing = JSON.parse(fs.readFileSync(existingPath, 'utf8')); }
    catch (e) { log('WARN: could not read existing data'); }

    // Keep manual entries (no dataSource)
    const manualEntries = existing.filter(o => !o.dataSource);
    // Keep existing auto entries if they're still recent (< 60 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60);
    const recentAuto = existing.filter(o => o.dataSource && new Date(o.publishedAt) > thirtyDaysAgo);

    // Deduplicate against existing
    const existingTitles = new Set([...manualEntries, ...recentAuto].map(o =>
      o.title.substring(0, 70).toLowerCase().replace(/\s+/g, ' ').trim()
    ));
    const trulyNew = unique.filter(o => !existingTitles.has(
      o.title.substring(0, 70).toLowerCase().replace(/\s+/g, ' ').trim()
    ));

    const merged = [...manualEntries, ...recentAuto, ...trulyNew]
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 500); // cap at 500 entries

    log(`Merged: ${manualEntries.length} manual + ${recentAuto.length} recent + ${trulyNew.length} new = ${merged.length} total`);

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2));
    log(`Saved opportunities.json: ${merged.length} entries`);

    // Trigger ISR on Vercel
    if (process.env.VERCEL_REVALIDATE_HOOK) {
      try {
        const { execSync } = require('child_process');
        execSync(`curl -s --max-time 15 -X POST "${process.env.VERCEL_REVALIDATE_HOOK}"`, { timeout: 20000 });
        log('ISR revalidation triggered OK');
      } catch (e) {
        log('ISR trigger WARN: ' + e.message.substring(0, 80));
      }
    }
  }

  log('========== 采集完成 ==========');
}

run().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
