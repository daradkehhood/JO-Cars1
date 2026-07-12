import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const recordings = await prisma.carSoundRecording.findMany({
      where: { carId: id },
      include: {
        analysis: true,
        user: {
          select: { id: true, name: true, image: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(recordings);
  } catch (error) {
    console.error('Error fetching sound recordings:', error);
    return errorResponse('فشل في جلب التسجيلات', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return notFoundResponse('السيارة');

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const duration = parseFloat(formData.get('duration') as string || '0');

    if (!audioFile) {
      return errorResponse('ملف الصوت مطلوب');
    }

    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = audioFile.name.split('.').pop() || 'webm';
    const fileName = `engine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const streamUrl = `/api/sounds/stream/${Date.now()}`;

    const recording = await prisma.carSoundRecording.create({
      data: {
        carId: id,
        userId: user.id,
        url: streamUrl,
        fileName,
        duration,
        fileSize: buffer.length,
        mimeType: audioFile.type || 'audio/webm',
        audioData: buffer,
        status: 'pending'
      },
      include: {
        analysis: true,
        user: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    const finalUrl = `/api/sounds/stream/${recording.id}`;
    await prisma.carSoundRecording.update({
      where: { id: recording.id },
      data: { url: finalUrl }
    });

    return successResponse({ ...recording, url: finalUrl }, 201);
  } catch (error) {
    console.error('Error uploading sound recording:', error);
    return errorResponse('فشل في رفع التسجيل', 500);
  }
}
