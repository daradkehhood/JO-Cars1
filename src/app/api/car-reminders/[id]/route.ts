import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.carReminder.findFirst({ where: { id, userId: user.id } });
    if (!existing) return errorResponse('التذكير غير موجود', 404);

    const updateData: any = {};
    if (body.type) updateData.type = body.type;
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.dueDate) updateData.dueDate = new Date(body.dueDate);
    if (body.lastOdometer !== undefined) updateData.lastOdometer = body.lastOdometer ? parseInt(body.lastOdometer) : null;
    if (body.notifyBefore) updateData.notifyBefore = body.notifyBefore;
    if (body.isCompleted !== undefined) {
      updateData.isCompleted = body.isCompleted;
      if (body.isCompleted) updateData.completedAt = new Date();
    }
    if (body.carBrand !== undefined) updateData.carBrand = body.carBrand;
    if (body.carModel !== undefined) updateData.carModel = body.carModel;
    if (body.carYear !== undefined) updateData.carYear = body.carYear;
    if (body.plateNumber !== undefined) updateData.plateNumber = body.plateNumber;
    if (body.phone) updateData.phone = body.phone;
    if (body.whatsapp !== undefined) updateData.whatsapp = body.whatsapp;

    const reminder = await prisma.carReminder.update({ where: { id }, data: updateData });
    return successResponse(reminder);
  } catch {
    return errorResponse('فشل تحديث التذكير', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;

  try {
    const existing = await prisma.carReminder.findFirst({ where: { id, userId: user.id } });
    if (!existing) return errorResponse('التذكير غير موجود', 404);

    await prisma.carReminder.update({ where: { id }, data: { isActive: false } });
    return successResponse({ success: true });
  } catch {
    return errorResponse('فشل حذف التذكير', 500);
  }
}
