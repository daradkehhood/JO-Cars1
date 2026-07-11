import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { updateProfileSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, name: true, email: true, role: true, image: true, phone: true,
      whatsapp: true, bio: true, dealerName: true, dealerLogo: true,
      dealerDescription: true, dealerAddress: true, dealerLat: true, dealerLng: true,
      rating: true, ratingCount: true, isActive: true, createdAt: true, whatsappNotifications: true,
    },
  });

  return successResponse(fullUser);
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: validation.data,
      select: {
        id: true, name: true, email: true, role: true, image: true, phone: true,
        whatsapp: true, whatsappNotifications: true, bio: true, dealerName: true, dealerLogo: true,
        dealerDescription: true, dealerAddress: true,
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Profile update error:', error);
    return errorResponse('فشل تحديث الملف الشخصي', 500);
  }
}
