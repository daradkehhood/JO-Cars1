import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const reports = await prisma.forumPostReport.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        select: { id: true, content: true, createdAt: true, topic: { select: { id: true, title: true, slug: true } } },
      },
      reporter: { select: { id: true, name: true } },
      reportedUser: { select: { id: true, name: true, dealerName: true, image: true, forumBannedCommentUntil: true, forumBannedTopicUntil: true } },
    },
  });

  return Response.json({ success: true, data: reports });
}

export async function DELETE(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: 'ID مطلوب' }, { status: 400 });

  await prisma.forumPostReport.delete({ where: { id } });

  return Response.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await request.json();
  if (!id || !status) return Response.json({ error: 'ID والحالة مطلوب' }, { status: 400 });

  await prisma.forumPostReport.update({
    where: { id },
    data: { status, resolvedAt: status === 'RESOLVED' ? new Date() : undefined },
  });

  return Response.json({ success: true });
}
