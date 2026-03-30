export type UserRole = 'viewer' | 'member' | 'premium' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface Region {
  id: string;
  nameZh: string;
  nameEn: string;
  countryId: string;
  description?: string;
}

export interface Country {
  id: string;
  nameZh: string;
  nameEn: string;
  flag: string;
  tier: 1 | 2 | 3;
  gdp?: string;
  population?: string;
  mainIndustries: string[];
  summary: string;
  summaryEn: string;
  regions: Region[];
}

export interface BusinessOpportunity {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  type: 'supply' | 'demand' | 'investment' | 'cooperation';
  country: string;
  region?: string;
  industry: string;
  amount?: string;
  currency?: 'CNY' | 'JPY' | 'USD';
  companyName: string;
  companyNameEn?: string;
  contactEmail: string;
  publishedAt: string;
  expiresAt: string;
  status: 'active' | 'pending' | 'closed';
  isPremium: boolean;
  regionLabel?: string;
  cooperationType?: 'agency' | 'distribution' | 'oem' | 'joint-venture' | 'technology';
  dataSource?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  nameEn: string;
  tagline: string;
  taglineEn: string;
  price: number;
  priceUnit: 'month' | 'year' | 'once';
  currency: 'CNY' | 'USD';
  features: string[];
  featuresEn: string[];
  highlighted?: boolean;
  badge?: string;
  cta: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod: string;
  amount: number;
}

export interface User {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  phone: string;
  country: string;
  industry: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin: string;
  subscription: {
    planId: string;
    status: 'active' | 'cancelled' | 'expired' | 'none';
    startDate: string;
    endDate: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SiteConfig {
  siteName: string;
  siteNameEn: string;
  tagline: string;
  taglineEn: string;
  description: string;
  descriptionEn: string;
  domain: string;
  email: string;
}
