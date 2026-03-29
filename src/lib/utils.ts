import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string, locale: 'zh' | 'ja' = 'zh'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return formatDate(dateString, 'zh');
}

export function formatCurrency(
  amount: number,
  currency: 'CNY' | 'JPY' | 'USD',
  locale: 'zh' | 'ja' = 'zh'
): string {
  const localeMap = { zh: 'zh-CN', ja: 'ja-JP' };
  const currencyMap = { CNY: 'CNY', JPY: 'JPY', USD: 'USD' };
  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency: currencyMap[currency],
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function getCategoryLabel(category: string, locale: 'zh' | 'ja' = 'zh'): string {
  const labels: Record<string, { zh: string; ja: string }> = {
    policy: { zh: '政策法规', ja: '政策・法規' },
    trade: { zh: '贸易动态', ja: '貿易動向' },
    industry: { zh: '行业观察', ja: '業界観察' },
    market: { zh: '市场行情', ja: '市場行情' },
    event: { zh: '展会活动', ja: '展示会・イベント' },
  };
  return labels[category]?.[locale] ?? category;
}

export function getCountryLabel(country: string): string {
  const labels: Record<string, string> = {
    cn: '中国',
    jp: '日本',
    bilateral: '中日双边',
  };
  return labels[country] ?? country;
}

export function getOpportunityTypeLabel(type: string, locale: 'zh' | 'ja' = 'zh'): string {
  const labels: Record<string, { zh: string; ja: string }> = {
    supply: { zh: '供应信息', ja: '供給情報' },
    demand: { zh: '采购需求', ja: '調達ニーズ' },
    investment: { zh: '投资项目', ja: '投資案件' },
    cooperation: { zh: '合作洽谈', ja: '協力洽谈' },
  };
  return labels[type]?.[locale] ?? type;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    pending: 'text-amber-600 bg-amber-50 border-amber-200',
    closed: 'text-gray-500 bg-gray-50 border-gray-200',
    expired: 'text-gray-500 bg-gray-100 border-gray-200',
  };
  return colors[status] ?? 'text-gray-600 bg-gray-50';
}

export function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  const icons: Record<string, string> = {
    up: '↑',
    down: '↓',
    stable: '→',
  };
  return icons[trend] ?? '→';
}

export function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  const colors: Record<string, string> = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    stable: 'text-gray-500',
  };
  return colors[trend] ?? 'text-gray-500';
}
