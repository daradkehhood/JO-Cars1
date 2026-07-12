import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { id } = await params;
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    if (!subscription) return notFoundResponse('الاشتراك');
    return successResponse(subscription);
  } catch (error) {
    console.error('Subscription error:', error);
    return errorResponse('فشل تحميل الاشتراك', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) return notFoundResponse('الاشتراك');

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.autoRenew !== undefined) updateData.autoRenew = body.autoRenew;

    const updated = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: body.status === 'CANCELLED' ? 'SYSTEM' : 'SYSTEM',
        description: `تم ${body.status === 'CANCELLED' ? 'تعطيل' : body.status === 'ACTIVE' ? 'تفعيل' : 'تحديث'} اشتراك المستخدم ${existing.userId}`,
        entityType: 'USER',
        entityId: existing.userId,
        oldValue: existing.status,
        newValue: updateData.status || existing.status,
        actorId: user.id,
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Update subscription error:', error);
    return errorResponse('فشل تحديث الاشتراك', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { id } = await params;
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) return notFoundResponse('الاشتراك');

    await prisma.subscription.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'SYSTEM',
        description: `حذف اشتراك المستخدم ${existing.userId}`,
        entityType: 'USER',
        entityId: existing.userId,
        oldValue: `باقة ${existing.plan} - ${existing.status}`,
        actorId: user.id,
      },
    });

    return successResponse({ message: 'تم حذف الاشتراك' });
  } catch (error) {
    console.error('Delete subscription error:', error);
    return errorResponse('فشل حذف الاشتراك', 500);
  }
}
