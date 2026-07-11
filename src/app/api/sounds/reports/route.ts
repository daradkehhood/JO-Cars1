import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { recordingId, carId, reason, description } = body;

    if (!recordingId || !carId || !reason) {
      return errorResponse('السجل والسبب مطلوبان');
    }

    const recording = await prisma.carSoundRecording.findUnique({
      where: { id: recordingId }
    });

    if (!recording) return notFoundResponse('التسجيل');

    const existingReport = await prisma.soundReport.findFirst({
      where: {
        recordingId,
        reporterId: user.id,
        status: { in: ['pending', 'reviewed'] }
      }
    });

    if (existingReport) {
      return errorResponse('لقد أبلغت عن هذا التسجيل مسبقاً');
    }

    const report = await prisma.soundReport.create({
      data: {
        recordingId,
        carId,
        reporterId: user.id,
        reason,
        description: description || null
      },
      include: {
        recording: true,
        car: {
          include: { brand: true, model: true }
        }
      }
    });

    return successResponse(report, 201);
  } catch (error) {
    console.error('Error creating sound report:', error);
    return errorResponse('فشل في إرسال البلاغ', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return unauthorizedResponse();

    if (user.role !== 'ADMIN') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const reports = await prisma.soundReport.findMany({
      where: { status },
      include: {
        recording: true,
        car: {
          include: { brand: true, model: true }
        },
        reporter: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(reports);
  } catch (error) {
    console.error('Error fetching sound reports:', error);
    return errorResponse('فشل في جلب البلاغات', 500);
  }
}
