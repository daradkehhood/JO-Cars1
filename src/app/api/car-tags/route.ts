import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const carId = request.nextUrl.searchParams.get('carId');

  try {
    const where: Record<string, unknown> = {};
    if (carId) where.carId = carId;

    const assignments = await prisma.carTagAssignment.findMany({
      where: where as any,
      include: { tag: true },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(assignments.map(a => a.tag));
  } catch (error) {
    return errorResponse('فشل تحميل الوسوم', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { carId, tagId } = body;

    if (!carId || !tagId) return errorResponse('معرف السيارة والوسم مطلوبان');

    const existing = await prisma.carTagAssignment.findUnique({
      where: { carId_tagId: { carId, tagId } },
    });

    if (existing) return errorResponse('الوسم مضاف مسبقاً لهذه السيارة');

    const assignment = await prisma.carTagAssignment.create({
      data: { carId, tagId, assignedBy: user.id },
      include: { tag: true },
    });

    return successResponse(assignment);
  } catch (error) {
    return errorResponse('فشل إضافة الوسم', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { carId, tagId } = body;

    if (!carId || !tagId) return errorResponse('معرف السيارة والوسم مطلوبان');

    await prisma.carTagAssignment.delete({
      where: { carId_tagId: { carId, tagId } },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse('فشل حذف الوسم', 500);
  }
}
