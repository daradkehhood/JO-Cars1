import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const status = request.nextUrl.searchParams.get('status');
    const priority = request.nextUrl.searchParams.get('priority');
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await prisma.ticket.findMany({
      where: where as any,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true },
    });

    return successResponse({ tickets, admins });
  } catch (error) {
    return errorResponse('فشل تحميل التذاكر', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { ticketId, action } = body;

    if (!ticketId || !action) return errorResponse('بيانات غير صالحة');

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return errorResponse('التذكرة غير موجودة', 404);

    if (action === 'ASSIGN') {
      if (!body.assigneeId) return errorResponse('اختر المسؤول');
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { assigneeId: body.assigneeId, status: 'IN_PROGRESS' },
      });
      await createAuditLog({
        action: 'TICKET_ASSIGN', actorId: user.id,
        entityType: 'TICKET', entityId: ticketId,
        description: `تعيين تذكرة "${ticket.subject}"`,
      });
      return successResponse({ success: true });
    }

    if (action === 'CLOSE') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'CLOSED', closedAt: new Date() },
      });
      await createAuditLog({
        action: 'TICKET_CLOSE', actorId: user.id,
        entityType: 'TICKET', entityId: ticketId,
        description: `إغلاق تذكرة "${ticket.subject}"`,
      });
      return successResponse({ success: true });
    }

    if (action === 'DELETE') {
      await prisma.ticketMessage.deleteMany({ where: { ticketId } });
      await prisma.ticket.delete({ where: { id: ticketId } });
      await createAuditLog({
        action: 'TICKET_DELETE', actorId: user.id,
        entityType: 'TICKET', entityId: ticketId,
        description: `حذف تذكرة "${ticket.subject}"`,
      });
      return successResponse({ success: true, message: 'تم حذف التذكرة' });
    }

    return errorResponse('إجراء غير معروف');
  } catch (error) {
    return errorResponse('فشل معالجة التذكرة', 500);
  }
}
