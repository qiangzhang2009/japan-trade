import { BusinessOpportunity, Country } from '@/types';
import { mockOpportunities } from '@/lib/mockData';
import fs from 'fs';
import path from 'path';

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
    // silent
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

// ============== 国家数据 ==============

export async function getCountries(): Promise<Country[]> {
  const serverData = readJSONFile<Country[]>('countries.json');
  if (serverData && serverData.length > 0) return serverData;
  return [];
}

export async function getCountryById(id: string): Promise<Country | null> {
  const all = await getCountries();
  return all.find((c) => c.id === id) || null;
}

export async function getCountriesByTier(tier: 1 | 2 | 3): Promise<Country[]> {
  const all = await getCountries();
  return all.filter((c) => c.tier === tier);
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

export async function getOpportunitiesByCountry(countryId: string): Promise<BusinessOpportunity[]> {
  const all = await getOpportunities();
  return all.filter((o) => o.country === countryId && o.status === 'active');
}

// ============== 站点统计 ==============

export async function getSiteStats() {
  const [countries, opportunities] = await Promise.all([
    getCountries(),
    getOpportunities(),
  ]);

  const activeCountries = new Set(opportunities.map((o) => o.country));

  return {
    activeCountriesCount: activeCountries.size,
    totalCountries: countries.length,
    opportunitiesCount: opportunities.filter((o) => o.status === 'active').length,
    lastUpdated: new Date().toISOString(),
  };
}
