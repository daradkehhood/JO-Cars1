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

    return successResponse(workshop);
  } catch (error) {
    console.error('Workshop info error:', error);
    return errorResponse('فشل تحميل بيانات الورشة', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const body = await request.json();
    const {
      name, description, phone, whatsapp, email, website,
      address, lat, lng, cityId, provinceId, logo, coverImage,
      workingHours, workingDays, yearsOfExperience, employeeCount,
    } = body;

    const updated = await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(phone !== undefined && { phone }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(address !== undefined && { address }),
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
        ...(cityId !== undefined && { cityId }),
        ...(provinceId !== undefined && { provinceId }),
        ...(logo !== undefined && { logo }),
        ...(coverImage !== undefined && { coverImage }),
        ...(workingHours !== undefined && { workingHours }),
        ...(workingDays !== undefined && { workingDays }),
        ...(yearsOfExperience !== undefined && { yearsOfExperience }),
        ...(employeeCount !== undefined && { employeeCount }),
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Workshop update error:', error);
    return errorResponse('فشل تحديث بيانات الورشة', 500);
  }
}
