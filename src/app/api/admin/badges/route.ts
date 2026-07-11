import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const badges = await prisma.badge.findMany({ orderBy: { createdAt: 'desc' } });
    return successResponse(badges);
  } catch { return errorResponse('فشل تحميل الشارات', 500); }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    if (!body.nameAr?.trim()) return errorResponse('الاسم مطلوب', 400);
    const badge = await prisma.badge.create({ data: { nameAr: body.nameAr, nameEn: body.nameEn || null, icon: body.icon || '🏆', color: body.color || '#f59e0b' } });
    return successResponse(badge);
  } catch { return errorResponse('فشل إنشاء الشارة', 500); }
}
