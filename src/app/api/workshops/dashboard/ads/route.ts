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

    const ads = await prisma.workshopAd.findMany({
      where: { workshopId: workshop.id },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = ads.map((ad) => {
      let parsedImages: string[] = [];
      try {
        parsedImages = JSON.parse(ad.images);
        if (!Array.isArray(parsedImages)) parsedImages = [];
      } catch {
        parsedImages = [];
      }

      return {
        id: ad.id,
        title: ad.title,
        description: ad.description || '',
        images: parsedImages,
        startDate: ad.startDate?.toISOString() || null,
        endDate: ad.endDate?.toISOString() || null,
        status: ad.status.toUpperCase(),
        isActive: ad.isActive,
      };
    });

    return successResponse(mapped);
  } catch (error) {
    console.error('Ads list error:', error);
    return errorResponse('فشل تحميل الإعلانات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const workshop = await prisma.workshop.findFirst({ where: { userId: user.id } });
    if (!workshop) return notFoundResponse('الورشة');

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const startDateStr = formData.get('startDate') as string;
    const endDateStr = formData.get('endDate') as string;
    const imageFiles = formData.getAll('images') as File[];

    if (!title || !title.trim()) {
      return errorResponse('عنوان الإعلان مطلوب');
    }

    const imageUrls: string[] = [];
    const { uploadImage } = await import('@/lib/cloudinary');
    for (const file of imageFiles) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;
      const result = await uploadImage(dataUri, { folder: `jo-cars/ads/${workshop.id}` });
      imageUrls.push(result.secure_url);
    }

    const ad = await prisma.workshopAd.create({
      data: {
        workshopId: workshop.id,
        createdBy: user.id,
        title,
        description: description || '',
        images: JSON.stringify(imageUrls),
        startDate: startDateStr ? new Date(startDateStr) : null,
        endDate: endDateStr ? new Date(endDateStr) : null,
        status: 'pending',
        isActive: true,
      },
    });

    return successResponse({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      images: imageUrls,
      startDate: ad.startDate?.toISOString() || null,
      endDate: ad.endDate?.toISOString() || null,
      status: ad.status.toUpperCase(),
      isActive: ad.isActive,
    }, 201);
  } catch (error) {
    console.error('Ad create error:', error);
    return errorResponse('فشل إنشاء الإعلان', 500);
  }
}
