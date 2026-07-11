import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const alert = await prisma.priceAlert.findUnique({ where: { id } });
  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (alert.userId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.priceAlert.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const alert = await prisma.priceAlert.findUnique({ where: { id } });
  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (alert.userId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await prisma.priceAlert.update({
    where: { id },
    data: { isActive: body.isActive },
  });

  return NextResponse.json(updated);
}
