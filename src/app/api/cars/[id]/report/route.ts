import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

const carDatabase: Record<string, {
  fuelConsumption: { city: number; highway: number; unit: string };
  commonFaults: Array<{ name: string; severity: string; cost: number; frequency: string }>;
  maintenanceSchedule: Array<{ interval: string; items: string[]; estimatedCost: number }>;
  spareParts: Array<{ name: string; priceRange: string; availability: string }>;
  safetyRating: number;
  reliabilityRating: number;
  pros: string[];
  cons: string[];
}> = {
  'تويوتا': {
    fuelConsumption: { city: 8.5, highway: 6.2, unit: 'لتر/100كم' },
    commonFaults: [
      { name: 'استهلاك الفرامل', severity: 'متوسط', cost: 150, frequency: 'كل 40,000 كم' },
      { name: 'تبديل زيت القير', severity: 'منخفض', cost: 80, frequency: 'كل 50,000 كم' },
      { name: 'خلل المكيف', severity: 'منخفض', cost: 200, frequency: 'نادر' },
    ],
    maintenanceSchedule: [
      { interval: 'كل 5,000 كم', items: ['تغيير زيت المحرك', 'فحص الفرامل', 'فحص الإطارات'], estimatedCost: 40 },
      { interval: 'كل 15,000 كم', items: ['تغيير فلتر الهواء', 'تغيير شمعات الإشعال', 'فحص البطارية'], estimatedCost: 120 },
      { interval: 'كل 40,000 كم', items: ['تغيير زيت القير', 'تغيير فلتر الوقود', 'فحص نظام التعليق'], estimatedCost: 300 },
    ],
    spareParts: [
      { name: 'فلتر زيت', priceRange: '5-10 د.أ', availability: 'متوفر' },
      { name: 'فرامل أمامية', priceRange: '40-80 د.أ', availability: 'متوفر' },
      { name: 'شمعات إشعال', priceRange: '15-30 د.أ', availability: 'متوفر' },
      { name: 'بطارية', priceRange: '60-120 د.أ', availability: 'متوفر' },
    ],
    safetyRating: 4.5, reliabilityRating: 4.7,
    pros: ['موثوقية عالية', 'قيمة إعادة بيع ممتازة', 'قطع غيار رخيصة', 'استهلاك وقود منخفض'],
    cons: ['تصميم محافظ', 'أداء قيادة عادي', 'عزل صوت متوسط'],
  },
  'هيونداي': {
    fuelConsumption: { city: 9.0, highway: 6.5, unit: 'لتر/100كم' },
    commonFaults: [
      { name: 'استهلاك الإطارات', severity: 'منخفض', cost: 120, frequency: 'كل 30,000 كم' },
      { name: 'خلل أنظمة الكهرباء', severity: 'متوسط', cost: 250, frequency: 'أحياناً' },
    ],
    maintenanceSchedule: [
      { interval: 'كل 5,000 كم', items: ['تغيير زيت المحرك', 'فحص الفرامل'], estimatedCost: 35 },
      { interval: 'كل 15,000 كم', items: ['تغيير فلتر الهواء', 'فحص البطارية'], estimatedCost: 100 },
    ],
    spareParts: [
      { name: 'فلتر زيت', priceRange: '4-8 د.أ', availability: 'متوفر' },
      { name: 'فرامل أمامية', priceRange: '35-70 د.أ', availability: 'متوفر' },
    ],
    safetyRating: 4.3, reliabilityRating: 4.4,
    pros: ['قيمة ممتازة للسعر', 'تصميم عصري', 'ضمان طويل', 'تجهيزات كثيرة'],
    cons: ['قيمة إعادة بيع أقل من تويوتا', 'جودة مواد داخلية متوسطة'],
  },
  'كيا': {
    fuelConsumption: { city: 9.2, highway: 6.8, unit: 'لتر/100كم' },
    commonFaults: [
      { name: 'استهلاك الفرامل', severity: 'منخفض', cost: 130, frequency: 'كل 35,000 كم' },
      { name: 'خلل نظام التكييف', severity: 'متوسط', cost: 180, frequency: 'أحياناً' },
    ],
    maintenanceSchedule: [
      { interval: 'كل 5,000 كم', items: ['تغيير زيت المحرك', 'فحص الفرامل'], estimatedCost: 35 },
      { interval: 'كل 15,000 كم', items: ['تغيير فلتر الهواء', 'تغيير شمعات'], estimatedCost: 110 },
    ],
    spareParts: [
      { name: 'فلتر زيت', priceRange: '4-8 د.أ', availability: 'متوفر' },
      { name: 'فرامل أمامية', priceRange: '35-65 د.أ', availability: 'متوفر' },
    ],
    safetyRating: 4.2, reliabilityRating: 4.3,
    pros: ['تصميم جذاب', 'ضمان 5 سنوات', 'تجهيزات كثيرة', 'سعر تنافسي'],
    cons: ['جودة بعض القطع', 'عزل صوت متوسط'],
  },
  'نيسان': {
    fuelConsumption: { city: 8.8, highway: 6.4, unit: 'لتر/100كم' },
    commonFaults: [
      { name: 'خلل القير CVT', severity: 'عالي', cost: 800, frequency: 'نادر لكن مكلف' },
      { name: 'استهلاك الفرامل', severity: 'متوسط', cost: 160, frequency: 'كل 35,000 كم' },
    ],
    maintenanceSchedule: [
      { interval: 'كل 5,000 كم', items: ['تغيير زيت المحرك', 'فحص الفرامل'], estimatedCost: 40 },
      { interval: 'كل 30,000 كم', items: ['تغيير زيت القير CVT', 'فحص الحساسات'], estimatedCost: 250 },
    ],
    spareParts: [
      { name: 'فلتر زيت', priceRange: '5-10 د.أ', availability: 'متوفر' },
      { name: 'فرامل أمامية', priceRange: '45-85 د.أ', availability: 'متوفر' },
    ],
    safetyRating: 4.4, reliabilityRating: 4.1,
    pros: ['تصميم أنيق', 'تقنيات متقدمة', 'استهلاك وقود جيد'],
    cons: ['القير CVT مكلف الإصلاح', 'جودة بعض القطع'],
  },
  'هوندا': {
    fuelConsumption: { city: 8.0, highway: 5.8, unit: 'لتر/100كم' },
    commonFaults: [
      { name: 'استهلاك الفرامل', severity: 'منخفض', cost: 140, frequency: 'كل 40,000 كم' },
      { name: 'خلل نظام التكييف', severity: 'متوسط', cost: 200, frequency: 'نادر' },
    ],
    maintenanceSchedule: [
      { interval: 'كل 5,000 كم', items: ['تغيير زيت المحرك', 'فحص الفرامل'], estimatedCost: 38 },
      { interval: 'كل 15,000 كم', items: ['تغيير فلتر الهواء', 'تغيير شمعات'], estimatedCost: 115 },
    ],
    spareParts: [
      { name: 'فلتر زيت', priceRange: '5-10 د.أ', availability: 'متوفر' },
      { name: 'فرامل أمامية', priceRange: '40-75 د.أ', availability: 'متوفر' },
    ],
    safetyRating: 4.6, reliabilityRating: 4.6,
    pros: ['موثوقية عالية جداً', 'استهلاك وقود منخفض', 'قيمة إعادة بيع ممتازة'],
    cons: ['بعض الموديلات بسيطة التجهيزات', 'صوت المحرك عالي أحياناً'],
  },
  'فورد': {
    fuelConsumption: { city: 10.5, highway: 7.5, unit: 'لتر/100كم' },
    commonFaults: [
      { name: 'خلل القير الأوتوماتيك', severity: 'عالي', cost: 600, frequency: 'أحياناً' },
      { name: 'استهلاك الفرامل', severity: 'متوسط', cost: 180, frequency: 'كل 30,000 كم' },
    ],
    maintenanceSchedule: [
      { interval: 'كل 5,000 كم', items: ['تغيير زيت المحرك', 'فحص الفرامل'], estimatedCost: 45 },
      { interval: 'كل 20,000 كم', items: ['تغيير فلتر الهواء', 'فحص القير'], estimatedCost: 200 },
    ],
    spareParts: [
      { name: 'فلتر زيت', priceRange: '6-12 د.أ', availability: 'متوفر' },
      { name: 'فرامل أمامية', priceRange: '50-90 د.أ', availability: 'متوفر' },
    ],
    safetyRating: 4.0, reliabilityRating: 3.8,
    pros: ['أداء قيادة قوي', 'خيارات متنوعة', 'قوة السحب'],
    cons: ['استهلاك وقود مرتفع', 'جودة بعض القطع', 'إصلاحات مكلفة'],
  },
  'مرسيدس': {
    fuelConsumption: { city: 11.0, highway: 7.8, unit: 'لتر/100كم' },
    commonFaults: [
      { name: 'خلل الهيدروليك', severity: 'عالي', cost: 1200, frequency: 'نادر' },
      { name: 'استهلاك الفرامل السيراميك', severity: 'عالي', cost: 800, frequency: 'كل 60,000 كم' },
    ],
    maintenanceSchedule: [
      { interval: 'كل 10,000 كم', items: ['تغيير زيت المحرك', 'فحص شامل'], estimatedCost: 150 },
      { interval: 'كل 40,000 كم', items: ['تغيير زيت القير', 'فحص نظام التعليق', 'فحص الفرامل'], estimatedCost: 600 },
    ],
    spareParts: [
      { name: 'فلتر زيت', priceRange: '15-30 د.أ', availability: 'متوفر' },
      { name: 'فرامل أمامية', priceRange: '120-250 د.أ', availability: 'متوفر' },
    ],
    safetyRating: 4.8, reliabilityRating: 4.0,
    pros: ['فخامة ورفاهية', 'تقنيات متقدمة', 'أمان عالي', 'راحة استثنائية'],
    cons: ['سعر مرتفع', 'إصلاحات مكلفة جداً', 'استهلاك وقود عالي'],
  },
  'بي إم دبليو': {
    fuelConsumption: { city: 10.5, highway: 7.2, unit: 'لتر/100كم' },
    commonFaults: [
      { name: 'خلل نظام التبريد', severity: 'عالي', cost: 500, frequency: 'أحياناً' },
      { name: 'استهلاك الفرامل', severity: 'متوسط', cost: 200, frequency: 'كل 35,000 كم' },
    ],
    maintenanceSchedule: [
      { interval: 'كل 10,000 كم', items: ['تغيير زيت المحرك', 'فحص شامل'], estimatedCost: 140 },
      { interval: 'كل 40,000 كم', items: ['تغيير زيت القير', 'فحص نظام التبريد'], estimatedCost: 550 },
    ],
    spareParts: [
      { name: 'فلتر زيت', priceRange: '12-25 د.أ', availability: 'متوفر' },
      { name: 'فرامل أمامية', priceRange: '100-200 د.أ', availability: 'متوفر' },
    ],
    safetyRating: 4.7, reliabilityRating: 4.1,
    pros: ['أداء قيادة ممتاز', 'تصميم أنيق', 'تقنيات متقدمة'],
    cons: ['إصلاحات مكلفة', 'استهلاك وقود', 'بعض المشاكل الكهربائية'],
  },
};

