import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();

  try {
    const data: any = {};
    if (body.nameAr) data.nameAr = body.nameAr;
    if (body.nameEn !== undefined) data.nameEn = body.nameEn;
    if (body.provinceId !== undefined) data.provinceId = body.provinceId;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.slug) data.slug = body.slug;

    const city = await prisma.city.update({ where: { id }, data });
    return successResponse(city);
  } catch {
    return errorResponse('فشل تحديث المدينة', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const { id } = await params;

  try {
    await prisma.city.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse('فشل حذف المدينة', 500);
  }
}
