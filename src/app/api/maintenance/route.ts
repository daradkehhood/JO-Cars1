import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provinceId = searchParams.get('provinceId');
  const cityId = searchParams.get('cityId');
  const category = searchParams.get('category');

  try {
    const where: any = { status: 'ACTIVE' };
    if (provinceId) where.provinceId = provinceId;
    if (cityId) where.cityId = cityId;
    if (category) where.category = category;

    const services = await prisma.maintenanceService.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        province: { select: { id: true, nameAr: true, nameEn: true } },
        city: { select: { id: true, nameAr: true, nameEn: true } },
        user: { select: { id: true, name: true, image: true } },
      },
    });
    return successResponse(services);
  } catch {
    return errorResponse('فشل تحميل الخدمات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    if (!body.title || !body.category || !body.phone || !body.provinceId) {
      return errorResponse('العنوان، التصنيف، الهاتف، والمحافظة مطلوبة', 400);
    }
    const data: any = {
      title: body.title,
      description: body.description || null,
      category: body.category,
      price: body.price ? parseFloat(body.price) : null,
      phone: body.phone,
      whatsapp: body.whatsapp || null,
      provinceId: body.provinceId,
      userId: user.id,
    };
    if (body.cityId) data.cityId = body.cityId;

    const service = await prisma.maintenanceService.create({ data });
    return successResponse(service, 201);
  } catch {
    return errorResponse('فشل إنشاء الخدمة', 500);
  }
}
