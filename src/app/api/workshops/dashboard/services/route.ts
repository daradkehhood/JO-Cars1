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

    const services = await prisma.workshopService.findMany({
      where: { workshopId: workshop.id },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = services.map((s) => ({
      id: s.id,
      nameAr: s.name,
    }));

    return successResponse(mapped);
  } catch (error) {
    console.error('Services list error:', error);
    return errorResponse('فشل تحميل الخدمات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const body = await request.json();
    const { nameAr } = body;

    if (!nameAr || !nameAr.trim()) {
      return errorResponse('اسم الخدمة مطلوب');
    }

    const service = await prisma.workshopService.create({
      data: {
        workshopId: workshop.id,
        name: nameAr,
      },
    });

    return successResponse({ id: service.id, nameAr: service.name }, 201);
  } catch (error) {
    console.error('Service create error:', error);
    return errorResponse('فشل إضافة الخدمة', 500);
  }
}
