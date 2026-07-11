import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;

  const comment = await prisma.carComment.findUnique({ where: { id } });
  if (!comment) return errorResponse('التعليق غير موجود', 404);
  if (comment.userId === user.id) return errorResponse('لا يمكن الإبلاغ عن تعليقك', 400);

  const { reason, description } = await request.json();
  if (!reason) return errorResponse('السبب مطلوب', 400);

  const result = await prisma.carCommentReport.create({
    data: { reason, description, commentId: id, reporterId: user.id, reportedUserId: comment.userId, reportedContent: comment.content, reportedCommentCreatedAt: comment.createdAt },
  });

  return successResponse(result, 201);
}
