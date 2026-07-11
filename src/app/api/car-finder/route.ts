import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dailyDistance, passengers, budget, preference, fuelPreference, bodyType } = body;

    const budgetNum = parseInt(budget) || 20000;
    const passengersNum = parseInt(passengers) || 2;

    let where: any = { status: 'ACTIVE' };

    if (budgetNum) {
      where.price = { lte: budgetNum };
    }

    if (fuelPreference) {
      where.fuelType = fuelPreference;
    }

    if (bodyType) {
      where.bodyType = bodyType;
    }

    const cars = await prisma.car.findMany({
      where,
      include: { brand: true, model: true, images: { take: 1 }, city: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    let scored = cars.map(car => {
      let score = 0;
      let reasons: string[] = [];

      const dailyKm = parseInt(dailyDistance) || 30;
      const isHighMileage = dailyKm > 50;

      if (isHighMileage) {
        if (car.fuelType === 'HYBRID' || car.fuelType === 'ELECTRIC') {
          score += 30;
          reasons.push('موفرة للوقود');
        }
        if (car.fuelType === 'DIESEL') {
          score += 15;
          reasons.push('استهلاك وقود منخفض');
        }
        if (car.fuelType === 'PETROL') {
          score += 5;
        }
      } else {
        score += 10;
      }

      if (passengersNum <= 2) {
        if (car.bodyType === 'SEDAN' || car.bodyType === 'HATCHBACK') {
          score += 20;
          reasons.push('مناسبة للعدد');
        } else {
          score += 10;
        }
      } else if (passengersNum <= 5) {
        if (car.bodyType === 'SUV' || car.bodyType === 'SEDAN' || car.bodyType === 'CROSSOVER') {
          score += 25;
          reasons.push('مساحة كافية للركاب');
        } else {
          score += 10;
        }
      } else {
        if (car.bodyType === 'SUV' || car.bodyType === 'MINIVAN') {
          score += 30;
          reasons.push('مساحة واسعة للعائلة');
        } else {
          score += 5;
        }
      }

      if (preference === 'POWER') {
        if (car.fuelType === 'DIESEL') {
          score += 20;
          reasons.push('محرك قوي');
        } else if (car.year >= 2020) {
          score += 15;
          reasons.push('تقنيات حديثة');
        } else {
          score += 10;
        }
      } else if (preference === 'ECONOMY') {
        if (car.fuelType === 'HYBRID' || car.fuelType === 'ELECTRIC') {
          score += 25;
          reasons.push('موفرة جداً');
        } else if (car.year >= 2020) {
          score += 15;
          reasons.push('تقنيات حديثة موفرة');
        }
      } else {
        score += 10;
        if (car.year >= 2020) {
          score += 10;
          reasons.push('مواصفات حديثة');
        }
      }

      if (car.year >= 2022) score += 10;
      else if (car.year >= 2019) score += 5;

      if (car.price <= budgetNum * 0.8) {
        score += 10;
        reasons.push('تحت الميزانية');
      }

      if (reasons.length === 0) {
        reasons.push('خيار جيد');
      }

      return { ...car, score, reasons };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 10);

    const recommendations = top.map(car => ({
      id: car.id,
      brand: car.brand?.nameAr || car.brand?.nameEn,
      model: car.model?.nameAr || car.model?.nameEn,
      year: car.year,
      price: car.price,
      fuelType: car.fuelType,
      bodyType: car.bodyType,
      kilometers: car.kilometers,
      city: car.city?.nameAr || car.city?.nameEn || '',
      score: car.score,
      reasons: car.reasons,
      image: car.images?.[0]?.url,
      transmission: car.transmission,
    }));

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        summary: {
          totalCars: cars.length,
          averagePrice: recommendations.length > 0 ? Math.round(recommendations.reduce((a, b) => a + b.price, 0) / recommendations.length) : 0,
          budgetRange: { min: Math.round(budgetNum * 0.5), max: budgetNum },
        },
      },
    });
  } catch (error) {
    console.error('Car finder error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 });
  }
}
