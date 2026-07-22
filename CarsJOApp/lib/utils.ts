import { FUEL_TYPES, TRANSMISSION_TYPES, DRIVETRAIN_TYPES, BODY_TYPES, CONDITION_TYPES, JOD_RATES } from './constants';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ar-JO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(price) + ' د.أ';
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return d.toLocaleDateString('ar-JO', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDistance(km: number): string {
  if (km >= 1000) return (km / 1000).toFixed(1) + 'K كم';
  return km + ' كم';
}

export function formatYear(year: number): string {
  return year.toString();
}

export function getFuelLabel(fuel: string): string {
  return FUEL_TYPES[fuel] || fuel;
}

export function getTransmissionLabel(t: string): string {
  return TRANSMISSION_TYPES[t] || t;
}

export function getDrivetrainLabel(d: string): string {
  return DRIVETRAIN_TYPES[d] || d;
}

export function getBodyTypeLabel(b: string): string {
  return BODY_TYPES[b] || b;
}

export function getConditionLabel(c: string): string {
  return CONDITION_TYPES[c] || c;
}

export function getConditionColor(c: string): string {
  switch (c) {
    case 'EXCELLENT': return '#22C55E';
    case 'VERY_GOOD': return '#84CC16';
    case 'GOOD': return '#3B82F6';
    case 'FAIR': return '#F59E0B';
    case 'POOR': return '#EF4444';
    default: return '#64748B';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'APPROVED': return '#22C55E';
    case 'PENDING': return '#F59E0B';
    case 'REJECTED': return '#EF4444';
    case 'SOLD': return '#8B5CF6';
    default: return '#64748B';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'APPROVED': return 'معتمد';
    case 'PENDING': return 'قيد المراجعة';
    case 'REJECTED': return 'مرفوض';
    case 'SOLD': return 'مباع';
    default: return status;
  }
}

export function getTicketStatusLabel(status: string): string {
  switch (status) {
    case 'OPEN': return 'مفتوح';
    case 'IN_PROGRESS': return 'قيد المعالجة';
    case 'RESOLVED': return 'تم الحل';
    case 'CLOSED': return 'مغلق';
    default: return status;
  }
}

export function getTicketStatusColor(status: string): string {
  switch (status) {
    case 'OPEN': return '#3B82F6';
    case 'IN_PROGRESS': return '#F59E0B';
    case 'RESOLVED': return '#22C55E';
    case 'CLOSED': return '#64748B';
    default: return '#64748B';
  }
}

export function getPriorityLabel(p: string): string {
  switch (p) {
    case 'LOW': return 'منخفضة';
    case 'NORMAL': return 'عادية';
    case 'HIGH': return 'عالية';
    case 'URGENT': return 'عاجلة';
    default: return p;
  }
}

export function getPriorityColor(p: string): string {
  switch (p) {
    case 'LOW': return '#64748B';
    case 'NORMAL': return '#3B82F6';
    case 'HIGH': return '#F59E0B';
    case 'URGENT': return '#EF4444';
    default: return '#64748B';
  }
}

export function convertJODtoUSD(jod: number): number {
  return jod * JOD_RATES.toUSD;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function calculateAge(year: number): number {
  return new Date().getFullYear() - year;
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export function isValidJordanPhone(phone: string): boolean {
  return /^(07[789]\d{7}|9627[789]\d{7})$/.test(phone.replace(/\s/g, ''));
}

export function calculateFairPriceScore(price: number, fairPrice: number): 'low' | 'fair' | 'high' {
  const diff = ((price - fairPrice) / fairPrice) * 100;
  if (diff < -8) return 'low';
  if (diff > 8) return 'high';
  return 'fair';
}
