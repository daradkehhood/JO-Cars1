import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import prisma from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; soundId: string } }
) {
  try {
    const { id, soundId } = params;

    const recording = await prisma.carSoundRecording.findFirst({
      where: { id: soundId, carId: id },
      include: {
        analysis: true,
        user: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    if (!recording) {
      return notFoundResponse('التسجيل');
    }

    return successResponse(recording);
  } catch (error) {
    console.error('Error fetching sound recording:', error);
    return errorResponse('فشل في جلب التسجيل', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; soundId: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return unauthorizedResponse();

    const { id, soundId } = params;

    const recording = await prisma.carSoundRecording.findFirst({
      where: { id: soundId, carId: id }
    });

    if (!recording) {
      return notFoundResponse('التسجيل');
    }

    if (recording.userId !== user.id && user.role !== 'ADMIN') {
      return unauthorizedResponse();
    }

    try {
      const filePath = join(process.cwd(), 'public', recording.url);
      await unlink(filePath);
    } catch (e) {
      console.warn('Could not delete audio file:', e);
    }

    await prisma.carSoundRecording.delete({
      where: { id: soundId }
    });

    return successResponse({ message: 'تم حذف التسجيل بنجاح' });
  } catch (error) {
    console.error('Error deleting sound recording:', error);
    return errorResponse('فشل في حذف التسجيل', 500);
  }
}
