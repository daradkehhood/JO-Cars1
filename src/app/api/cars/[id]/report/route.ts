import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { chatCompletionJSON, type ChatMessage } from '@/ai/nvidia-client';

interface AIReportResult {
  fuelConsumption: { city: number; highway: number; unit: string };
  commonFaults: Array<{ name: string; severity: string; cost: number; frequency: string }>;
  maintenanceSchedule: Array<{ interval: string; items: string[]; estimatedCost: number }>;
  spareParts: Array<{ name: string; priceRange: string; availability: string }>;
  safetyRating: number;
  reliabilityRating: number;
  pros: string[];
  cons: string[];
  annualMaintenanceCost: number;
  monthlyFuelCost: number;
}

const FALLBACK_DATA: AIReportResult = {
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
  annualMaintenanceCost: 40,
  monthlyFuelCost: 150,
};

async function generateReportWithAI(car: {
  brand: string; model: string; year: number; kilometers: number;
  condition: string; price: number; fuelType?: string; transmission?: string;
  bodyType?: string; engineCapacity?: number;
}, similarPrices: number[]): Promise<AIReportResult | null> {
  try {
    const avgSimilar = similarPrices.length > 0
      ? Math.round(similarPrices.reduce((a, b) => a + b, 0) / similarPrices.length)
      : 0;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `أنت خبير سيارات أردني. قدم تقريراً فنياً دقيقاً về السيارة المطلوبة بالدينار الأردني (د.أ).
أجب بالـ JSON فقط بدون أي نص إضافي.`,
      },
      {
        role: 'user',
        content: `قيّم هذه السيارة وأعطني تقريراً فنياً:

المواصفات:
- الماركة: ${car.brand}
- الموديل: ${car.model}
- السنة: ${car.year}
- الكيلومترات: ${car.kilometers.toLocaleString()} كم
- الحالة: ${car.condition}
- السعر: ${car.price.toLocaleString()} د.أ
- نوع الوقود: ${car.fuelType || 'غير محدد'}
- ناقل الحركة: ${car.transmission || 'غير محدد'}
- نوع الهيكل: ${car.bodyType || 'غير محدد'}
- سعة المحرك: ${car.engineCapacity ? car.engineCapacity + ' سي سي' : 'غير محدد'}
${avgSimilar > 0 ? `- متوسط أسعار السيارات المشابهة: ${avgSimilar.toLocaleString()} د.أ (${similarPrices.length} إعلان)` : ''}

أعطني JSON بالشكل التالي:
{
  "fuelConsumption": { "city": <رقم لتر/100كم>, "highway": <رقم لتر/100كم>, "unit": "لتر/100كم" },
  "commonFaults": [
    { "name": "<اسم العطل>", "severity": "<منخفض/متوسط/عالي>", "cost": <التكلفة بالدينار>, "frequency": "<التكرار>" }
  ],
  "maintenanceSchedule": [
    { "interval": "<الفاصل>", "items": ["<صنف 1>", "<صنف 2>"], "estimatedCost": <التكلفة بالدينار> }
  ],
  "spareParts": [
    { "name": "<اسم القطعة>", "priceRange": "<النطاق بالدينار>", "availability": "<متوفر/غير متوفر/نادر>" }
  ],
  "safetyRating": <رقم من 1 إلى 5>,
  "reliabilityRating": <رقم من 1 إلى 5>,
  "pros": ["<ميزة 1>", "<ميزة 2>", "<ميزة 3>"],
  "cons": ["<عيب 1>", "<عيب 2>"],
  "annualMaintenanceCost": <التكلفة السنوية التقديرية بالدينار>,
  "monthlyFuelCost": <تكلفة الوقود الشهرية التقديرية بالدينار>
}

استخدم بيانات حقيقية واقعية عن هذه الماركة والموديل في الأردن. اذكر 3-5 عيوب شائعة و3-5 مميزات. التكاليف بالدينار الأردني.`,
      },
    ];

    const result = await chatCompletionJSON<AIReportResult>(messages, {
      temperature: 0.3,
      maxTokens: 2048,
      timeoutMs: 25000,
      retries: 2,
    });

    if (result && result.fuelConsumption && result.pros && result.pros.length > 0) {
      return result;
    }
    return null;
  } catch (error) {
    console.error('[CarReport AI] Error:', error);
    return null;
  }
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

    const similarPrices = similarCars.map(c => c.price).filter(p => p > 0);

    const aiReport = await generateReportWithAI({
      brand: brandName,
      model: modelName,
      year: car.year,
      kilometers: car.kilometers,
      condition: car.condition || 'GOOD',
      price: car.price,
      fuelType: car.fuelType || undefined,
      transmission: car.transmission || undefined,
      bodyType: car.bodyType || undefined,
      engineCapacity: (car as any).engineCapacity || undefined,
    }, similarPrices);

    const report = aiReport || FALLBACK_DATA;

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
        fuel: report.fuelConsumption,
        annualMaintenanceCost: report.annualMaintenanceCost,
        monthlyFuelCost: report.monthlyFuelCost,
        commonFaults: report.commonFaults,
        maintenanceSchedule: report.maintenanceSchedule,
        spareParts: report.spareParts,
        ratings: {
          safety: report.safetyRating,
          reliability: report.reliabilityRating,
        },
        pros: report.pros,
        cons: report.cons,
        aiPowered: !!aiReport,
      },
    });
  } catch (error) {
    console.error('Car report error:', error);
    return Response.json({ success: false, error: 'فشل إنشاء التقرير' }, { status: 500 });
  }
}
