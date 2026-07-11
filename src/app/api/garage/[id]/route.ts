import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request).catch(() => null);
  if (!user) return Response.json({ success: false, error: 'غير مصرح' }, { status: 401 });

  const car = await prisma.userGarage.findFirst({
    where: { id, userId: user.id, isActive: true },
    include: {
      expenses: { orderBy: { date: 'desc' } },
      images: { orderBy: { order: 'asc' } },
    },
  });

  if (!car) return Response.json({ success: false, error: 'السيارة غير موجودة' }, { status: 404 });

  const thisYear = new Date();
  thisYear.setMonth(0, 1);

  const [yearExpenses, monthlyExpenses, typeBreakdown] = await Promise.all([
    prisma.carExpense.aggregate({
      where: { garageId: id, date: { gte: thisYear } },
      _sum: { cost: true },
    }),
    prisma.carExpense.groupBy({
      by: ['type'],
      where: { garageId: id },
      _sum: { cost: true },
      _count: true,
    }),
    prisma.carExpense.groupBy({
      by: ['type'],
      where: { garageId: id, date: { gte: thisYear } },
      _sum: { cost: true },
      _count: true,
    }),
  ]);

  return Response.json({
    success: true,
    data: {
      ...car,
      yearExpenses: yearExpenses._sum.cost || 0,
      typeBreakdown: typeBreakdown.map(t => ({
        type: t.type,
        total: t._sum.cost || 0,
        count: t._count,
      })),
      monthlyExpenses: typeBreakdown.map(t => ({
        type: t.type,
        total: t._sum.cost || 0,
        count: t._count,
      })),
    },
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ success: false, error: 'غير مصرح' }, { status: 401 });

  const existing = await prisma.userGarage.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ success: false, error: 'غير موجود' }, { status: 404 });

  const body = await request.json();
  const updated = await prisma.userGarage.update({
    where: { id },
    data: {
      carBrand: body.carBrand,
      carModel: body.carModel,
      carYear: body.carYear ? parseInt(body.carYear) : undefined,
      plateNumber: body.plateNumber,
      color: body.color,
      fuelType: body.fuelType,
      transmission: body.transmission,
      currentKm: body.currentKm ? parseInt(body.currentKm) : undefined,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
      purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : undefined,
      notes: body.notes,
    },
  });

  return Response.json({ success: true, data: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ success: false, error: 'غير مصرح' }, { status: 401 });

  const existing = await prisma.userGarage.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ success: false, error: 'غير موجود' }, { status: 404 });

  await prisma.userGarage.update({ where: { id }, data: { isActive: false } });
  return Response.json({ success: true });
}
