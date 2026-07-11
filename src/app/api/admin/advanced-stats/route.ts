import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const [brandDemand, priceDistribution, userActivity, cityDistribution, fuelDistribution, yearDistribution] = await Promise.all([
      prisma.car.groupBy({ by: ['brandId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 20 }),
      getPriceDistribution(),
      getUserActivity(),
      prisma.car.groupBy({ by: ['cityId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 20 }),
      prisma.car.groupBy({ by: ['fuelType'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
      prisma.car.groupBy({ by: ['year'], _count: { id: true }, orderBy: { year: 'desc' }, take: 30 }),
    ]);

    const brandIds = brandDemand.map(b => b.brandId);
    const brands = await prisma.brand.findMany({
      where: { id: { in: brandIds } },
      select: { id: true, nameAr: true, logo: true },
    });
    const brandMap = Object.fromEntries(brands.map(b => [b.id, b]));

    const cityIds = cityDistribution.map(c => c.cityId);
    const cities = await prisma.city.findMany({
      where: { id: { in: cityIds } },
      select: { id: true, nameAr: true },
    });
    const cityMap = Object.fromEntries(cities.map(c => [c.id, c]));

    return successResponse({
      brandDemand: brandDemand.map(b => ({
        brandId: b.brandId,
        name: brandMap[b.brandId]?.nameAr || 'غير معروف',
        logo: brandMap[b.brandId]?.logo || null,
        count: b._count.id,
      })),
      priceDistribution,
      userActivity,
      cityDistribution: cityDistribution.map(c => ({
        cityId: c.cityId,
        name: cityMap[c.cityId]?.nameAr || 'غير معروف',
        count: c._count.id,
      })),
      fuelDistribution: fuelDistribution.map(f => ({
        fuelType: f.fuelType,
        count: f._count.id,
      })),
      yearDistribution: yearDistribution.map(y => ({
        year: y.year.toString(),
        count: y._count.id,
      })),
    });
  } catch (error) {
    console.error('Advanced stats error:', error);
    return errorResponse('فشل تحميل الإحصائيات', 500);
  }
}

async function getPriceDistribution() {
  const buckets = [
    { min: 0, max: 3000, label: 'أقل من 3,000' },
    { min: 3000, max: 5000, label: '3,000 - 5,000' },
    { min: 5000, max: 10000, label: '5,000 - 10,000' },
    { min: 10000, max: 15000, label: '10,000 - 15,000' },
    { min: 15000, max: 25000, label: '15,000 - 25,000' },
    { min: 25000, max: 35000, label: '25,000 - 35,000' },
    { min: 35000, max: 50000, label: '35,000 - 50,000' },
    { min: 50000, max: Infinity, label: 'أكثر من 50,000' },
  ];

  const results = [];
  for (const bucket of buckets) {
    const count = await prisma.car.count({
      where: {
        price: { gte: bucket.min, ...(bucket.max < Infinity ? { lt: bucket.max } : {}) },
        status: 'APPROVED',
      },
    });
    results.push({ label: bucket.label, min: bucket.min, max: bucket.max === Infinity ? null : bucket.max, count });
  }

  return results;
}

async function getUserActivity() {
  const months: { month: string; label: string; users: number; cars: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = startOfMonth.toLocaleDateString('ar-JO', { month: 'long', year: 'numeric' });

    const [users, cars] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startOfMonth, lt: endOfMonth } } }),
      prisma.car.count({ where: { createdAt: { gte: startOfMonth, lt: endOfMonth } } }),
    ]);

    months.push({ month: monthStr, label: monthLabel, users, cars });
  }

  return months;
}
