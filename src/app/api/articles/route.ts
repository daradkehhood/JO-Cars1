import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const showAll = request.nextUrl.searchParams.get('all') === 'true';
    const where: Record<string, unknown> = {};
    if (!showAll) where.published = true;
    if (category) where.category = category;

    const articles = await prisma.article.findMany({
      where: where as any,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true, title: true, slug: true, excerpt: true, image: true,
        category: true, tags: true, publishedAt: true, createdAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return successResponse(articles);
  } catch (error) {
    return errorResponse('فشل تحميل المقالات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { title, slug, content, excerpt, image, category, tags, published } = body;

    if (!title || !content) return errorResponse('العنوان والمحتوى مطلوبان');

    const article = await prisma.article.create({
      data: {
        title,
        slug: slug || title.replace(/\s+/g, '-').toLowerCase(),
        content,
        excerpt: excerpt || null,
        image: image || null,
        category: category || 'NEWS',
        tags: tags || '[]',
        published: published === true,
        publishedAt: published === true ? new Date() : null,
        authorId: user.id,
      },
    });

    return successResponse(article, 201);
  } catch (error) {
    return errorResponse('فشل إنشاء المقال', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    await prisma.article.deleteMany({});
    return successResponse({ message: 'تم حذف جميع المقالات' });
  } catch (error) {
    return errorResponse('فشل حذف المقالات', 500);
  }
}
