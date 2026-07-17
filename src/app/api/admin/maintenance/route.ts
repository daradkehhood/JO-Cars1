import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    const rawMaintenance = settings?.maintenance;
    const enabled = rawMaintenance === true;
    const message = settings?.maintenanceMessage || 'الموقع حالياً تحت الصيانة. يرجى المحاولة لاحقاً.';
    return successResponse({ enabled, message });
  } catch {
    return successResponse({ enabled: false, message: 'الموقع حالياً تحت الصيانة.' });
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { enabled, message } = body;

    await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: { maintenance: !!enabled, maintenanceMessage: message || 'الموقع حالياً تحت الصيانة.' },
      create: { id: 'default', maintenance: !!enabled, maintenanceMessage: message || 'الموقع حالياً تحت الصيانة.' } as any,
    });

    maintenanceCache = null;

    return successResponse({ enabled: !!enabled, message, success: true });
  } catch (error) {
    return errorResponse('فشل تحديث وضع الصيانة', 500);
  }
}

let maintenanceCache: { enabled: boolean; message: string } | null = null;
