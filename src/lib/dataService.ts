import { BusinessOpportunity, Country } from '@/types';
import fs from 'fs/promises';
import path from 'path';

function getDataFilePath(filename: string): string {
  return path.join(process.cwd(), 'public', 'data', filename);
}

async function readJSONFile<T>(filename: string): Promise<T[]> {
  try {
    const filePath = getDataFilePath(filename);
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function fetchJSON<T>(url: string, options?: { revalidate?: number }): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: options?.revalidate ?? 3600 },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ============== Site Stats (centralized, avoid duplication) ==============

export async function getSiteStats() {
  const [countries, opportunities] = await Promise.all([
    getCountries(),
    getOpportunities(),
  ]);

  const activeCountries = new Set(
    opportunities
      .filter((o) => o.status === 'active')
      .map((o) => o.country)
  );

  return {
    activeCountriesCount: activeCountries.size,
    totalCountries: countries.length,
    opportunitiesCount: opportunities.filter((o) => o.status === 'active').length,
    lastUpdated: new Date().toISOString(),
  };
}

// ============== Country Data ==============

export async function getCountries(): Promise<Country[]> {
  return readJSONFile<Country>('countries.json');
}

export async function getCountryById(id: string): Promise<Country | null> {
  const all = await getCountries();
  return all.find((c) => c.id === id) || null;
}

export async function getCountriesByTier(tier: 1 | 2 | 3): Promise<Country[]> {
  const all = await getCountries();
  return all.filter((c) => c.tier === tier);
}

// ============== Opportunities ==============

export async function getOpportunities(): Promise<BusinessOpportunity[]> {
  return readJSONFile<BusinessOpportunity>('opportunities.json');
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
