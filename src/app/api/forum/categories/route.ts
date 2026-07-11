import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const categories = await prisma.forumCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { topics: true } },
    },
  });

  const withPostCounts = await Promise.all(
    categories.map(async (cat) => {
      const topics = await prisma.forumTopic.findMany({
        where: { categoryId: cat.id },
        select: { id: true },
      });
      const topicIds = topics.map((t) => t.id);
      const postsCount = await prisma.forumPost.count({
        where: { topicId: { in: topicIds } },
      });
      const lastTopic = await prisma.forumTopic.findFirst({
        where: { categoryId: cat.id },
        orderBy: { lastPostAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
        },
      });
      return {
        ...cat,
        topicsCount: cat._count.topics,
        postsCount,
        lastTopic: lastTopic
          ? { title: lastTopic.title, slug: lastTopic.slug, createdAt: lastTopic.createdAt, user: lastTopic.user }
          : null,
      };
    })
  );

  return Response.json({ success: true, data: withPostCounts });
}
