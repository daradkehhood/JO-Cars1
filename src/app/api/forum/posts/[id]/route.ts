import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const post = await prisma.forumPost.findUnique({ where: { id } });
  if (!post) return Response.json({ error: 'غير موجود' }, { status: 404 });
  if (post.userId !== user.id && user.role !== 'ADMIN') return Response.json({ error: 'لا تملك صلاحية' }, { status: 403 });

  await prisma.forumPost.delete({ where: { id } });

  const remainingPosts = await prisma.forumPost.count({ where: { topicId: post.topicId } });
  const lastPost = remainingPosts > 0
    ? await prisma.forumPost.findFirst({ where: { topicId: post.topicId }, orderBy: { createdAt: 'desc' } })
    : null;

  await prisma.forumTopic.update({
    where: { id: post.topicId },
    data: { lastPostAt: lastPost?.createdAt || new Date() },
  });

  return Response.json({ success: true });
}
