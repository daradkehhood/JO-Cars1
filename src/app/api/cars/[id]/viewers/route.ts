import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = body.sessionId || crypto.randomUUID();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';

    const existing = await prisma.carViewer.findUnique({
      where: { carId_sessionId: { carId: id, sessionId } },
    });

    if (!existing) {
      await prisma.carViewer.create({
        data: { carId: id, sessionId, ip, userAgent },
      });
      await prisma.car.update({ where: { id }, data: { views: { increment: 1 } } });
    }

    const totalViewers = await prisma.carViewer.count({
      where: { carId: id, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
    });

    const totalViews = await prisma.car.findUnique({ where: { id }, select: { views: true } });

    return successResponse({ viewers: totalViewers, totalViews: totalViews?.views || 0 });
  } catch {
    return errorResponse('فشل تسجيل المشاهدة', 500);
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const totalViewers = await prisma.carViewer.count({
      where: { carId: id, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
    });

    const totalViews = await prisma.car.findUnique({ where: { id }, select: { views: true, saves: true } });

    return successResponse({ viewers: totalViewers, totalViews: totalViews?.views || 0, saves: totalViews?.saves || 0 });
  } catch {
    return errorResponse('فشل تحميل البيانات', 500);
  }
}
