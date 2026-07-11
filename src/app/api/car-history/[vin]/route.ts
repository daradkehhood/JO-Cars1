import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ vin: string }> }) {
  try {
    const { vin } = await params;
    if (!vin || vin.length < 6) return errorResponse('رقم هيكل غير صالح');

    const vinUpper = vin.toUpperCase();
    const history = await prisma.carHistory.findMany({
      where: { vin: vinUpper },
      orderBy: { eventDate: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const summary = summarizeHistory(history);

    return successResponse({ vin: vinUpper, history, summary });
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

  return { totalRecords: history.length, accidentCount, serviceCount, totalOwners, lastMileage, hasAccidents: accidentCount > 0, hasServiceHistory: serviceCount > 0 };
}
