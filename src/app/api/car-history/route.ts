import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { vin, eventType, title, description, eventDate, mileage, source, sourceUrl } = await request.json();

    if (!vin || !eventType || !title) return errorResponse('VIN ونوع الحدث والعنوان مطلوبون');

    const vinUpper = vin.toUpperCase();

    const car = await prisma.car.findFirst({ where: { vin: vinUpper, deletedAt: null }, select: { id: true } });

    const record = await prisma.carHistory.create({
      data: {
        vin: vinUpper,
        eventType,
        title,
        description: description || null,
        eventDate: new Date(eventDate || Date.now()),
        mileage: mileage ? parseInt(mileage) : null,
        source: source || 'user',
        sourceUrl: sourceUrl || null,
        carId: car?.id || null,
        userId: user.id,
      },
    });

    return successResponse(record, 201);
  } catch (e) {
    console.error('Car history create error:', e);
    return errorResponse('فشل إضافة سجل', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vin = searchParams.get('vin');

    if (!vin) return errorResponse('رقم الهيكل (VIN) مطلوب');

    const history = await prisma.carHistory.findMany({
      where: { vin: vin.toUpperCase() },
      orderBy: { eventDate: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const summary = summarizeHistory(history);

    return successResponse({ history, summary });
  } catch (e) {
    return errorResponse('فشل تحميل السجل', 500);
  }
}

function summarizeHistory(history: any[]) {
  const accidentCount = history.filter(h => h.eventType === 'ACCIDENT').length;
  const serviceCount = history.filter(h => h.eventType === 'MAINTENANCE' || h.eventType === 'SERVICE').length;
  const ownerChanges = history.filter(h => h.eventType === 'OWNER_CHANGE');
  const totalOwners = Math.max(1, ownerChanges.length + 1);

  const lastMileage = [...history].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    .find(h => h.mileage)?.mileage || null;

  return {
    totalRecords: history.length,
    accidentCount,
    serviceCount,
    totalOwners,
    lastMileage,
    hasAccidents: accidentCount > 0,
    hasServiceHistory: serviceCount > 0,
  };
}
