import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const post = await prisma.forumPost.findUnique({ where: { id }, include: { topic: { select: { id: true } } } });
  if (!post) return Response.json({ error: 'الرد غير موجود' }, { status: 404 });
  if (post.userId === user.id) return Response.json({ error: 'لا يمكن الإبلاغ عن ردك' }, { status: 400 });

  const { reason, description } = await request.json();
  if (!reason) return Response.json({ error: 'السبب مطلوب' }, { status: 400 });

  const report = await prisma.forumPostReport.create({
    data: { reason, description, postId: id, reporterId: user.id, reportedUserId: post.userId, reportedContent: post.content, reportedPostCreatedAt: post.createdAt },
  });

  return Response.json({ success: true, data: report }, { status: 201 });
}
