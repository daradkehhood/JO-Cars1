import prisma from './prisma';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function checkPriceAlerts(carId: string) {
  try {
    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: { brand: true, model: true, city: true },
    });
    if (!car) return;

    const price = car.price;
    const year = car.year;

    const matchingAlerts = await prisma.priceAlert.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ brandId: car.brandId }, { brandId: null }] },
          { OR: [{ modelId: car.modelId }, { modelId: null }] },
          { OR: [{ cityId: car.cityId }, { cityId: null }] },
          { OR: [{ maxPrice: null }, { maxPrice: { gte: price } }] },
          { OR: [{ minPrice: null }, { minPrice: { lte: price } }] },
          { OR: [{ yearFrom: null }, { yearFrom: { lte: year } }] },
          { OR: [{ yearTo: null }, { yearTo: { gte: year } }] },
        ],
      },
    });

    for (const alert of matchingAlerts) {
      if (alert.lastNotifiedAt && Date.now() - alert.lastNotifiedAt.getTime() < DAY_MS) continue;

      await prisma.notification.create({
        data: {
          type: 'PRICE_ALERT',
          title: 'سيارة ضمن نطاق تنبيهك',
          message: `${car.brand?.nameAr} ${car.model?.nameAr} ${car.year} - ${car.price} د.أ`,
          userId: alert.userId,
          link: `/cars/${car.slug || car.id}`,
        },
      });

      await prisma.priceAlert.update({
        where: { id: alert.id },
        data: {
          lastNotifiedAt: new Date(),
          notifiedCount: { increment: 1 },
        },
      });
    }
  } catch (error) {
    console.error('Price alert check error:', error);
  }
}
