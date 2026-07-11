import prisma from '@/lib/prisma';

const BRAND_BASE_PRICES: Record<string, number> = {
  TOYOTA: 25000, HONDA: 22000, HYUNDAI: 18000, KIA: 17000,
  NISSAN: 20000, MITSUBISHI: 18000, BMW: 35000, MERCEDES: 45000,
  AUDI: 38000, VOLKSWAGEN: 25000, FORD: 22000, CHEVROLET: 20000,
  OPEL: 15000, RENAULT: 16000, PEUGEOT: 16000, MAZDA: 20000,
  SUZUKI: 14000, LEXUS: 35000, ACURA: 30000, INFINITI: 28000,
};

const CONDITION_FACTOR: Record<string, number> = {
  EXCELLENT: 1.0, VERY_GOOD: 0.9, GOOD: 0.8, FAIR: 0.65,
  NEEDS_MAINTENANCE: 0.5, NEEDS_INSPECTION: 0.4,
};

function estimateByDepreciation(car: { brandId: string; brand: { nameEn: string | null } | null; year: number; price: number; condition: string }): number {
  const brandKey = (car.brand?.nameEn || '').toUpperCase();
  let basePrice = 20000;
  for (const [key, price] of Object.entries(BRAND_BASE_PRICES)) {
    if (brandKey.includes(key)) { basePrice = price; break; }
  }
  const age = Math.max(1, 2026 - car.year);
  const depreciation = Math.min(0.85, age * 0.05);
  const conditionFactor = CONDITION_FACTOR[car.condition] || 0.8;
  return Math.round(basePrice * (1 - depreciation) * conditionFactor);
}

export async function calculateFairPrice(carId: string): Promise<number | null> {
  const car = await prisma.car.findUnique({
    where: { id: carId },
    include: { brand: { select: { nameEn: true } } },
  });
  if (!car) return null;

  const exact = await prisma.car.findMany({
    where: {
      brandId: car.brandId, modelId: car.modelId,
      year: { gte: car.year - 2, lte: car.year + 2 },
      kilometers: { gte: Math.round(car.kilometers * 0.7), lte: Math.round(car.kilometers * 1.3) },
      fuelType: car.fuelType, status: 'APPROVED', deletedAt: null,
      id: { not: car.id },
    },
    select: { price: true },
  });

  if (exact.length >= 2) {
    const avg = exact.reduce((s, c) => s + c.price, 0) / exact.length;
    const final = Math.round(avg * 0.6 + car.price * 0.4);
    await prisma.car.update({ where: { id: carId }, data: { fairPriceEstimate: final } });
    return final;
  }

  const brandOnly = await prisma.car.findMany({
    where: {
      brandId: car.brandId,
      year: { gte: car.year - 5, lte: car.year + 5 },
      status: 'APPROVED', deletedAt: null, id: { not: car.id },
    },
    select: { price: true, year: true },
  });

  if (brandOnly.length >= 2) {
    const avg = brandOnly.reduce((s, c) => s + c.price, 0) / brandOnly.length;
    const final = Math.round(avg * 0.5 + car.price * 0.5);
    await prisma.car.update({ where: { id: carId }, data: { fairPriceEstimate: final } });
    return final;
  }

  const allCars = await prisma.car.findMany({
    where: {
      year: { gte: car.year - 5, lte: car.year + 5 },
      fuelType: car.fuelType, status: 'APPROVED', deletedAt: null,
      id: { not: car.id },
    },
    select: { price: true, year: true },
  });

  if (allCars.length >= 2) {
    const avg = allCars.reduce((s, c) => s + c.price, 0) / allCars.length;
    const final = Math.round(avg * 0.4 + car.price * 0.6);
    await prisma.car.update({ where: { id: carId }, data: { fairPriceEstimate: final } });
    return final;
  }

  const estimated = estimateByDepreciation(car);
  await prisma.car.update({ where: { id: carId }, data: { fairPriceEstimate: estimated } });
  return estimated;
}

export async function recalculateAllFairPrices(): Promise<number> {
  const cars = await prisma.car.findMany({
    where: { status: 'APPROVED', deletedAt: null },
    select: { id: true },
  });
  let done = 0;
  for (const car of cars) {
    await calculateFairPrice(car.id).catch(() => {});
    done++;
  }
  return done;
}
