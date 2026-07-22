import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');

    const isOwner = workshop.userId === user.id;

    const where: any = { workshopId: id };
    if (!isOwner) {
      where.userId = user.id;
    }

    const [appointments, total] = await Promise.all([
      prisma.workshopAppointment.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, image: true, phone: true },
          },
          workshop: {
            select: { id: true, name: true, userId: true },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workshopAppointment.count({ where }),
    ]);

    return successResponse({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Appointments fetch error:', error);
    return errorResponse('فشل تحميل المواعيد', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    const { date, time, serviceType, carMake, carModel, description } = body;

    if (!date || !time || !serviceType) {
      return errorResponse('التاريخ والوقت ونوع الخدمة مطلوبة');
    }

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');
    if (workshop.isPaused || workshop.isBanned) {
      return errorResponse('الورشة غير متاحة حالياً');
    }

    const appointment = await prisma.$transaction(async (tx) => {
      const newAppointment = await tx.workshopAppointment.create({
        data: {
          workshopId: id,
          userId: user.id,
          date: new Date(date),
          time,
          serviceType,
          carMake: carMake || null,
          carModel: carModel || null,
          description: description || null,
        },
      });

      await tx.workshop.update({
        where: { id },
        data: { appointmentCount: { increment: 1 } },
      });

      // Send notification message to workshop owner
      const bookingDate = new Date(date).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' });
      const notificationContent = `موعد جديد: ${user.name} حجز موعداً في ${bookingDate} الساعة ${time} للخدمة: ${serviceType}${carMake ? ` - سيارة ${carMake} ${carModel || ''}` : ''}${description ? `\nالوصف: ${description}` : ''}`;

      await tx.message.create({
        data: {
          content: notificationContent,
          senderId: user.id,
          receiverId: workshop.userId,
          conversationId: `appointment-${newAppointment.id}`,
        },
      });

      // Update message count for workshop
      await tx.workshop.update({
        where: { id },
        data: { messageCount: { increment: 1 } },
      });

      return newAppointment;
    });

    return successResponse(appointment, 201);
  } catch (error) {
    console.error('Appointment creation error:', error);
    return errorResponse('فشل إنشاء الموعد', 500);
  }
}
