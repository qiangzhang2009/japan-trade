// ── Country ──────────────────────────────────────────────────────────────────

export interface Country {
  id: string;
  nameZh: string;
  nameEn: string;
  flag: string;
  tier: 1 | 2 | 3;
  region: string;
  gdp: string;
  population: string;
  gdpPerCapita: string;
  mainIndustries: string[];
  summary: string;
  description: string;
  opportunityCount: number;
  color: string; // accent color for the country card
}

// ── Channel Partner ──────────────────────────────────────────────────────────

export type PartnerType = 'distributor' | 'agent' | 'clinic' | 'pharmacy' | 'hospital' | 'hospital' | 'online' | 'association';
export type QualityScore = 'high' | 'medium' | 'low';

export interface ChannelPartner {
  id: string;
  name: string;
  country: string; // Country.id
  region?: string;
  type: PartnerType;
  quality: QualityScore;
  description: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  socialLinks?: { platform: string; url: string }[];
  relatedLinks?: string[];
  specialties: string[]; // e.g. ['汉方制剂', '保健品', '药食同源']
  languages: string[];
  established?: number;
  tags: string[];
  lastUpdated: string;
}

// ── Opportunity ──────────────────────────────────────────────────────────────

export type OpportunityType = 'supply' | 'demand' | 'investment' | 'partnership' | 'distribution';

export interface Opportunity {
  id: string;
  title: string;
  country: string; // Country.id
  region?: string;
  type: OpportunityType;
  description: string;
  companyName: string;
  contactEmail?: string;
  contactPhone?: string;
  budgetRange?: string;
  investmentAmount?: string;
  industry: string;
  tags: string[];
  publishedAt: string;
  expiryDate?: string;
  urgency: 'hot' | 'new' | 'normal';
  sourceCountry: string; // 'CN' | 'JP' | etc.
}

// ── Service Package ──────────────────────────────────────────────────────────

export interface ServicePackage {
  id: string;
  name: string;
  nameEn: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight?: string;
  cta: string;
}

// ── Case Study ───────────────────────────────────────────────────────────────

export interface CaseStudy {
  id: string;
  company: string;
  industry: string;
  targetCountry: string;
  challenge: string;
  solution: string;
  result: string;
  logo?: string;
}
