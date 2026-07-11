import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const topic = await prisma.forumTopic.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      user: { select: { id: true, name: true, image: true, dealerName: true, rating: true, ratingCount: true } },
      category: { select: { id: true, nameAr: true, nameEn: true, slug: true, icon: true, color: true } },
      posts: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, image: true, dealerName: true, rating: true, ratingCount: true, role: true, badges: true } },
        },
      },
    },
  });

  if (!topic) return Response.json({ success: false, error: 'الموضوع غير موجود' }, { status: 404 });

  const trackView = request.nextUrl.searchParams.get('trackView') === 'true';
  if (trackView) {
    await prisma.forumTopic.update({ where: { id: topic.id }, data: { views: { increment: 1 } } }).catch(() => {});
  }

  return Response.json({ success: true, data: { ...topic, views: trackView ? topic.views + 1 : topic.views } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const updated = await prisma.forumTopic.update({ where: { id }, data: body });

  return Response.json({ success: true, data: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const topic = await prisma.forumTopic.findUnique({ where: { id } });
  if (!topic) return Response.json({ error: 'غير موجود' }, { status: 404 });
  if (topic.userId !== user.id && user.role !== 'ADMIN') return Response.json({ error: 'لا تملك صلاحية' }, { status: 403 });

  await prisma.forumPost.deleteMany({ where: { topicId: id } });
  await prisma.forumTopic.delete({ where: { id } });

  return Response.json({ success: true });
}
