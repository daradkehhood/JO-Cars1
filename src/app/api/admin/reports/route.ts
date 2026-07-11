import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'PENDING';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;

  try {
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          car: {
            select: {
              id: true, slug: true, price: true, year: true,
              brand: { select: { nameAr: true, nameEn: true } },
              model: { select: { nameAr: true, nameEn: true } },
            },
          },
        },
      }),
      prisma.report.count({ where: { status } }),
    ]);

    return successResponse({
      reports,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + reports.length < total,
      },
    });
  } catch {
    return errorResponse('فشل تحميل البلاغات', 500);
  }
}

export async function PATCH(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { id, status } = await request.json();
    const report = await prisma.report.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
      },
    });
    return successResponse(report);
  } catch {
    return errorResponse('فشل تحديث البلاغ', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { id } = await request.json();
    await prisma.report.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse('فشل حذف البلاغ', 500);
  }
}
