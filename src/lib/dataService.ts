import { NewsArticle, TradeData, BusinessOpportunity } from '@/types';
import { mockNews, mockOpportunities, mockTradeData } from '@/lib/mockData';
import fs from 'fs';
import path from 'path';

// 在服务端优先从文件系统读取 JSON（构建时有效）
// 在客户端/无法读取文件系统时使用 fetch

function getDataFilePath(filename: string): string {
  return path.join(process.cwd(), 'public', 'data', filename);
}

function readJSONFile<T>(filename: string): T | null {
  try {
    const filePath = getDataFilePath(filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as T;
    }
  } catch (e) {
    // 静默失败，返回 null
  }
  return null;
}

async function fetchJSON<T>(url: string, options?: { revalidate?: number }): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: options?.revalidate ?? 3600 },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ============== 新闻 ==============

export async function getNews(): Promise<NewsArticle[]> {
  const serverData = readJSONFile<NewsArticle[]>('news.json');
  if (serverData && serverData.length > 0) return serverData;
  return mockNews; // 降级到模拟数据
}

export async function getNewsById(id: string): Promise<NewsArticle | null> {
  const all = await getNews();
  return all.find((n) => n.id === id) || null;
}

export async function getFeaturedNews(): Promise<NewsArticle[]> {
  const all = await getNews();
  return all.filter((n) => n.isFeatured).slice(0, 2);
}

// ============== 贸易数据 ==============

export async function getTradeData(): Promise<TradeData[]> {
  const serverData = readJSONFile<TradeData[]>('trade-data.json');
  if (serverData && serverData.length > 0) return serverData;
  return mockTradeData;
}

// ============== 商机 ==============

export async function getOpportunities(): Promise<BusinessOpportunity[]> {
  const serverData = readJSONFile<BusinessOpportunity[]>('opportunities.json');
  if (serverData && serverData.length > 0) return serverData;
  return mockOpportunities;
}

export async function getOpportunityById(id: string): Promise<BusinessOpportunity | null> {
  const all = await getOpportunities();
  return all.find((o) => o.id === id) || null;
}

export async function getPremiumOpportunities(): Promise<BusinessOpportunity[]> {
  const all = await getOpportunities();
  return all.filter((o) => o.isPremium && o.status === 'active');
}

// ============== 站点统计 ==============

export async function getSiteStats() {
  const [news, opportunities, tradeData] = await Promise.all([
    getNews(),
    getOpportunities(),
    getTradeData(),
  ]);

  const totalTradeValue = tradeData.reduce(
    (sum, item) => sum + item.cnExport + item.jpExport, 0
  );

  return {
    newsCount: news.length,
    opportunitiesCount: opportunities.filter((o) => o.status === 'active').length,
    totalTradeValue,
    lastUpdated: new Date().toISOString(),
  };
}
