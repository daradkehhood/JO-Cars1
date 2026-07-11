import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) return notFoundResponse('الباقة');
    return successResponse({ ...plan, features: JSON.parse(plan.features) });
  } catch (error) {
    return errorResponse('فشل تحميل الباقة', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.nameAr !== undefined) data.nameAr = body.nameAr;
    if (body.nameEn !== undefined) data.nameEn = body.nameEn;
    if (body.description !== undefined) data.description = body.description;
    if (body.price !== undefined) data.price = parseFloat(body.price);
    if (body.durationDays !== undefined) data.durationDays = parseInt(body.durationDays);
    if (body.features !== undefined) data.features = JSON.stringify(body.features);
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const plan = await prisma.plan.update({ where: { id }, data });
    return successResponse({ ...plan, features: JSON.parse(plan.features) });
  } catch (error) {
    return errorResponse('فشل تحديث الباقة', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    await prisma.plan.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse('فشل حذف الباقة', 500);
  }
}
