import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const service = searchParams.get('service') || '';
    const province = searchParams.get('province') || '';
    const city = searchParams.get('city') || '';
    const brand = searchParams.get('brand') || '';
    const sortBy = searchParams.get('sortBy') || 'rating';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      isBanned: false,
      isPaused: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (service) {
      where.services = { some: { name: { contains: service } } };
    }

    if (province) {
      where.provinceId = province;
    }

    if (city) {
      where.cityId = city;
    }

    if (brand) {
      where.brands = { some: { brand: { contains: brand } } };
    }

    let orderBy: any = { rating: 'desc' };
    if (sortBy === 'newest') orderBy = { createdAt: 'desc' };
    else if (sortBy === 'views') orderBy = { viewCount: 'desc' };
    else if (sortBy === 'reviews') orderBy = { reviewCount: 'desc' };

    const [workshops, total] = await Promise.all([
      prisma.workshop.findMany({
        where,
        include: {
          services: true,
          brands: true,
          prices: true,
          user: {
            select: { id: true, name: true, image: true },
          },
          reviews: {
            where: { isHidden: false },
            select: { id: true, qualityRating: true, recommend: true },
          },
          _count: { select: { reviews: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.workshop.count({ where }),
    ]);

    return successResponse({
      workshops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Workshops fetch error:', error);
    return errorResponse('فشل تحميل الورش', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const {
      name, description, phone, whatsapp, email, website,
      address, lat, lng, cityId, provinceId, logo, coverImage,
      workingHours, workingDays, yearsOfExperience, employeeCount,
      services, brands, prices,
    } = body;

    if (!name) return errorResponse('اسم الورشة مطلوب');

    const workshop = await prisma.$transaction(async (tx) => {
      const newWorkshop = await tx.workshop.create({
        data: {
          userId: user.id,
          name,
          description: description || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          email: email || null,
          website: website || null,
          address: address || null,
          lat: lat || null,
          lng: lng || null,
          cityId: cityId || null,
          provinceId: provinceId || null,
          logo: logo || null,
          coverImage: coverImage || null,
          workingHours: workingHours || '08:00-17:00',
          workingDays: workingDays || 'Sun-Thu',
          yearsOfExperience: yearsOfExperience || 0,
          employeeCount: employeeCount || 1,
        },
      });

      if (services && services.length > 0) {
        await tx.workshopService.createMany({
          data: services.map((s: { name: string; category?: string }) => ({
            workshopId: newWorkshop.id,
            name: s.name,
            category: s.category || null,
          })),
        });
      }

      if (brands && brands.length > 0) {
        await tx.workshopBrand.createMany({
          data: brands.map((b: { brand: string }) => ({
            workshopId: newWorkshop.id,
            brand: b.brand,
          })),
        });
      }

      if (prices && prices.length > 0) {
        await tx.workshopPrice.createMany({
          data: prices.map((p: { serviceName: string; minPrice: number; maxPrice: number }) => ({
            workshopId: newWorkshop.id,
            serviceName: p.serviceName,
            minPrice: p.minPrice,
            maxPrice: p.maxPrice,
          })),
        });
      }

      return tx.workshop.findUnique({
        where: { id: newWorkshop.id },
        include: { services: true, brands: true, prices: true },
      });
    });

    return successResponse(workshop, 201);
  } catch (error) {
    console.error('Workshop creation error:', error);
    return errorResponse('فشل إنشاء الورشة', 500);
  }
}
