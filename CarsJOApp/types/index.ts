export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  image?: string;
  role: 'USER' | 'DEALER' | 'ADMIN';
  bio?: string;
  dealerName?: string;
  dealerLogo?: string;
  dealerDescription?: string;
  dealerAddress?: string;
  dealerLat?: number;
  dealerLng?: number;
  rating?: number;
  ratingCount?: number;
  isActive: boolean;
  canPost: boolean;
  isAdmin?: boolean;
  isBanned?: boolean;
  badges?: string[];
  banStatus?: string;
  banReason?: string;
  banUntil?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Brand {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  logo?: string;
  country?: string;
  isActive: boolean;
  _count?: { carModels: number };
}

export interface CarModel {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  brandId: string;
  isActive: boolean;
  brand?: Brand;
}

export interface Province {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  isActive: boolean;
  cities?: City[];
}

export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  provinceId: string;
  isActive: boolean;
  province?: Province;
  _count?: { cars: number };
}

export interface CarImage {
  id: string;
  url: string;
  thumbnail?: string;
  blurhash?: string;
  isCover: boolean;
  aiProcessed?: boolean;
  processedUrl?: string;
  order: number;
}

export type CarStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SOLD';
export type FuelType = 'BENZINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'GAS';
export type Transmission = 'MANUAL' | 'AUTOMATIC' | 'CVT';
export type Drivetrain = 'FWD' | 'RWD' | 'AWD' | '4WD';
export type BodyType = 'SEDAN' | 'SUV' | 'HATCHBACK' | 'COUPE' | 'TRUCK' | 'VAN' | 'WAGON' | 'CONVERTIBLE' | 'MINIVAN';
export type Condition = 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'FAIR' | 'POOR';

export interface ConditionDetails {
  chassis?: number;
  engine?: number;
  transmission?: number;
  ac?: number;
  interior?: number;
  electrical?: number;
  suspension?: number;
  brakes?: number;
  tires?: number;
  paint?: number;
}

export interface Car {
  id: string;
  slug: string;
  status: CarStatus;
  featured: boolean;
  isNew: boolean;
  views: number;
  saves: number;
  brandId: string;
  modelId: string;
  year: number;
  trim?: string;
  kilometers: number;
  fuelType: FuelType;
  transmission: Transmission;
  color: string;
  doors?: number;
  engineCapacity?: number;
  cylinders?: number;
  drivetrain?: Drivetrain;
  condition?: Condition;
  bodyType?: BodyType;
  vin?: string;
  description?: string;
  aiDescription?: string;
  price: number;
  fairPriceEstimate?: number;
  cityId: string;
  locationLat?: number;
  locationLng?: number;
  phone?: string;
  whatsapp?: string;
  coverImage?: string;
  videoUrl?: string;
  isNegotiable: boolean;
  hasWarranty: boolean;
  hasServiceHistory: boolean;
  isDamaged: boolean;
  isPaintOriginal: boolean;
  ownerCount: number;
  refCode: string;
  aiScore?: number;
  aiAnalysis?: any;
  model3dUrl?: string;
  video360Url?: string;
  conditionDetails?: ConditionDetails;
  expiresAt?: string;
  soldAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  brand?: Brand;
  model?: CarModel;
  city?: City;
  user?: User;
  images?: CarImage[];
  _count?: {
    favorites: number;
    comments: number;
    CarViewer: number;
  };
}

export interface Conversation {
  id: string;
  carId: string;
  buyerId: string;
  sellerId: string;
  car?: Car;
  buyer?: User;
  seller?: User;
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  read: boolean;
  senderId: string;
  receiverId: string;
  carId?: string;
  conversationId: string;
  sender?: User;
  receiver?: User;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  userId: string;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  brandId?: string;
  modelId?: string;
  minPrice?: number;
  maxPrice?: number;
  yearFrom?: number;
  yearTo?: number;
  cityId?: string;
  isActive: boolean;
  brand?: Brand;
  model?: CarModel;
  city?: City;
  createdAt: string;
}

export interface ForumCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { topics: number };
}

export interface ForumTopic {
  id: string;
  title: string;
  content: string;
  slug: string;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  categoryId: string;
  userId: string;
  category?: ForumCategory;
  user?: User;
  _count?: { posts: number };
  createdAt: string;
}

