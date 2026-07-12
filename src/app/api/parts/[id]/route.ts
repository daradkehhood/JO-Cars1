import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const part = await prisma.usedPart.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      user: { select: { id: true, name: true, dealerName: true, dealerLogo: true, phone: true, rating: true, ratingCount: true } },
      brand: { select: { id: true, nameAr: true, nameEn: true, logo: true } },
      city: { select: { id: true, nameAr: true, nameEn: true } },
    },
  });

  if (!part) return NextResponse.json({ success: false, error: 'القطعة غير موجودة' }, { status: 404 });

  await prisma.usedPart.update({ where: { id: part.id }, data: { views: { increment: 1 } } }).catch(() => {});

  return NextResponse.json({ success: true, data: { ...part, views: part.views + 1 } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const part = await prisma.usedPart.findUnique({ where: { id } });
  if (!part) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  if (part.userId !== user.id && user.role !== 'ADMIN') return NextResponse.json({ error: 'لا تملك صلاحية' }, { status: 403 });

  const body = await request.json();
  const allowedFields = [
    'title', 'description', 'price', 'brandId', 'modelId', 'year', 'condition',
    'partNumber', 'phone', 'whatsapp', 'cityId', 'slug', 'status',
  ];
  const safeData: Record<string, any> = {};
  for (const key of allowedFields) {
    if (key in body) safeData[key] = body[key];
  }
  const updated = await prisma.usedPart.update({ where: { id }, data: safeData });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const part = await prisma.usedPart.findUnique({ where: { id } });
  if (!part) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  if (part.userId !== user.id && user.role !== 'ADMIN') return NextResponse.json({ error: 'لا تملك صلاحية' }, { status: 403 });

  if (user.role === 'ADMIN') {
    await prisma.usedPart.delete({ where: { id } });
  } else {
    await prisma.usedPart.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: user.id } });
  }

  return NextResponse.json({ success: true });
}
