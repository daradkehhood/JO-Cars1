import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import { createAuditLog } from '@/lib/audit';
import { sendWhatsAppToUser, buildUserMessage } from '@/lib/whatsapp';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { planId } = await request.json();
    if (!planId) return errorResponse('معرف الباقة مطلوب', 400);

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return notFoundResponse('الباقة');

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + plan.durationDays);

    const car = await prisma.car.update({
      where: { id },
      data: { featured: true, featuredUntil },
      include: { brand: true, model: true },
    });

    await createAuditLog({
      action: 'FEATURE_CAR', actorId: user.id,
      entityType: 'CAR', entityId: id,
      description: `تمييز سيارة ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} لمدة ${plan.durationDays} يوم`,
      newValue: `مميزة حتى ${featuredUntil.toISOString()}`,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    await prisma.notification.create({
      data: {
        type: 'CAR_FEATURED',
        title: 'إعلان مميز',
        message: `تم تمييز إعلان ${car.brand?.nameAr} ${car.model?.nameAr} لمدة ${plan.durationDays} يوم`,
        userId: car.userId,
        link: `/cars/${car.slug || car.id}`,
      },
    });

    const carTitle = `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`;
    sendWhatsAppToUser(car.userId, buildUserMessage('car_featured', { carTitle, carSlug: car.slug || car.id }));

    return successResponse(car);
  } catch (error) {
    return errorResponse('فشل تمييز السيارة', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const car = await prisma.car.update({
      where: { id },
      data: { featured: false, featuredUntil: null },
      include: { brand: true, model: true },
    });

    await createAuditLog({
      action: 'UNFEATURE_CAR', actorId: user.id,
      entityType: 'CAR', entityId: id,
      description: `إلغاء تمييز سيارة ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return successResponse(car);
  } catch (error) {
    return errorResponse('فشل إلغاء التمييز', 500);
  }
}
