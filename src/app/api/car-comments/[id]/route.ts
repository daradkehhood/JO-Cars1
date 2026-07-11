import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(_request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const comment = await prisma.carComment.findUnique({ where: { id } });
  if (!comment) return errorResponse('غير موجود', 404);
  if (comment.userId !== user.id && user.role !== 'ADMIN') return errorResponse('غير مصرح', 403);

  await prisma.carComment.delete({ where: { id } });
  return successResponse({ deleted: true });
}
