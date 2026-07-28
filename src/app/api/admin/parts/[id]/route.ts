import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const allowedFields = ['title', 'description', 'price', 'brand', 'model', 'year', 'condition', 'phone', 'whatsapp', 'images', 'status'];
    const safeData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) safeData[key] = body[key];
    }
    const updated = await prisma.usedPart.update({ where: { id }, data: safeData });
    return successResponse(updated);
  } catch {
    return errorResponse('فشل تحديث القطعة', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    await prisma.usedPart.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse('فشل حذف القطعة', 500);
  }
}
