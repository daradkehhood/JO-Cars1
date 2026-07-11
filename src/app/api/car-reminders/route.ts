import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const upcoming = searchParams.get('upcoming');

  try {
    const where: any = { userId: user.id, isActive: true };
    if (type) where.type = type;
    if (upcoming === 'true') {
      where.dueDate = { gte: new Date() };
      where.isCompleted = false;
    }

    const reminders = await prisma.carReminder.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: { car: { select: { id: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } }, year: true, coverImage: true } } },
    });
    return successResponse(reminders);
  } catch {
    return errorResponse('فشل تحميل التذكيرات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    if (!body.type || !body.title || !body.dueDate) {
      return errorResponse('النوع، العنوان، والتاريخ مطلوبة', 400);
    }

    const reminder = await prisma.carReminder.create({
      data: {
        userId: user.id,
        carId: body.carId || null,
        carBrand: body.carBrand || null,
        carModel: body.carModel || null,
        carYear: body.carYear || null,
        plateNumber: body.plateNumber || null,
        type: body.type,
        title: body.title,
        description: body.description || null,
        dueDate: new Date(body.dueDate),
        lastOdometer: body.lastOdometer ? parseInt(body.lastOdometer) : null,
        notifyBefore: body.notifyBefore || 7,
        phone: body.phone || user.phone || '',
        whatsapp: body.whatsapp || user.whatsapp || null,
      },
    });
    return successResponse(reminder, 201);
  } catch {
    return errorResponse('فشل إنشاء التذكير', 500);
  }
}
