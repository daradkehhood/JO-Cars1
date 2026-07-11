import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user) return Response.json({ success: false, error: 'غير مصرح' }, { status: 401 });

  const garage = await prisma.userGarage.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      expenses: { orderBy: { date: 'desc' }, take: 5 },
      images: { orderBy: { order: 'asc' }, take: 3 },
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = await prisma.carExpense.groupBy({
    by: ['garageId'],
    where: { userId: user.id },
    _sum: { cost: true },
    _count: true,
  });

  const totalExpenses = await prisma.carExpense.aggregate({
    where: { userId: user.id },
    _sum: { cost: true },
    _count: true,
  });

  const thisYear = new Date();
  thisYear.setMonth(0, 1);
  const yearExpenses = await prisma.carExpense.aggregate({
    where: { userId: user.id, date: { gte: thisYear } },
    _sum: { cost: true },
  });

  return Response.json({
    success: true,
    data: {
      cars: garage.map(car => {
        const carStats = stats.find(s => s.garageId === car.id);
        return {
          ...car,
          totalSpent: carStats?._sum.cost || 0,
          expenseCount: carStats?._count || 0,
        };
      }),
      totalSpent: totalExpenses._sum.cost || 0,
      totalExpenses: totalExpenses._count || 0,
      thisYearSpent: yearExpenses._sum.cost || 0,
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ success: false, error: 'غير مصرح' }, { status: 401 });

  try {
    const body = await request.json();
    const { carBrand, carModel, carYear, plateNumber, color, fuelType, transmission, currentKm, purchaseDate, purchasePrice, notes } = body;

    if (!carBrand || !carModel || !carYear) {
      return Response.json({ success: false, error: 'الشركة والموديل والسنة مطلوبة' }, { status: 400 });
    }

    const garage = await prisma.userGarage.create({
      data: {
        userId: user.id,
        carBrand,
        carModel,
        carYear: parseInt(carYear),
        plateNumber,
        color,
        fuelType,
        transmission,
        currentKm: currentKm ? parseInt(currentKm) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        notes,
      },
    });

    return Response.json({ success: true, data: garage });
  } catch (error) {
    console.error('Garage create error:', error);
    return Response.json({ success: false, error: 'فشل إضافة السيارة' }, { status: 500 });
  }
}
