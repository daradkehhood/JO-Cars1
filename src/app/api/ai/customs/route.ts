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
  const { year, engineCapacity, price, fuelType, condition, isFreeZone } = body;

  try {

    if (!year || !price) {
      return errorResponse('سنة الصنع والسعر مطلوبان');
    }

    const fallback = calculateLocal(year, engineCapacity, price, fuelType, Boolean(isFreeZone));
    return successResponse(fallback);
  } catch (error) {
    console.error('Customs calculation error:', error);
    const fallback = calculateLocal(
      body.year, body.engineCapacity, body.price, body.fuelType, Boolean(body.isFreeZone)
    );
    return successResponse(fallback);
  }
}

function calculateLocal(
  year: number, engineCapacity: number | undefined, price: number, fuelType?: string, isFreeZone: boolean = false
): CustomsResult {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - year);
  const cc = engineCapacity || 2000;
  const isEV = fuelType === 'ELECTRIC' || fuelType === 'electric' || fuelType === 'EV';
  const isHybrid = fuelType === 'HYBRID' || fuelType === 'hybrid' || fuelType === 'PLUGIN_HYBRID';

  // Age depreciation allowance in Jordan (5% per year max 25%)
  const depreciationFactor = Math.max(0.75, 1 - age * 0.05);
  const depreciatedValue = Math.round(price * depreciationFactor);

  let specialTaxRate = 0;
  let customsRate = 0.05; // Standard 5% basic customs duty
  let annualLicensing = 120;
  let specialTax = 0;

  if (isEV) {
    // EV Jordan Tariffs
    specialTaxRate = 0.10; // 10% special tax for EV
    annualLicensing = 80;
  } else if (isHybrid) {
    // Hybrid Jordan Tariffs
    specialTaxRate = cc <= 2500 ? 0.55 : 0.70;
    annualLicensing = cc <= 2000 ? 130 : 250;
  } else {
    // Petrol / Diesel Jordan Tariffs
    if (cc <= 1600) {
      specialTaxRate = 0.65;
      annualLicensing = 120;
    } else if (cc <= 2000) {
      specialTaxRate = 0.79;
      annualLicensing = 180;
    } else if (cc <= 3000) {
      specialTaxRate = 0.91;
      annualLicensing = 350;
    } else {
      specialTaxRate = 1.05;
      annualLicensing = 550;
    }
  }

  const customsDuty = Math.round(depreciatedValue * customsRate);
  specialTax = Math.round((depreciatedValue + customsDuty) * specialTaxRate);
  const vat = Math.round((depreciatedValue + customsDuty + specialTax) * 0.16); // 16% sales tax
  const registrationFee = 150; // Plate issuance & compulsory insurance

  const totalFees = customsDuty + specialTax + vat + registrationFee + annualLicensing;
  const totalCarCost = isFreeZone ? price + totalFees : price + annualLicensing;

  const noteText = !isFreeZone
    ? 'السيارة مجمركة ومترخصة جاهزة في الأردن. الرسوم المعروضة تبيّن التكلفة التقديرية للترخيص السنوي وتخمين الجمارك الأصلي.'
    : 'السيارة في المنطقة الحرة بالزرقاء. التكلفة الإجمالية تشمل الجمارك والضريبة الخاصة ورسوم التسجيل والترخيص للمرة الأولى.';

  return {
    customsDuty,
    registrationFee,
    licensingFee: annualLicensing,
    totalFees,
    totalCarCost,
    annualLicensing,
    customsRate: specialTaxRate + customsRate,
    depreciatedValue,
    breakdown: {
      cifValue: depreciatedValue,
      customsBase: customsDuty,
      specialTax,
      vat,
      note: noteText,
    },
  };
}
