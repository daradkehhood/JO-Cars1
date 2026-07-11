import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user) return Response.json({ success: false, error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const garageId = searchParams.get('garageId');
  const type = searchParams.get('type');
  const year = searchParams.get('year') || new Date().getFullYear().toString();

  const where: any = { userId: user.id };
  if (garageId) where.garageId = garageId;
  if (type) where.type = type;

  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31T23:59:59`);
  where.date = { gte: startDate, lte: endDate };

  const expenses = await prisma.carExpense.findMany({
    where,
    include: { garage: { select: { carBrand: true, carModel: true, carYear: true } } },
    orderBy: { date: 'desc' },
  });

  const total = expenses.reduce((sum, e) => sum + e.cost, 0);

  const byType = await prisma.carExpense.groupBy({
    by: ['type'],
    where: { userId: user.id, date: { gte: startDate, lte: endDate } },
    _sum: { cost: true },
    _count: true,
  });

  const byMonth = await prisma.$queryRaw`
    SELECT EXTRACT(MONTH FROM date) as month, SUM(cost) as total, COUNT(*) as count
    FROM car_expenses
    WHERE "userId" = ${user.id} AND date >= ${startDate} AND date <= ${endDate}
    GROUP BY EXTRACT(MONTH FROM date)
    ORDER BY month
  `;

  return Response.json({
    success: true,
    data: {
      expenses,
      total,
      byType: byType.map(t => ({ type: t.type, total: t._sum.cost || 0, count: t._count })),
      byMonth,
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ success: false, error: 'غير مصرح' }, { status: 401 });

  try {
    const body = await request.json();
    const { garageId, type, title, description, cost, odometer, date, shopName } = body;

    if (!garageId || !type || !title || !cost) {
      return Response.json({ success: false, error: 'البيانات الأساسية مطلوبة' }, { status: 400 });
    }

    const garage = await prisma.userGarage.findFirst({ where: { id: garageId, userId: user.id } });
    if (!garage) return Response.json({ success: false, error: 'السيارة غير موجودة' }, { status: 404 });

    const expense = await prisma.carExpense.create({
      data: {
        garageId,
        userId: user.id,
        type,
        title,
        description,
        cost: parseFloat(cost),
        odometer: odometer ? parseInt(odometer) : null,
        date: date ? new Date(date) : new Date(),
        shopName,
      },
    });

    return Response.json({ success: true, data: expense });
  } catch (error) {
    console.error('Expense create error:', error);
    return Response.json({ success: false, error: 'فشل إضافة المصروف' }, { status: 500 });
  }
}