export interface ForumPost {
  id: string;
  content: string;
  topicId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image?: string;
  category: 'NEWS' | 'FUEL_PRICES' | 'CUSTOMS' | 'REVIEWS' | 'TIPS';
  tags?: string;
  published: boolean;
  authorId: string;
  author?: User;
  createdAt: string;
}

export interface UsedPart {
  id: string;
  slug: string;
  title: string;
  description?: string;
  partType: string;
  brandId?: string;
  partNumber?: string;
  condition?: string;
  price?: number;
  quantity: number;
  images?: string[];
  phone?: string;
  cityId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  userId: string;
  brand?: Brand;
  city?: City;
  user?: User;
  createdAt: string;
}

export interface Plate {
  id: string;
  plateNumber: string;
  type: string;
  price: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SOLD';
  images?: string[];
  phone?: string;
  sellerId: string;
  seller?: User;
  createdAt: string;
}

export interface WantedAd {
  id: string;
  title: string;
  description?: string;
  yearFrom?: number;
  yearTo?: number;
  maxPrice?: number;
  phone?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  brandId?: string;
  modelId?: string;
  cityId?: string;
  userId: string;
  brand?: Brand;
  model?: CarModel;
  city?: City;
  user?: User;
  _count?: { offers: number };
  createdAt: string;
}

export interface MaintenanceService {
  id: string;
  title: string;
  description?: string;
  category: string;
  price?: number;
  phone?: string;
  images?: string[];
  provinceId?: string;
  cityId?: string;
  userId: string;
  province?: Province;
  city?: City;
  user?: User;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category?: string;
  userId: string;
  assigneeId?: string;
  user?: User;
  messages?: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  content: string;
  isStaff: boolean;
  ticketId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface UserRating {
  id: string;
  score: number;
  comment?: string;
  raterId: string;
  targetUserId: string;
  carId?: string;
  rater?: User;
  targetUser?: User;
  car?: Car;
  createdAt: string;
}

export interface CarReminder {
  id: string;
  userId: string;
  carId?: string;
  type: string;
  title: string;
  dueDate?: string;
  lastOdometer?: number;
  notifyBefore?: number;
  isCompleted: boolean;
  phone?: string;
  whatsapp?: string;
  car?: Car;
  createdAt: string;
}

export interface UserGarage {
  id: string;
  userId: string;
  carBrand: string;
  carModel: string;
  carYear: number;
  plateNumber?: string;
  color?: string;
  fuelType?: string;
  currentKm?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  images?: { url: string; isCover: boolean }[];
  expenses?: CarExpense[];
  createdAt: string;
}

export interface CarExpense {
  id: string;
  garageId: string;
  userId: string;
  type: string;
  title: string;
  description?: string;
  cost: number;
  odometer?: number;
  date: string;
  shopName?: string;
}

export interface SiteSettings {
  siteName?: string;
  siteNameAr?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  currency: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
}

export interface Auction {
  id: string;
  startingPrice: number;
  currentPrice: number;
  minBidIncrement: number;
  startDate: string;
  endDate: string;
  status: string;
  carId: string;
  sellerId: string;
  winnerId?: string;
  car?: Car;
  seller?: User;
  _count?: { bids: number };
}

export interface Bid {
  id: string;
  amount: number;
  auctionId: string;
  userId: string;
  auction?: Auction;
  user?: User;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CarFilters {
  search?: string;
  brandId?: string;
  modelId?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minKm?: number;
  maxKm?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  condition?: string;
  drivetrain?: string;
  cityId?: string;
  color?: string;
  isNegotiable?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  isDamaged?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export type RootStackParamList = {
  '(tabs)': undefined;
  'auth/login': undefined;
  'auth/register': undefined;
  'cars/[id]': { id: string };
  'cars/add': undefined;
  'cars/compare': undefined;
  'cars/search': undefined;
  'parts/[id]': { id: string };
  'parts/add': undefined;
  'plates/[id]': { id: string };
  'plates/add': undefined;
  'wanted/[id]': { id: string };
  'wanted/add': undefined;
  'forum/[slug]': { slug: string };
  'forum/topic/[slug]': { slug: string };
  'news/[slug]': { slug: string };
  'profile/[id]': { id: string };
  'tickets/[id]': { id: string };
  'maintenance/add': undefined;
  'admin': undefined;
};
