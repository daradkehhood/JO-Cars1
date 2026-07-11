import prisma from '@/lib/prisma';

export interface SearchCarsParams {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  yearFrom?: number;
  yearTo?: number;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  condition?: string;
  maxKilometers?: number;
  drivetrain?: string;
  limit?: number;
}

export async function searchCars(params: SearchCarsParams) {
  const where: Record<string, unknown> = { status: 'APPROVED' };

  if (params.minPrice || params.maxPrice) {
    where.price = {};
    if (params.minPrice) (where.price as any).gte = params.minPrice;
    if (params.maxPrice) (where.price as any).lte = params.maxPrice;
  }

  if (params.brand) {
    const brand = await prisma.brand.findFirst({
      where: {
        OR: [
          { nameAr: { contains: params.brand } },
          { nameEn: { contains: params.brand } },
          { slug: { contains: params.brand.toLowerCase() } },
        ],
      },
    });
    if (brand) where.brandId = brand.id;
  }

  if (params.yearFrom || params.yearTo) {
    where.year = {};
    if (params.yearFrom) (where.year as any).gte = params.yearFrom;
    if (params.yearTo) (where.year as any).lte = params.yearTo;
  }

  if (params.bodyType) {
    where.bodyType = params.bodyType.toUpperCase();
  }

  if (params.fuelType) {
    where.fuelType = params.fuelType.toUpperCase();
  }

  if (params.transmission) {
    where.transmission = params.transmission.toUpperCase();
  }

  if (params.condition) {
    where.condition = params.condition.toUpperCase();
  }

  if (params.maxKilometers) {
    where.kilometers = { lte: params.maxKilometers };
  }

  if (params.drivetrain) {
    where.drivetrain = params.drivetrain.toUpperCase();
  }

  if (params.query) {
    const q = params.query;
    const brands = await prisma.brand.findMany({
      where: {
        OR: [
          { nameAr: { contains: q } },
          { nameEn: { contains: q } },
        ],
      },
      select: { id: true },
    });
    const models = await prisma.carModel.findMany({
      where: {
        OR: [
          { nameAr: { contains: q } },
          { nameEn: { contains: q } },
        ],
      },
      select: { id: true },
    });
    where.OR = [
      ...(brands.length ? [{ brandId: { in: brands.map((b: { id: string }) => b.id) } }] : []),
      ...(models.length ? [{ modelId: { in: models.map((m: { id: string }) => m.id) } }] : []),
      { description: { contains: q } },
    ];
  }

  const cars = await prisma.car.findMany({
    where: where as any,
    take: params.limit || 10,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    include: {
      brand: { select: { nameAr: true, nameEn: true } },
      model: { select: { nameAr: true, nameEn: true } },
      city: { select: { nameAr: true, nameEn: true } },
      images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
    },
  });

  return cars.map((car) => ({
    id: car.id,
    slug: car.slug,
    refCode: car.refCode,
    title: `${car.brand.nameAr || car.brand.nameEn} ${car.model.nameAr || car.model.nameEn}`,
    price: car.price,
    year: car.year,
    kilometers: car.kilometers,
    fuelType: car.fuelType,
    transmission: car.transmission,
    condition: car.condition,
    bodyType: car.bodyType,
    color: car.color,
    engineCapacity: car.engineCapacity,
    drivetrain: car.drivetrain,
    city: car.city.nameAr || car.city.nameEn,
    image: car.images?.[0]?.url || null,
    isNegotiable: car.isNegotiable,
    hasWarranty: car.hasWarranty,
    ownerCount: car.ownerCount,
  }));
}
