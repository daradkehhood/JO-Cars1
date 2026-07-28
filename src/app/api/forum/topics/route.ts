import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { sanitizePlainText, sanitizeHtml } from '@/lib/sanitize';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get('categorySlug');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (categorySlug) {
    const category = await prisma.forumCategory.findUnique({ where: { slug: categorySlug } });
    if (!category) return Response.json({ success: false, error: 'القسم غير موجود' }, { status: 404 });
    where.categoryId = category.id;
  }

  const [topics, total] = await Promise.all([
    prisma.forumTopic.findMany({
      where: where as any,
      orderBy: [{ isPinned: 'desc' }, { lastPostAt: 'desc' }],
      skip, take: limit,
      include: {
        user: { select: { id: true, name: true, image: true, dealerName: true } },
        _count: { select: { posts: true } },
      },
    }),
    prisma.forumTopic.count({ where: where as any }),
  ]);

  return Response.json({
    success: true,
    data: topics,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: skip + topics.length < total },
  });
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.forumBannedTopicUntil && new Date(user.forumBannedTopicUntil) > new Date()) return Response.json({ error: 'تم حظرك من إنشاء مواضيع في المنتدى' }, { status: 403 });

  const rateLimit = checkRateLimit(`forum-topic:${user.id}`, RATE_LIMITS.FORUM);
  if (!rateLimit.allowed) return Response.json({ error: 'تم تجاوز الحد المسموح' }, { status: 429 });

  const { title, content, categoryId } = await request.json();
  if (!title || !content || !categoryId) {
    return Response.json({ error: 'العنوان، المحتوى، والقسم مطلوب' }, { status: 400 });
  }
  if (title.length > 200 || content.length > 10000) {
    return Response.json({ error: 'العنوان أو المحتوى طويل جداً' }, { status: 400 });
  }

  const category = await prisma.forumCategory.findUnique({ where: { id: categoryId } });
  if (!category) return Response.json({ error: 'القسم غير موجود' }, { status: 404 });

  const slug = `topic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const topic = await prisma.forumTopic.create({
    data: { title: sanitizePlainText(title), content: sanitizeHtml(content), slug, categoryId, userId: user.id },
    include: {
      user: { select: { id: true, name: true, image: true, dealerName: true } },
      category: { select: { id: true, nameAr: true, slug: true } },
    },
  });

  return Response.json({ success: true, data: topic }, { status: 201 });
}
