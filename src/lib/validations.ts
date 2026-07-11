import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون أكثر من حرفين').max(100),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  phone: z.string().optional(),
  role: z.enum(['USER', 'DEALER']).default('USER'),
  dealerName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  bio: z.string().max(500).optional(),
  dealerName: z.string().max(100).optional(),
  dealerDescription: z.string().max(1000).optional(),
  dealerAddress: z.string().optional(),
  dealerLat: z.number().optional(),
  dealerLng: z.number().optional(),
  whatsappNotifications: z.boolean().optional(),
});

export const carSchema = z.object({
  brandId: z.string().min(1, 'الشركة مطلوبة'),
  modelId: z.string().min(1, 'الموديل مطلوب'),
  year: z.number().int().min(1990, 'سنة الصنع يجب أن تكون 1990 أو أحدث').max(2030),
  trim: z.string().optional(),
  kilometers: z.number().int().min(0, 'عدد الكيلومترات يجب أن يكون 0 أو أكثر'),
  fuelType: z.enum(['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUGIN_HYBRID']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'CVT', 'DCT', 'SEMI_AUTOMATIC']),
  color: z.string().min(1, 'اللون مطلوب'),
  doors: z.number().int().min(1).max(7).default(4),
  engineCapacity: z.number().positive().optional(),
  cylinders: z.number().int().min(2).max(16).optional(),
  drivetrain: z.enum(['FWD', 'RWD', 'AWD', 'FOUR_WD']),
  condition: z.enum(['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'NEEDS_MAINTENANCE', 'NEEDS_INSPECTION']),
  bodyType: z.enum(['SUV', 'SEDAN', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'WAGON', 'PICKUP', 'VAN', 'MINIVAN', 'CROSSOVER', 'SPORTS', 'LUXURY']).optional(),
  lightingType: z.enum(['HALOGEN', 'LED', 'XENON', 'LASER', 'MATRIX_LED']).optional(),
  rimType: z.enum(['STEEL', 'ALLOY', 'CHROME', 'FORGED']).optional(),
  vin: z.string().length(17, 'رقم الهيكل يجب أن يكون 17 حرفاً').optional().or(z.literal('')),
  description: z.string().min(20, 'الوصف يجب أن يكون 20 حرفاً على الأقل').max(5000),
  price: z.number().positive('السعر يجب أن يكون أكبر من 0'),
  cityId: z.string().min(1, 'المحافظة مطلوبة'),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  whatsapp: z.string().optional(),
  isNegotiable: z.boolean().default(false),
  hasWarranty: z.boolean().default(false),
  hasServiceHistory: z.boolean().default(false),
  isDamaged: z.boolean().default(false),
  isPaintOriginal: z.boolean().default(true),
  ownerCount: z.number().int().min(1).max(20).default(1),
  platesNumber: z.string().optional(),
  videoUrl: z.string().url('رابط الفيديو غير صحيح').optional().or(z.literal('')),
});

export const messageSchema = z.object({
  content: z.string().min(1, 'الرسالة مطلوبة').max(2000),
  receiverId: z.string().min(1),
  carId: z.string().optional(),
});

export const reportSchema = z.object({
  reason: z.enum(['SPAM', 'FAKE_PRICE', 'WRONG_INFO', 'SOLD', 'DUPLICATE', 'OFFENSIVE', 'SCAM', 'OTHER']),
  description: z.string().max(500).optional(),
});

export const searchSchema = z.object({
  query: z.string().optional(),
  brandId: z.string().optional(),
  modelId: z.string().optional(),
  yearMin: z.coerce.number().optional(),
  yearMax: z.coerce.number().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  cityId: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  kilometersMin: z.coerce.number().optional(),
  kilometersMax: z.coerce.number().optional(),
  condition: z.string().optional(),
  bodyType: z.string().optional(),
  drivetrain: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
