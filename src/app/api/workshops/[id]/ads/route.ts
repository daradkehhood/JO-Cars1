import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');

    const [ads, total] = await Promise.all([
      prisma.workshopAd.findMany({
        where: {
          workshopId: id,
          status: 'published',
          isActive: true,
        },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workshopAd.count({
        where: {
          workshopId: id,
          status: 'published',
          isActive: true,
        },
      }),
    ]);

    return successResponse({
      ads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Ads fetch error:', error);
    return errorResponse('فشل تحميل الإعلانات', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, images, startDate, endDate } = body;

    if (!title) return errorResponse('عنوان الإعلان مطلوب');

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');
    if (workshop.userId !== user.id) return unauthorizedResponse();

    const ad = await prisma.workshopAd.create({
      data: {
        workshopId: id,
        createdBy: user.id,
        title,
        description: description || null,
        images: JSON.stringify(images || []),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'pending',
      },
    });

    return successResponse(ad, 201);
  } catch (error) {
    console.error('Ad creation error:', error);
    return errorResponse('فشل إنشاء الإعلان', 500);
  }
}
