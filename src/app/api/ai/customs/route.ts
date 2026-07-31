import { NextRequest } from 'next/server';
import { chatCompletionJSON, type ChatMessage } from '@/ai/nvidia-client';
import { successResponse, errorResponse } from '@/lib/api';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

interface CustomsResult {
  customsDuty: number;
  registrationFee: number;
  licensingFee: number;
  totalFees: number;
  totalCarCost: number;
  annualLicensing: number;
  customsRate: number;
  depreciatedValue: number;
  breakdown: {
    cifValue: number;
    customsBase: number;
    specialTax: number;
    vat: number;
    note: string;
  };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimit = checkRateLimit(`ai-customs:${ip}`, RATE_LIMITS.AI);
  if (!rateLimit.allowed) return errorResponse('تم تجاوز الحد المسموح', 429);

  const body = await request.json();
  const { year, engineCapacity, price, fuelType, condition } = body;

  try {

    if (!year || !price) {
      return errorResponse('سنة الصنع والسعر مطلوبان');
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    const cc = engineCapacity || 2000;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `أنت خبير جمارك أردني متخصص في استيراد السيارات. قدم حساباً دقيقاً لرسوم الجمارك والتسجيل والترخيص في الأردن.
أجب بالـ JSON فقط بدون أي نص إضافي.`,
      },
      {
        role: 'user',
        content: `احسب رسوم استيراد وتسجيل هذه السيارة في الأردن:

المواصفات:
- سنة الصنع: ${year} (عمر السيارة: ${age} سنة)
- سعة المحرك: ${cc} سي سي
- سعر السيارة: ${price.toLocaleString()} د.أ
- نوع الوقود: ${fuelType || 'بنزين'}
- الحالة: ${condition || 'جيدة'}

قواعد الجمارك الأردنية (2024-2025):
- القيمة الجمركية (CIF) = سعر السيارة × معامل الاستهلاك حسب العمر
- معدل الجمارك حسب السعة: ≤1500cc = 36%، ≤2000cc = 40%، ≤2500cc = 55%، ≤3000cc = 70%， >3000cc = 85%
- رسوم التسجيل لمرة واحدة: ≤2000cc = 85 د.أ، ≤3000cc = 110 د.أ، >3000cc = 140 د.أ
- الترخيص السنوي: ≤1500cc = 35 د.أ، ≤2000cc = 45 د.أ، ≤2500cc = 60 د.أ، ≤3000cc = 75 د.أ، >3000cc = 100 د.أ
- إذا كانت ديزل: أضف 20% على الجمارك
- ضريبة القيمة المضافة 16% على (القيمة الجمركية + الجمارك)

أعطني JSON بالشكل التالي:
{
  "customsDuty": <رسوم الجمارك بالدينار>,
  "registrationFee": <رسوم التسجيل لمرة واحدة بالدينار>,
  "licensingFee": <رسوم الترخيص السنوي بالدينار>,
  "totalFees": <المجموع الكلي للرسوم>,
  "totalCarCost": <سعر السيارة + الرسوم>,
  "annualLicensing": <رسوم الترخيص السنوي>,
  "customsRate": <نسبة الجمارك كعشري>,
  "depreciatedValue": <القيمة الجمركية بعد الاستهلاك>,
  "breakdown": {
    "cifValue": <القيمة الجمركية CIF>,
    "customsBase": <الرسوم الجمركية>,
    "specialTax": <الرسوم الخاصة إن وجدت>,
    "vat": <ضريبة القيمة المضافة>,
    "note": "<ملاحظة عن أي استثناءات أو تفاصيل إضافية>"
  }
}

اجعل الحسابات دقيقة واقعية حسب القوانين الأردنية الحالية.`,
      },
    ];

    const result = await chatCompletionJSON<CustomsResult>(messages, {
      temperature: 0.1,
      maxTokens: 1500,
      timeoutMs: 20000,
      retries: 2,
    });

    if (result && result.customsDuty > 0) {
      return successResponse(result);
    }

    // Fallback to local calculation
    const fallback = calculateLocal(year, engineCapacity, price, fuelType);
    return successResponse(fallback);
  } catch (error) {
    console.error('Customs calculation error:', error);
    const fallback = calculateLocal(
      body.year, body.engineCapacity, body.price, body.fuelType
    );
    return successResponse(fallback);
  }
}

function calculateLocal(
  year: number, engineCapacity: number | undefined, price: number, fuelType?: string
): CustomsResult {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  const cc = engineCapacity || 2000;

  let depreciationFactor: number;
  if (age <= 1) depreciationFactor = 0.95;
  else if (age <= 3) depreciationFactor = 0.90;
  else if (age <= 5) depreciationFactor = 0.80;
  else if (age <= 7) depreciationFactor = 0.70;
  else if (age <= 10) depreciationFactor = 0.55;
  else depreciationFactor = 0.40;

  const depreciatedValue = Math.round(price * depreciationFactor);

  let customsRate: number;
  if (cc <= 1500) customsRate = 0.36;
  else if (cc <= 2000) customsRate = 0.40;
  else if (cc <= 2500) customsRate = 0.55;
  else if (cc <= 3000) customsRate = 0.70;
  else customsRate = 0.85;

  if (fuelType === 'diesel' || fuelType === 'DIESEL') {
    customsRate = Math.min(customsRate * 1.2, 1.0);
  }

  let registrationFee: number;
  if (cc <= 2000) registrationFee = 85;
  else if (cc <= 3000) registrationFee = 110;
  else registrationFee = 140;

  let annualLicensing: number;
  if (cc <= 1500) annualLicensing = 35;
  else if (cc <= 2000) annualLicensing = 45;
  else if (cc <= 2500) annualLicensing = 60;
  else if (cc <= 3000) annualLicensing = 75;
  else annualLicensing = 100;

  const customsDuty = Math.round(depreciatedValue * customsRate);
  const vat = Math.round((depreciatedValue + customsDuty) * 0.16);
  const totalFees = customsDuty + registrationFee + annualLicensing + vat;
  const totalCarCost = price + totalFees;

  return {
    customsDuty,
    registrationFee,
    licensingFee: annualLicensing,
    totalFees,
    totalCarCost,
    annualLicensing,
    customsRate,
    depreciatedValue,
    breakdown: {
      cifValue: depreciatedValue,
      customsBase: customsDuty,
      specialTax: 0,
      vat,
      note: 'حساب تقريبي — قد تختلف الرسوم الفعلية حسب التقييم الجمركي.',
    },
  };
}
