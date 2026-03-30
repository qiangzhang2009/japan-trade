import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
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
  return formatDate(dateString);
}

export function formatCurrency(
  amount: number,
  currency: 'CNY' | 'JPY' | 'USD' | 'EUR' = 'USD',
): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
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

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    policy: '政策法规',
    trade: '贸易动态',
    industry: '行业观察',
    market: '市场行情',
    event: '展会活动',
  };
  return labels[category] ?? category;
}

export function getCountryLabel(country: string): string {
  const labels: Record<string, string> = {
    japan: '日本',
    'south-korea': '韩国',
    singapore: '新加坡',
    vietnam: '越南',
    indonesia: '印尼',
    malaysia: '马来西亚',
    thailand: '泰国',
    philippines: '菲律宾',
    laos: '老挝',
    cambodia: '柬埔寨',
    myanmar: '缅甸',
    india: '印度',
    pakistan: '巴基斯坦',
  };
  return labels[country] ?? country;
}

export function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    japan: '🇯🇵',
    'south-korea': '🇰🇷',
    singapore: '🇸🇬',
    vietnam: '🇻🇳',
    indonesia: '🇮🇩',
    malaysia: '🇲🇾',
    thailand: '🇹🇭',
    philippines: '🇵🇭',
    laos: '🇱🇦',
    cambodia: '🇰🇭',
    myanmar: '🇲🇲',
    india: '🇮🇳',
    pakistan: '🇵🇰',
  };
  return flags[country] ?? '🌏';
}

export function getOpportunityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    supply: '供应信息',
    demand: '采购需求',
    investment: '投资项目',
    cooperation: '合作洽谈',
  };
  return labels[type] ?? type;
}

export function getCooperationTypeLabel(type?: string): string {
  if (!type) return '';
  const labels: Record<string, string> = {
    agency: '代理',
    distribution: '经销',
    oem: 'OEM/代工',
    'joint-venture': '合资',
    technology: '技术合作',
  };
  return labels[type] ?? type;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    pending: 'text-amber-600 bg-amber-50 border-amber-200',
    closed: 'text-stone-500 bg-stone-50 border-stone-200',
    expired: 'text-stone-500 bg-stone-100 border-stone-200',
  };
  return colors[status] ?? 'text-stone-600 bg-stone-50';
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
    stable: 'text-stone-500',
  };
  return colors[trend] ?? 'text-stone-500';
}

export function getTierLabel(tier: 1 | 2 | 3): string {
  const labels: Record<number, string> = {
    1: '高价值市场',
    2: '增长市场',
    3: '新兴前沿',
  };
  return labels[tier] ?? '';
}

export function getTierColor(tier: 1 | 2 | 3): string {
  const colors: Record<number, string> = {
    1: 'border-amber-300 bg-amber-50 text-amber-700',
    2: 'border-stone-300 bg-stone-50 text-stone-600',
    3: 'border-orange-300 bg-orange-50 text-orange-700',
  };
  return colors[tier] ?? '';
}
