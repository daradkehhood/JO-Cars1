import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });
    if (!article) return notFoundResponse('المقال');
    return successResponse(article);
  } catch (error) {
    return errorResponse('فشل تحميل المقال', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const article = await prisma.article.findUnique({ where: { slug } });
    if (!article) return notFoundResponse('المقال');

    const body = await request.json();
    const updated = await prisma.article.update({
      where: { slug },
      data: {
        title: body.title ?? article.title,
        content: body.content ?? article.content,
        excerpt: body.excerpt ?? article.excerpt,
        image: body.image ?? article.image,
        category: body.category ?? article.category,
        tags: body.tags ?? article.tags,
        published: body.published !== undefined ? body.published : article.published,
        publishedAt: body.published === true && !article.publishedAt ? new Date() : article.publishedAt,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse('فشل تحديث المقال', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    await prisma.article.delete({ where: { slug } });
    return successResponse({ success: true });
  } catch (error) {
    return errorResponse('فشل حذف المقال', 500);
  }
}
