import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = 'JOD'): string {
  return new Intl.NumberFormat('ar-JO', {
    style: 'currency',
    currency: currency === 'JOD' ? 'JOD' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-JO').format(num);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  if (days < 365) return `منذ ${Math.floor(days / 30)} شهراً`;

  return d.toLocaleDateString('ar-JO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDistance(km: number): string {
  return `${formatNumber(km)} كم`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateSlug(brand: string, model: string, year: number, id: string): string {
  return `${slugify(brand)}-${slugify(model)}-${year}-${id.slice(0, 8)}`;
}

export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function getImageUrl(url: string | null | undefined, fallback?: string): string {
  if (url) return url;
  return fallback || '/images/placeholder-car.svg';
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

export function validatePhone(phone: string): boolean {
  const jordanPhoneRegex = /^(?:\+962|00962|0)?[7]\d{8}$/;
  return jordanPhoneRegex.test(phone.replace(/\s/g, ''));
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getFuelTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PETROL: 'بنزين',
    DIESEL: 'ديزل',
    HYBRID: 'هايبرد',
    ELECTRIC: 'كهرباء',
    PLUGIN_HYBRID: 'هايبرد بلق إن',
  };
  return labels[type] || type;
}

export function getTransmissionLabel(type: string): string {
  const labels: Record<string, string> = {
    MANUAL: 'يدوي',
    AUTOMATIC: 'أوتوماتيك',
    CVT: 'CVT',
    DCT: 'DCT',
    SEMI_AUTOMATIC: 'نصف أوتوماتيك',
  };
  return labels[type] || type;
}

export function getDrivetrainLabel(type: string): string {
  const labels: Record<string, string> = {
    FWD: 'دفع أمامي',
    RWD: 'دفع خلفي',
    AWD: 'دفع كلي',
    FOUR_WD: 'دفع رباعي',
  };
  return labels[type] || type;
}

export function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    EXCELLENT: 'ممتازة',
    VERY_GOOD: 'ممتازة جداً',
    GOOD: 'جيدة جداً',
    FAIR: 'جيدة',
    NEEDS_MAINTENANCE: 'تحتاج صيانة',
    NEEDS_INSPECTION: 'تحتاج فحص شامل',
  };
  return labels[condition] || condition;
}

export function getBodyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SUV: 'دفع رباعي',
    SEDAN: 'سيدان',
    HATCHBACK: 'هاتشباك',
    COUPE: 'كوبيه',
    CONVERTIBLE: 'مكشوفة',
    WAGON: 'ستيشن',
    PICKUP: 'بيك أب',
    VAN: 'فان',
    MINIVAN: 'ميني فان',
    CROSSOVER: 'كروس أوفر',
    SPORTS: 'رياضية',
    LUXURY: 'فاخرة',
  };
  return labels[type] || type;
}
