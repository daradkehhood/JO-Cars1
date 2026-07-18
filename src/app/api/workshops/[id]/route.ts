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

    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        services: true,
        brands: true,
        prices: true,
        user: {
          select: { id: true, name: true, image: true, phone: true, whatsapp: true },
        },
        reviews: {
          where: { isHidden: false },
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        ads: {
          where: { status: 'published', isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!workshop) return notFoundResponse('الورشة');

    await prisma.workshop.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return successResponse(workshop);
  } catch (error) {
    console.error('Workshop fetch error:', error);
    return errorResponse('فشل تحميل الورشة', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');
    if (workshop.userId !== user.id && user.role !== 'ADMIN') return unauthorizedResponse();

    const body = await request.json();
    const {
      name, description, phone, whatsapp, email, website,
      address, lat, lng, cityId, provinceId, logo, coverImage,
      workingHours, workingDays, yearsOfExperience, employeeCount,
      services, brands, prices,
    } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedWorkshop = await tx.workshop.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(phone !== undefined && { phone }),
          ...(whatsapp !== undefined && { whatsapp }),
          ...(email !== undefined && { email }),
          ...(website !== undefined && { website }),
          ...(address !== undefined && { address }),
          ...(lat !== undefined && { lat }),
          ...(lng !== undefined && { lng }),
          ...(cityId !== undefined && { cityId }),
          ...(provinceId !== undefined && { provinceId }),
          ...(logo !== undefined && { logo }),
          ...(coverImage !== undefined && { coverImage }),
          ...(workingHours !== undefined && { workingHours }),
          ...(workingDays !== undefined && { workingDays }),
          ...(yearsOfExperience !== undefined && { yearsOfExperience }),
          ...(employeeCount !== undefined && { employeeCount }),
        },
      });

      if (services && Array.isArray(services)) {
        await tx.workshopService.deleteMany({ where: { workshopId: id } });
        if (services.length > 0) {
          await tx.workshopService.createMany({
            data: services.map((s: { name: string; category?: string }) => ({
              workshopId: id,
              name: s.name,
              category: s.category || null,
            })),
          });
        }
      }

      if (brands && Array.isArray(brands)) {
        await tx.workshopBrand.deleteMany({ where: { workshopId: id } });
        if (brands.length > 0) {
          await tx.workshopBrand.createMany({
            data: brands.map((b: { brand: string }) => ({
              workshopId: id,
              brand: b.brand,
            })),
          });
        }
      }

      if (prices && Array.isArray(prices)) {
        await tx.workshopPrice.deleteMany({ where: { workshopId: id } });
        if (prices.length > 0) {
          await tx.workshopPrice.createMany({
            data: prices.map((p: { serviceName: string; minPrice: number; maxPrice: number }) => ({
              workshopId: id,
              serviceName: p.serviceName,
              minPrice: p.minPrice,
              maxPrice: p.maxPrice,
            })),
          });
        }
      }

      return tx.workshop.findUnique({
        where: { id },
        include: { services: true, brands: true, prices: true },
      });
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Workshop update error:', error);
    return errorResponse('فشل تحديث الورشة', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');
    if (workshop.userId !== user.id && user.role !== 'ADMIN') return unauthorizedResponse();

    await prisma.workshop.delete({ where: { id } });

    return successResponse({ message: 'تم حذف الورشة بنجاح' });
  } catch (error) {
    console.error('Workshop delete error:', error);
    return errorResponse('فشل حذف الورشة', 500);
  }
}
