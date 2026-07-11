import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const comments = await prisma.carComment.findMany({
      where: { carId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
    });
    return successResponse(comments);
  } catch {
    return errorResponse('فشل تحميل التعليقات', 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  try {
    const { content } = await request.json();
    if (!content?.trim()) return errorResponse('المحتوى مطلوب', 400);

    if (user.carCommentBannedUntil && new Date(user.carCommentBannedUntil) > new Date()) {
      return errorResponse('تم حظرك من التعليق', 403);
    }

    const comment = await prisma.carComment.create({
      data: { content: content.trim(), carId: id, userId: user.id },
      include: { user: { select: { id: true, name: true, image: true, role: true } } },
    });
    return successResponse(comment, 201);
  } catch {
    return errorResponse('فشل إضافة التعليق', 500);
  }
}
