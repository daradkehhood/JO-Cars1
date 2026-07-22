import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const prices = await prisma.workshopPrice.findMany({
      where: { workshopId: workshop.id },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = prices.map((p) => ({
      id: p.id,
      serviceName: p.serviceName,
      price: p.minPrice,
      note: '',
    }));

    return successResponse(mapped);
  } catch (error) {
    console.error('Prices list error:', error);
    return errorResponse('فشل تحميل الأسعار', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const body = await request.json();
    const { serviceName, price, note } = body;

    if (!serviceName || !serviceName.trim()) {
      return errorResponse('اسم الخدمة مطلوب');
    }
    if (price === undefined || price === null) {
      return errorResponse('السعر مطلوب');
    }

    const numericPrice = Number(price);

    const workshopPrice = await prisma.workshopPrice.create({
      data: {
        workshopId: workshop.id,
        serviceName,
        minPrice: numericPrice,
        maxPrice: numericPrice,
      },
    });

    return successResponse({
      id: workshopPrice.id,
      serviceName: workshopPrice.serviceName,
      price: workshopPrice.minPrice,
      note: note || '',
    }, 201);
  } catch (error) {
    console.error('Price create error:', error);
    return errorResponse('فشل إضافة السعر', 500);
  }
}
