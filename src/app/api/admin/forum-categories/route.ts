import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { sendWhatsAppToAllUsers, buildUserMessage } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const categories = await prisma.forumCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { topics: true } } },
  });

  return successResponse(categories);
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const body = await request.json();
  if (!body.nameAr || !body.nameEn || !body.slug) {
    return errorResponse('الاسم وال slug مطلوب', 400);
  }

  const category = await prisma.forumCategory.create({
    data: {
      nameAr: body.nameAr,
      nameEn: body.nameEn,
      slug: body.slug,
      description: body.description || null,
      icon: body.icon || 'MessageCircle',
      color: body.color || '#3b82f6',
      sortOrder: body.sortOrder || 0,
    },
  });

  sendWhatsAppToAllUsers(buildUserMessage('new_forum_category', { categoryName: body.nameAr }));

  return successResponse(category, 201);
}
