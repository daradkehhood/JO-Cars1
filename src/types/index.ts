export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  image?: string | null;
  role: 'USER' | 'DEALER' | 'ADMIN';
  bio?: string | null;
  dealerName?: string | null;
  dealerLogo?: string | null;
  dealerDescription?: string | null;
  dealerAddress?: string | null;
  dealerLat?: number | null;
  dealerLng?: number | null;
  rating: number;
  ratingCount: number;
  isActive: boolean;
  canPost?: boolean;
  banStatus?: string | null;
  banReason?: string | null;
  banUntil?: string | null;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  badges?: string[];
  createdAt: Date;
  _count?: { cars: number };
}

export interface Brand {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  logo?: string | null;
  country?: string | null;
  models: CarModel[];
}

export interface CarModel {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  brandId: string;
}

export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  provinceId?: string | null;
  province?: { id: string; nameAr: string } | null;
  isActive?: boolean;
  createdAt?: string;
  _count?: { cars: number };
}

export interface CarImage {
  id: string;
  url: string;
  thumbnail?: string | null;
  isCover: boolean;
  aiProcessed: boolean;
  processedUrl?: string | null;
  order: number;
}

export interface Car {
  id: string;
  slug: string;
  status: string;
  featured: boolean;
  featuredUntil?: Date | null;
  isNew: boolean;
  views: number;
  saves: number;
  brandId: string;
  modelId: string;
  year: number;
  trim?: string | null;
  kilometers: number;
  fuelType: string;
  transmission: string;
  color: string;
  doors: number;
  engineCapacity?: number | null;
  cylinders?: number | null;
  drivetrain: string;
  condition: string;
  bodyType?: string | null;
  lightingType?: string | null;
  rimType?: string | null;
  vin?: string | null;
  description: string;
  aiDescription?: string | null;
  price: number;
  cityId: string;
  locationLat?: number | null;
  locationLng?: number | null;
  phone: string;
  whatsapp?: string | null;
  coverImage?: string | null;
  videoUrl?: string | null;
  isNegotiable: boolean;
  hasWarranty: boolean;
  hasServiceHistory: boolean;
  isDamaged: boolean;
  isPaintOriginal: boolean;
  ownerCount: number;
  aiScore?: number | null;
  fairPriceEstimate?: number | null;
  model3dUrl?: string | null;
  model3dStatus: string;
  video360Url?: string | null;
  video360Status: string;
  refCode?: string | null;
  soldAt?: string | null;
  deletedAt?: string | null;
  createdAt: Date;
  expiresAt?: Date | null;
  conditionDetails?: ConditionItem[] | null;
  isFavorited?: boolean;
  
  brand: Brand;
  model: CarModel;
  city: City;
  user: User;
  images: CarImage[];
  _count?: {
    favorites: number;
    messages: number;
  };
}

