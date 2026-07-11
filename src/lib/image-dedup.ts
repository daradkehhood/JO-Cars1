import prisma from './prisma';

interface DuplicateCheck {
  url: string;
  carId: string;
  carTitle: string;
  distance: number;
}

export async function findDuplicateImages(imageUrl: string, excludeCarId?: string): Promise<DuplicateCheck[]> {
  try {
    const urlHash = simpleHash(imageUrl);

    const recentCars = await prisma.carImage.findMany({
      where: {
        ...(excludeCarId ? { carId: { not: excludeCarId } } : {}),
      },
      select: {
        url: true,
        carId: true,
        car: { select: { brand: true, model: true, year: true, slug: true } },
      },
      orderBy: { car: { createdAt: 'desc' } },
      take: 500,
    });

    const duplicates: DuplicateCheck[] = [];
    for (const img of recentCars) {
      const otherHash = simpleHash(img.url);
      const distance = hammingDistance(urlHash, otherHash);
      if (distance < 5) {
        duplicates.push({
          url: img.url,
          carId: img.carId,
          carTitle: `${img.car.brand?.nameAr || ''} ${img.car.model?.nameAr || ''} ${img.car.year || ''}`,
          distance,
        });
      }
    }

    return duplicates.slice(0, 10);
  } catch (error) {
    console.error('Image dedup error:', error);
    return [];
  }
}

function simpleHash(str: string): number[] {
  const normalized = str.replace(/[?&]\w+=/g, '').toLowerCase();
  const bits: number[] = [];
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      bits.push((code >> j) & 1);
    }
  }
  return bits;
}

function hammingDistance(a: number[], b: number[]): number {
  const minLen = Math.min(a.length, b.length);
  let dist = 0;
  for (let i = 0; i < minLen; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist + Math.abs(a.length - b.length);
}
