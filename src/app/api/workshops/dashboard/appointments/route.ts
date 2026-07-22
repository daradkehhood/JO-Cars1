import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const appointments = await prisma.workshopAppointment.findMany({
      where: { workshopId: workshop.id },
      include: {
        user: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = appointments.map((a) => ({
      id: a.id,
      userName: a.user?.name || '',
      userPhone: a.user?.phone || '',
      service: a.serviceType,
      date: a.date instanceof Date ? a.date.toISOString().split('T')[0] : String(a.date),
      time: a.time,
      description: a.description || '',
      status: a.status.toUpperCase(),
      createdAt: a.createdAt.toISOString(),
    }));

    return successResponse(mapped);
  } catch (error) {
    console.error('Appointments list error:', error);
    return errorResponse('فشل تحميل المواعيد', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const body = await request.json();
    const { appointmentId, status } = body;

    if (!appointmentId) {
      return errorResponse('معرف الموعد مطلوب');
    }
    if (!status) {
      return errorResponse('الحالة مطلوبة');
    }

    const appointment = await prisma.workshopAppointment.findFirst({
      where: { id: appointmentId, workshopId: workshop.id },
    });
    if (!appointment) return notFoundResponse('الموعد');

    const updated = await prisma.workshopAppointment.update({
      where: { id: appointmentId },
      data: { status: status.toLowerCase() },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Appointment update error:', error);
    return errorResponse('فشل تحديث الموعد', 500);
  }
}
