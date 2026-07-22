import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status === 'verified') where.isVerified = true;
    else if (status === 'unverified') where.isVerified = false;
    else if (status === 'paused') where.isPaused = true;
    else if (status === 'banned') where.isBanned = true;

    const [workshops, total] = await Promise.all([
      prisma.workshop.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          services: true,
          brands: true,
          _count: { select: { reviews: true, appointments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workshop.count({ where }),
    ]);

    return successResponse({
      workshops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin workshops fetch error:', error);
    return errorResponse('فشل تحميل الورش', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const workshopId = searchParams.get('workshopId');

    if (!workshopId) return errorResponse('معرف الورشة مطلوب');

    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) return errorResponse('الورشة غير موجودة', 404);

    await prisma.workshop.delete({ where: { id: workshopId } });

    return successResponse({ message: 'تم حذف الورشة بنجاح' });
  } catch (error) {
    console.error('Admin workshop delete error:', error);
    return errorResponse('فشل حذف الورشة', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { workshopId, ...updateData } = body;

    if (!workshopId) return errorResponse('معرف الورشة مطلوب');

    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) return errorResponse('الورشة غير موجودة', 404);

    const data: any = {};

    if (updateData.isVerified !== undefined) {
      data.isVerified = updateData.isVerified;
      if (updateData.isVerified) {
        data.verifiedAt = new Date();
        data.verifiedBy = user.id;
      }
    }

    if (updateData.verifiedBy !== undefined) data.verifiedBy = updateData.verifiedBy;
    if (updateData.commercialRegister !== undefined) data.commercialRegister = updateData.commercialRegister;

    if (updateData.isPaused !== undefined) {
      data.isPaused = updateData.isPaused;
      if (updateData.pausedUntil) data.pausedUntil = new Date(updateData.pausedUntil);
      if (updateData.pauseReason !== undefined) data.pauseReason = updateData.pauseReason;
    }

    if (updateData.isBanned !== undefined) {
      data.isBanned = updateData.isBanned;
      if (updateData.banReason !== undefined) data.banReason = updateData.banReason;
      if (updateData.banUntil) data.banUntil = new Date(updateData.banUntil);
    }

    const updated = await prisma.workshop.update({
      where: { id: workshopId },
      data,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Admin workshop update error:', error);
    return errorResponse('فشل تحديث الورشة', 500);
  }
}
