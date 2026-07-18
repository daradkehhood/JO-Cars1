import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const carMake = searchParams.get('carMake');
    const carModel = searchParams.get('carModel');
    const repairType = searchParams.get('repairType');

    const where: any = {};
    if (carMake) where.carMake = carMake;
    if (carModel) where.carModel = carModel;
    if (repairType) where.repairType = repairType;

    if (!carMake && !carModel && !repairType) {
      return errorResponse('يجب تحديد نوع السيارة أو الإصلاح على الأقل');
    }

    const result = await prisma.costRecord.aggregate({
      where,
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: { id: true },
    });

    return successResponse({
      average: result._avg.price ? Math.round(result._avg.price * 100) / 100 : 0,
      min: result._min.price || 0,
      max: result._max.price || 0,
      count: result._count.id,
    });
  } catch (error) {
    console.error('Cost stats error:', error);
    return errorResponse('فشل تحميل تكاليف الصيانة', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { workshopId, carMake, carModel, carYear, repairType, price, duration, partsType } = body;

    if (!carMake || !carModel || !repairType || price === undefined) {
      return errorResponse('نوع السيارة ونوع الإصلاح والسعر مطلوبة');
    }

    if (price < 0) {
      return errorResponse('السعر يجب أن يكون أكبر من أو يساوي صفر');
    }

    const record = await prisma.costRecord.create({
      data: {
        userId: user.id,
        workshopId: workshopId || null,
        carMake,
        carModel,
        carYear: carYear || null,
        repairType,
        price,
        duration: duration || null,
        partsType: partsType || null,
      },
    });

    return successResponse(record, 201);
  } catch (error) {
    console.error('Cost record creation error:', error);
    return errorResponse('فشل تسجيل التكلفة', 500);
  }
}