export interface SearchFilters {
  query?: string;
  brandId?: string;
  modelId?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  cityId?: string;
  fuelType?: string;
  transmission?: string;
  kilometersMin?: number;
  kilometersMax?: number;
  condition?: string;
  bodyType?: string;
  drivetrain?: string;
  color?: string;
  isNew?: boolean;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Message {
  id: string;
  content: string;
  read: boolean;
  createdAt: Date;
  sender: User;
  senderId: string;
  receiver: User;
  receiverId: string;
  car?: Car | null;
  carId?: string | null;
  conversationId?: string | null;
}

export interface Conversation {
  id: string;
  carId: string;
  car?: Car | null;
  buyerId: string;
  buyer: User;
  sellerId: string;
  seller: User;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  price: number;
  userId: string;
  user?: { id: string; name: string; email: string; image?: string | null };
  planDetails?: { id: string; nameAr: string; nameEn: string; price: number; durationDays: number };
}

export interface Plan {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  description: string;
  price: number;
  durationDays: number;
  features: Record<string, boolean>;
  isActive: boolean;
}

export interface Report {
  id: string;
  reason: string;
  description?: string | null;
  status: string;
  createdAt: Date;
  resolvedAt?: Date | null;
  user: User;
  car: Car;
}

export interface UsedPart {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  partType: string;
  brandId?: string | null;
  partNumber?: string | null;
  condition: string;
  price: number;
  currency: string;
  quantity: number;
  images: string;
  coverImage?: string | null;
  phone: string;
  whatsapp?: string | null;
  cityId?: string | null;
  status: string;
  isNegotiable: boolean;
  views: number;
  createdAt: string;
  soldAt?: string | null;
  deletedAt?: string | null;
  user: { id: string; name: string; dealerName?: string | null; phone?: string | null; rating: number; ratingCount: number };
  brand?: { id: string; nameAr: string; nameEn: string; logo?: string | null } | null;
  city?: { id: string; nameAr: string; nameEn: string } | null;
}

export interface UserRating {
  id: string;
  score: number;
  comment?: string | null;
  createdAt: string;
  rater: { id: string; name: string; image?: string | null; dealerName?: string | null };
  car?: { id: string; slug: string; brand: { nameAr: string }; model: { nameAr: string } } | null;
}

export interface ComparisonData {
  cars: Car[];
  specs: {
    label: string;
    labelAr: string;
    values: (string | number | null)[];
  }[];
}

export interface DashboardStats {
  totalCars: number;
  activeCars: number;
  pendingCars: number;
  soldCars: number;
  totalUsers: number;
  totalDealers: number;
  totalViews: number;
  totalReports: number;
  revenue: number;
  carsByBrand: { name: string; count: number }[];
  carsByCity: { name: string; count: number }[];
  carsByMonth: { month: string; count: number }[];
}

export interface AIAnalysisResult {
  priceEstimate?: PriceEstimate;
  damageReport?: DamageReport;
  conditionScore?: ConditionScore;
  extractedSpecs?: ExtractedSpecs;
  description?: string;
  vinInfo?: VINInfo;
}

export interface PriceEstimate {
  minPrice: number;
  fairPrice: number;
  maxPrice: number;
  confidence: number;
  reasoning: string;
  marketFactors: string[];
}

export interface DamageReport {
  damages: Damage[];
  overallScore: number;
  summary: string;
}

export interface Damage {
  type: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface ConditionScore {
  score: number;
  label: string;
  factors: { name: string; score: number; description: string }[];
  summary: string;
}

export interface ExtractedSpecs {
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  bodyType?: string;
  lightingType?: string;
  rimType?: string;
  transmission?: string;
  fuelType?: string;
  confidence: number;
  rawText?: string;
}

export interface VINInfo {
  vin?: string;
  isValid?: boolean;
  confidence: number;
  manufacturer?: string;
  year?: string;
  model?: string;
  error?: string;
}

export interface ConditionItem {
  key: string;
  label: string;
  rating: number; // 1-5
  icon: string;
}

export interface Plate {
  id: string;
  plateNumber: string;
  type: string;
  price: number;
  currency: string;
  status: string;
  description?: string | null;
  images: string;
  coverImage?: string | null;
  phone: string;
  whatsapp?: string | null;
  isNegotiable: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  soldAt?: string | null;
  sellerId: string;
  seller?: { id: string; name: string; image?: string | null; dealerName?: string | null };
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  image?: string | null;
  category: string;
  tags: string;
  published: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: { id: string; name: string; image?: string | null };
}

export interface WantedAd {
  id: string;
  title: string;
  description?: string | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  maxPrice?: number | null;
  currency: string;
  phone: string;
  whatsapp?: string | null;
  status: string;
  views: number;
  images: string;
  coverImage?: string | null;
  createdAt: string;
  updatedAt: string;
  brandId?: string | null;
  brand?: { id: string; nameAr: string; nameEn: string } | null;
  modelId?: string | null;
  model?: { id: string; nameAr: string; nameEn: string } | null;
  cityId?: string | null;
  city?: { id: string; nameAr: string; nameEn: string } | null;
  userId: string;
  user?: { id: string; name: string; image?: string | null; phone?: string | null };
  _count?: { offers: number };
}

export interface WantedOffer {
  id: string;
  name: string;
  phone: string;
  carDetails: string;
  price?: number | null;
  description?: string | null;
  createdAt: string;
  wantedAdId: string;
  userId?: string | null;
}

export interface CarComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  carId: string;
  userId: string;
  user: { id: string; name: string; image?: string | null; role?: string };
}

export interface Province {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  isActive: boolean;
}

export interface MaintenanceService {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  price?: number | null;
  currency: string;
  phone: string;
  whatsapp?: string | null;
  images: string;
  coverImage?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  provinceId: string;
  province?: { id: string; nameAr: string; nameEn: string };
  cityId?: string | null;
  city?: { id: string; nameAr: string; nameEn: string } | null;
  userId: string;
  user?: { id: string; name: string; image?: string | null; phone?: string | null };
}
