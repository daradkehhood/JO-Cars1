import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const svc = await prisma.maintenanceService.findUnique({ where: { id } });
  if (!svc || (svc.userId !== user.id && user.role !== 'ADMIN')) return errorResponse('غير مصرح', 403);

  try {
    const body = await request.json();
    const data: any = {};
    if (body.title) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.category) data.category = body.category;
    if (body.price !== undefined) data.price = body.price ? parseFloat(body.price) : null;
    if (body.phone) data.phone = body.phone;
    if (body.whatsapp !== undefined) data.whatsapp = body.whatsapp;
    if (body.provinceId) data.provinceId = body.provinceId;

    const updated = await prisma.maintenanceService.update({ where: { id }, data });
    return successResponse(updated);
  } catch {
    return errorResponse('فشل التحديث', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(_request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const { id } = await params;

  await prisma.maintenanceService.delete({ where: { id } });
  return successResponse({ deleted: true });
}
