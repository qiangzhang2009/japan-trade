export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: 'policy' | 'trade' | 'industry' | 'market' | 'event';
  country: 'cn' | 'jp' | 'bilateral';
  tags: string[];
  publishedAt: string;
  imageUrl?: string;
  isFeatured?: boolean;
}

export interface TradeData {
  id: string;
  hsCode: string;
  productName: string;
  productNameJp: string;
  cnExport: number;
  cnImport: number;
  jpExport: number;
  jpImport: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  month: string;
  year: number;
}

export interface BusinessOpportunity {
  id: string;
  title: string;
  titleJp: string;
  description: string;
  descriptionJp: string;
  type: 'supply' | 'demand' | 'investment' | 'cooperation';
  country: 'cn' | 'jp' | 'bilateral';
  industry: string;
  amount?: string;
  currency?: 'CNY' | 'JPY' | 'USD';
  companyName: string;
  companyNameJp?: string;
  contactEmail: string;
  publishedAt: string;
  expiresAt: string;
  status: 'active' | 'pending' | 'closed';
  isPremium: boolean;
  region?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  nameJp: string;
  tagline: string;
  taglineJp: string;
  price: number;
  priceUnit: 'month' | 'year' | 'once';
  currency: 'CNY' | 'JPY' | 'USD';
  features: string[];
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
  companyNameJp?: string;
  country: 'cn' | 'jp' | 'other';
  industry: string;
  role: 'viewer' | 'member' | 'premium';
  createdAt: string;
  lastLogin: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SiteConfig {
  siteName: string;
  siteNameJp: string;
  tagline: string;
  taglineJp: string;
  description: string;
  descriptionJp: string;
  domain: string;
  email: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    wechat?: string;
  };
}
