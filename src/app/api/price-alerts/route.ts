import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: user.id },
    include: {
      brand: { select: { id: true, nameAr: true, nameEn: true, logo: true } },
      model: { select: { id: true, nameAr: true, nameEn: true } },
      city: { select: { id: true, nameAr: true, nameEn: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(alerts);
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { brandId, modelId, minPrice, maxPrice, yearFrom, yearTo, cityId } = body;

  if (!brandId && !modelId && !minPrice && !maxPrice && !yearFrom && !yearTo && !cityId) {
    return NextResponse.json({ error: 'يجب تحديد معيار واحد على الأقل' }, { status: 400 });
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId: user.id,
      brandId: brandId || null,
      modelId: modelId || null,
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      yearFrom: yearFrom ? parseInt(yearFrom) : null,
      yearTo: yearTo ? parseInt(yearTo) : null,
      cityId: cityId || null,
    },
  });

  return NextResponse.json(alert, { status: 201 });
}