function getCarData(brandName: string) {
  return carDatabase[brandName] || {
    fuelConsumption: { city: 9.5, highway: 7.0, unit: 'لتر/100كم' },
    commonFaults: [
      { name: 'استهلاك الفرامل', severity: 'متوسط', cost: 150, frequency: 'كل 35,000 كم' },
    ],
    maintenanceSchedule: [
      { interval: 'كل 5,000 كم', items: ['تغيير زيت المحرك', 'فحص الفرامل'], estimatedCost: 40 },
    ],
    spareParts: [
      { name: 'فلتر زيت', priceRange: '5-10 د.أ', availability: 'متوفر' },
    ],
    safetyRating: 4.0, reliabilityRating: 4.0,
    pros: ['مواصفات جيدة', 'سعر تنافسي'],
    cons: ['معلومات غير كافية'],
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const car = await prisma.car.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        brand: { select: { id: true, nameAr: true, nameEn: true } },
        model: { select: { id: true, nameAr: true, nameEn: true } },
        city: { select: { id: true, nameAr: true } },
        user: { select: { id: true, name: true, rating: true } },
        _count: { select: { images: true } },
      },
    });

    if (!car) {
      return Response.json({ success: false, error: 'السيارة غير موجودة' }, { status: 404 });
    }

    const brandName = car.brand?.nameAr || '';
    const modelName = car.model?.nameAr || '';
    const carData = getCarData(brandName);

    const age = new Date().getFullYear() - car.year;
    const depreciation = Math.min(age * 8, 70);
    const estimatedValue = Math.round(car.price * (1 - depreciation / 100));

    const similarCars = await prisma.car.findMany({
      where: {
        status: 'APPROVED',
        brandId: car.brandId,
        year: { gte: car.year - 2, lte: car.year + 2 },
        id: { not: car.id },
      },
      take: 10,
      select: { price: true, year: true, kilometers: true, condition: true },
    });

    const avgSimilarPrice = similarCars.length > 0
      ? Math.round(similarCars.reduce((sum, c) => sum + c.price, 0) / similarCars.length)
      : car.price;

    const annualMaintenanceCost = carData.maintenanceSchedule.reduce((sum, m) => sum + m.estimatedCost, 0);
    const monthlyFuelCost = Math.round((carData.fuelConsumption.city * 12 * 150) / 100);

    return Response.json({
      success: true,
      data: {
        car: {
          id: car.id, slug: car.slug, title: `${brandName} ${modelName} ${car.year}`,
          price: car.price, year: car.year, kilometers: car.kilometers,
          condition: car.condition, city: car.city?.nameAr || '',
          seller: { name: car.user?.name, rating: car.user?.rating },
        },
        market: {
          averagePrice: avgSimilarPrice,
          similarListings: similarCars.length,
          pricePosition: car.price < avgSimilarPrice * 0.9 ? 'أقل من السوق' : car.price > avgSimilarPrice * 1.1 ? 'أعلى من السوق' : 'في نطاق السوق',
        },
        depreciation: {
          currentAge: age,
          depreciationPercent: depreciation,
          estimatedValue,
        },
        fuel: carData.fuelConsumption,
        annualMaintenanceCost,
        monthlyFuelCost,
        commonFaults: carData.commonFaults,
        maintenanceSchedule: carData.maintenanceSchedule,
        spareParts: carData.spareParts,
        ratings: {
          safety: carData.safetyRating,
          reliability: carData.reliabilityRating,
        },
        pros: carData.pros,
        cons: carData.cons,
      },
    });
  } catch (error) {
    console.error('Car report error:', error);
    return Response.json({ success: false, error: 'فشل إنشاء التقرير' }, { status: 500 });
  }
}
