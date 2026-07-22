export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://cars-jo-production.up.railway.app';

export const COLORS = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  secondary: '#64748B',
  accent: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  gold: '#F59E0B',
  background: '#FFFFFF',
  backgroundDark: '#0A0A0F',
  card: '#FFFFFF',
  cardDark: '#13131A',
  text: '#0F172A',
  textDark: '#F8FAFC',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  borderDark: '#1E1E2A',
  muted: '#F1F5F9',
  mutedDark: '#1A1A24',
};

export const FUEL_TYPES: Record<string, string> = {
  BENZINE: 'بنزين',
  DIESEL: 'ديزل',
  HYBRID: 'هايبرد',
  ELECTRIC: 'كهرباء',
  GAS: 'غاز',
};

export const TRANSMISSION_TYPES: Record<string, string> = {
  MANUAL: 'يدوي',
  AUTOMATIC: 'أوتوماتيك',
  CVT: 'CVT',
};

export const DRIVETRAIN_TYPES: Record<string, string> = {
  FWD: 'دفع أمامي',
  RWD: 'دفع خلفي',
  AWD: 'دفع رباعي',
  '4WD': 'دفع رباعي',
};

export const BODY_TYPES: Record<string, string> = {
  SEDAN: 'سيدان',
  SUV: 'دفع رباعي',
  HATCHBACK: 'هاتشباك',
  COUPE: 'كوبيه',
  TRUCK: 'شاحنة',
  VAN: 'فان',
  WAGON: 'واgon',
  CONVERTIBLE: 'كابريوليه',
  MINIVAN: 'ميني فان',
};

export const CONDITION_TYPES: Record<string, string> = {
  EXCELLENT: 'ممتاز',
  VERY_GOOD: 'جيد جداً',
  GOOD: 'جيد',
  FAIR: 'مقبول',
  POOR: 'ضعيف',
};

export const PART_TYPES: Record<string, string> = {
  ENGINE: 'محرك',
  TRANSMISSION: 'ناقل حركة',
  BRAKES: 'فرامل',
  SUSPENSION: 'تعليق',
  ELECTRICAL: 'كهرباء',
  BODY: 'هيكل',
  INTERIOR: 'داخلية',
  EXHAUST: 'عادم',
  COOLING: 'تبريد',
  FUEL: 'وقود',
  WHEELS: 'عجلات',
  LIGHTS: 'إضاءة',
  OTHER: 'أخرى',
};

export const MAINTENANCE_CATEGORIES: Record<string, string> = {
  OIL_CHANGE: 'تغيير زيت',
  TIRES: 'إطارات',
  BRAKES: 'فرامل',
  BATTERY: 'بطارية',
  ENGINE: 'محرك',
  TRANSMISSION: 'ناقل حركة',
  ELECTRICAL: 'كهرباء',
  BODYWORK: 'دهان/هيكل',
  AC: 'تكييف',
  SUSPENSION: 'تعليق',
  EXHAUST: 'عادم',
  GENERAL: 'صيانة عامة',
  OTHER: 'أخرى',
};

export const TICKET_CATEGORIES: Record<string, string> = {
  GENERAL: 'عام',
  ACCOUNT: 'الحساب',
  LISTING: 'إعلان',
  PAYMENT: 'دفع',
  BUG: 'خطأ',
  FEATURE: 'طلب ميزة',
  OTHER: 'أخرى',
};

export const ARTICLE_CATEGORIES: Record<string, string> = {
  NEWS: 'أخبار',
  FUEL_PRICES: 'أسعار الوقود',
  CUSTOMS: 'رسوم جمركية',
  REVIEWS: 'مراجعات',
  TIPS: 'نصائح',
};

export const JOD_RATES = {
  toUSD: 1.41,
  toJOD: 1,
};

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
};
