import { NextRequest } from 'next/server';
import { analyzeCarPrice, type CarData } from '@/ai/price-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const carData: CarData = {
      brand: body.brand || '',
      model: body.model || '',
      year: parseInt(body.year) || new Date().getFullYear(),
      trim: body.trim || '',
      kilometers: parseInt(body.kilometers) || 0,
      condition: body.condition || 'GOOD',
      fuelType: body.fuelType || 'PETROL',
      transmission: body.transmission || 'AUTOMATIC',
      bodyType: body.bodyType || '',
      engineCapacity: body.engineCapacity || '',
      cylinders: body.cylinders || '',
      drivetrain: body.drivetrain || '',
      color: body.color || '',
      ownerCount: parseInt(body.ownerCount) || 1,
      isDamaged: body.isDamaged === true || body.isDamaged === 'true',
      isPaintOriginal: body.isPaintOriginal !== false && body.isPaintOriginal !== 'false',
      hasWarranty: body.hasWarranty === true || body.hasWarranty === 'true',
      hasServiceHistory: body.hasServiceHistory === true || body.hasServiceHistory === 'true',
      isNegotiable: body.isNegotiable === true || body.isNegotiable === 'true',
      price: parseFloat(body.price) || 0,
      cityId: body.cityId || '',
    };

    if (!carData.brand) {
      return Response.json(
        { success: false, error: 'الرجاء إدخال الماركة' },
        { status: 400 }
      );
    }

    const analysis = await analyzeCarPrice(carData);

    return Response.json({ success: true, data: analysis });
  } catch {
    return Response.json(
      { success: false, error: 'عذراً، حدث خطأ أثناء تحليل السعر' },
      { status: 500 }
    );
  }
}
