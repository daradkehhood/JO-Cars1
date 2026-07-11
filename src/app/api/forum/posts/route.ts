import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.forumBannedCommentUntil && new Date(user.forumBannedCommentUntil) > new Date()) return Response.json({ error: 'تم حظرك من التعليق في المنتدى' }, { status: 403 });

  const { content, topicId } = await request.json();
  if (!content || !topicId) {
    return Response.json({ error: 'المحتوى والموضوع مطلوب' }, { status: 400 });
  }

  const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } });
  if (!topic) return Response.json({ error: 'الموضوع غير موجود' }, { status: 404 });
  if (topic.isLocked) return Response.json({ error: 'الموضوع مغلق' }, { status: 400 });

  const post = await prisma.forumPost.create({
    data: { content, topicId, userId: user.id },
    include: {
      user: { select: { id: true, name: true, image: true, dealerName: true, rating: true, ratingCount: true, role: true, badges: true } },
    },
  });

  await prisma.forumTopic.update({
    where: { id: topicId },
    data: { lastPostAt: new Date() },
  });

  return Response.json({ success: true, data: post }, { status: 201 });
}
