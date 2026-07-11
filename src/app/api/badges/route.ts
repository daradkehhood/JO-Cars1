import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';

export async function GET() {
  try {
    const badges = await prisma.badge.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
    return successResponse(badges);
  } catch { return errorResponse('فشل تحميل الشارات', 500); }
}
