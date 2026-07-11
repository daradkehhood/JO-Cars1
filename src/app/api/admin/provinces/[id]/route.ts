import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const { id } = await params;
  try {
    const body = await request.json();
    const data: any = {};
    if (body.nameAr) data.nameAr = body.nameAr;
    if (body.nameEn) data.nameEn = body.nameEn;
    if (body.slug) data.slug = body.slug;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const province = await prisma.province.update({ where: { id }, data });
    return successResponse(province);
  } catch {
    return errorResponse('فشل التحديث', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const { id } = await params;
  try {
    await prisma.province.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse('فشل الحذف', 500);
  }
}
