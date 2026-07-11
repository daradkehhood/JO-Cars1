import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const updated = await prisma.forumCategory.update({ where: { id }, data: body });
    return successResponse(updated);
  } catch {
    return errorResponse('فشل التحديث', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const topicsCount = await prisma.forumTopic.count({ where: { categoryId: id } });
    if (topicsCount > 0) {
      return errorResponse('لا يمكن حذف قسم يحتوي على مواضيع', 400);
    }
    await prisma.forumCategory.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse('فشل الحذف', 500);
  }
}
