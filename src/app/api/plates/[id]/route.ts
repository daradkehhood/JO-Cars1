import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const plate = await prisma.plate.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, image: true, dealerName: true } },
      },
    });
    if (!plate) return notFoundResponse('اللوحة');
    return successResponse(plate);
  } catch (error) {
    return errorResponse('فشل تحميل اللوحة', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const plate = await prisma.plate.findUnique({ where: { id } });
    if (!plate) return notFoundResponse('اللوحة');
    if (plate.sellerId !== user.id && user.role !== 'ADMIN') return errorResponse('لا تملك صلاحية', 403);

    const body = await request.json();
    const updated = await prisma.plate.update({
      where: { id },
      data: {
        plateNumber: body.plateNumber ?? plate.plateNumber,
        type: body.type ?? plate.type,
        price: body.price ? parseFloat(body.price) : plate.price,
        description: body.description ?? plate.description,
        phone: body.phone ?? plate.phone,
        whatsapp: body.whatsapp ?? plate.whatsapp,
        isNegotiable: body.isNegotiable !== undefined ? body.isNegotiable : plate.isNegotiable,
        status: body.status ?? plate.status,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse('فشل تحديث اللوحة', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const plate = await prisma.plate.findUnique({ where: { id } });
    if (!plate) return notFoundResponse('اللوحة');
    if (plate.sellerId !== user.id && user.role !== 'ADMIN') return errorResponse('لا تملك صلاحية', 403);

    await prisma.plate.delete({ where: { id } });
    return successResponse({ success: true });
  } catch (error) {
    return errorResponse('فشل حذف اللوحة', 500);
  }
}
