import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const plans = await prisma.plan.findMany({ orderBy: { createdAt: 'desc' } });
    const parsed = plans.map(p => ({
      ...p,
      features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || {}),
    }));
    return successResponse(parsed);
  } catch (error) {
    return errorResponse('فشل تحميل الباقات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const plan = await prisma.plan.create({
      data: {
        name: body.name || 'CUSTOM',
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        description: body.description,
        price: parseFloat(body.price),
        durationDays: parseInt(body.durationDays),
        features: JSON.stringify(body.features || {}),
        isActive: body.isActive !== false,
      },
    });
    return successResponse({ ...plan, features: JSON.parse(plan.features) }, 201);
  } catch (error) {
    return errorResponse('فشل إنشاء الباقة', 500);
  }
}
