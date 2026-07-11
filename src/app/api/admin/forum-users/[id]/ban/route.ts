import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

function calculateBanUntil(duration: string): Date | null {
  if (duration === 'none') return null;
  if (duration === 'permanent') return new Date('2099-12-31T23:59:59Z');
  const now = new Date();
  const match = duration.match(/^(\d+)([hdwm])$/);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'h': return new Date(now.getTime() + num * 60 * 60 * 1000);
    case 'd': return new Date(now.getTime() + num * 24 * 60 * 60 * 1000);
    case 'w': return new Date(now.getTime() + num * 7 * 24 * 60 * 60 * 1000);
    case 'm': return new Date(now.getTime() + num * 30 * 24 * 60 * 60 * 1000);
    default: return null;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await authenticateRequest(request);
  if (!admin || admin.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, duration } = await request.json();
  if (!type || !duration) return Response.json({ error: 'النوع والمدة مطلوبان' }, { status: 400 });

  const banUntil = calculateBanUntil(duration);
  if (banUntil === undefined) return Response.json({ error: 'مدة غير صالحة' }, { status: 400 });

  const data: Record<string, Date | null> = {};
  if (type === 'comment' || type === 'both') data.forumBannedCommentUntil = banUntil;
  if (type === 'topic' || type === 'both') data.forumBannedTopicUntil = banUntil;

  const updatedUser = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, forumBannedCommentUntil: true, forumBannedTopicUntil: true },
  });

  return Response.json({ success: true, data: updatedUser });
}
