import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const tags = await prisma.carTag.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { assignments: true } } },
    });
    return successResponse(tags);
  } catch (error) {
    return errorResponse('فشل تحميل الوسوم', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { nameAr, nameEn, slug, icon, color } = body;

    if (!nameAr || !slug) {
      return errorResponse('الاسم والرابط مطلوبان');
    }

    const existing = await prisma.carTag.findUnique({ where: { slug } });
    if (existing) return errorResponse('الرابط موجود مسبقاً');

    const tag = await prisma.carTag.create({
      data: { nameAr, nameEn, slug, icon: icon || 'Tag', color: color || '#3b82f6' },
    });

    return successResponse(tag);
  } catch (error) {
    return errorResponse('فشل إنشاء الوسم', 500);
  }
}
