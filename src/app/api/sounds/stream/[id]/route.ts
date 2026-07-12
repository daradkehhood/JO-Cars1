import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const recording = await prisma.carSoundRecording.findUnique({
      where: { id },
      select: { audioData: true, mimeType: true },
    });

    if (!recording || !recording.audioData) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(recording.audioData as unknown as BodyInit, {
      headers: {
        'Content-Type': recording.mimeType || 'audio/webm',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error streaming audio:', error);
    return new Response('Error', { status: 500 });
  }
}
