import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import { sendWhatsAppToUser, buildUserMessage } from '@/lib/whatsapp';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        assignee: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true, role: true, image: true } } },
        },
      },
    });

    if (!ticket) return notFoundResponse('التذكرة');
    if (ticket.userId !== user.id && user.role !== 'ADMIN') return unauthorizedResponse();

    return successResponse(ticket);
  } catch (error) {
    return errorResponse('فشل تحميل التذكرة', 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { content } = body;
    if (!content) return errorResponse('الرسالة مطلوبة');

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return notFoundResponse('التذكرة');
    if (ticket.userId !== user.id && user.role !== 'ADMIN') return unauthorizedResponse();
    if (ticket.status === 'CLOSED') return errorResponse('التذكرة مغلقة');

    const isStaff = user.role === 'ADMIN';

    const message = await prisma.ticketMessage.create({
      data: { content, ticketId: id, userId: user.id, isStaff },
      include: { user: { select: { id: true, name: true, role: true, image: true } } },
    });

    await prisma.ticket.update({
      where: { id },
      data: { status: isStaff && ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status, updatedAt: new Date() },
    });

    if (isStaff) {
      sendWhatsAppToUser(ticket.userId, buildUserMessage('ticket_reply', {
        subject: ticket.subject, replyPreview: content.slice(0, 100), ticketId: id,
      }));
    }

    return successResponse(message);
  } catch (error) {
    return errorResponse('فشل إضافة الرد', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return notFoundResponse('التذكرة');
    if (ticket.userId !== user.id && user.role !== 'ADMIN') return unauthorizedResponse();

    const updateData: Record<string, unknown> = {};
    if (body.status) {
      if (user.role !== 'ADMIN' && body.status === 'CLOSED') {
        updateData.status = 'CLOSED';
        updateData.closedAt = new Date();
      } else if (user.role === 'ADMIN') {
        updateData.status = body.status;
        if (body.status === 'CLOSED') updateData.closedAt = new Date();
        else updateData.closedAt = null;
      }
    }
    if (body.assigneeId && user.role === 'ADMIN') {
      updateData.assigneeId = body.assigneeId;
    }

    if (Object.keys(updateData).length === 0) return errorResponse('لا توجد تغييرات');

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse('فشل تحديث التذكرة', 500);
  }
}
