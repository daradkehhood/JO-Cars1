import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const tag = await prisma.carTag.findUnique({ where: { id } });
    if (!tag) return notFoundResponse('الوسم');

    const updated = await prisma.carTag.update({
      where: { id },
      data: {
        ...(body.nameAr && { nameAr: body.nameAr }),
        ...(body.nameEn !== undefined && { nameEn: body.nameEn }),
        ...(body.icon && { icon: body.icon }),
        ...(body.color && { color: body.color }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.slug && { slug: body.slug }),
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse('فشل تحديث الوسم', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const tag = await prisma.carTag.findUnique({ where: { id } });
    if (!tag) return notFoundResponse('الوسم');

    await prisma.carTag.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse('فشل حذف الوسم', 500);
  }
}
