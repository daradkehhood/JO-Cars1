import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const reports = await prisma.carCommentReport.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      comment: {
        select: { id: true, content: true, createdAt: true, car: { select: { id: true, slug: true } } },
      },
      reporter: { select: { id: true, name: true } },
      reportedUser: { select: { id: true, name: true, carCommentBannedUntil: true } },
    },
  });

  return successResponse({ data: reports });
}

export async function PATCH(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const { id, status } = await request.json();
  if (!id || !status) return errorResponse('ID والحالة مطلوب', 400);

  await prisma.carCommentReport.update({
    where: { id },
    data: { status, resolvedAt: status === 'RESOLVED' ? new Date() : undefined },
  });

  return successResponse({ updated: true });
}

export async function DELETE(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const { id } = await request.json();
  if (!id) return errorResponse('ID مطلوب', 400);

  await prisma.carCommentReport.delete({ where: { id } });
  return successResponse({ deleted: true });
}
