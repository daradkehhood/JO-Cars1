import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.workshopReport.findMany({
        where,
        include: {
          workshop: {
            select: { id: true, name: true },
          },
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workshopReport.count({ where }),
    ]);

    return successResponse({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin reports fetch error:', error);
    return errorResponse('فشل تحميل البلاغات', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { reportId, status } = body;

    if (!reportId) return errorResponse('معرف البلاغ مطلوب');
    if (!status) return errorResponse('الحالة مطلوبة');

    if (!['resolved', 'dismissed', 'reviewed'].includes(status)) {
      return errorResponse('الحالة غير صحيحة');
    }

    const report = await prisma.workshopReport.findUnique({ where: { id: reportId } });
    if (!report) return errorResponse('البلاغ غير موجود', 404);

    const updated = await prisma.workshopReport.update({
      where: { id: reportId },
      data: {
        status,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
      include: {
        workshop: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Admin report update error:', error);
    return errorResponse('فشل تحديث البلاغ', 500);
  }
}
