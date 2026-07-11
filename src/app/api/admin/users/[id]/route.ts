import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import { createAuditLog } from '@/lib/audit';
import { sendWhatsAppToUser, buildUserMessage } from '@/lib/whatsapp';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await authenticateRequest(request);
  if (!actor || actor.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) return notFoundResponse('المستخدم');

    const updated = await prisma.user.update({
      where: { id },
      data: body,
      select: { id: true, name: true, email: true, role: true, isActive: true, badges: true, banStatus: true, banReason: true, banUntil: true, canPost: true },
    });

    if (body.banStatus || body.banStatus === null) {
      const wasBanned = oldUser.banStatus !== null;
      const nowBanned = body.banStatus !== null;
      if (nowBanned && !wasBanned) {
        await createAuditLog({
          action: 'BAN_USER', actorId: actor.id,
          entityType: 'USER', entityId: id,
          description: `حظر المستخدم ${oldUser.name} ${body.banReason ? `(السبب: ${body.banReason})` : ''}`,
          oldValue: oldUser.banStatus || 'نشط', newValue: body.banStatus,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        });
      } else if (!nowBanned && wasBanned) {
        await createAuditLog({
          action: 'UNBAN_USER', actorId: actor.id,
          entityType: 'USER', entityId: id,
          description: `إلغاء حظر المستخدم ${oldUser.name}`,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        });
      }
    }

    if (body.role && body.role !== oldUser.role) {
      await createAuditLog({
        action: 'UPDATE_USER_ROLE', actorId: actor.id,
        entityType: 'USER', entityId: id,
        description: `تغيير صلاحية المستخدم ${oldUser.name} من ${oldUser.role} إلى ${body.role}`,
        oldValue: oldUser.role, newValue: body.role,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      });
    }

    if (body.banStatus && !oldUser.banStatus) {
      sendWhatsAppToUser(id, buildUserMessage('user_banned', { reason: body.banReason || '', banUntil: body.banUntil ? new Date(body.banUntil).toLocaleDateString('ar-JO') : '' }));
    } else if (!body.banStatus && oldUser.banStatus) {
      sendWhatsAppToUser(id, buildUserMessage('user_unbanned', {}));
    }

    if (body.canPost === false && oldUser.canPost !== false) {
      sendWhatsAppToUser(id, buildUserMessage('user_suspended', {}));
    } else if (body.canPost === true && oldUser.canPost !== true) {
      sendWhatsAppToUser(id, buildUserMessage('user_activated', {}));
    }

    if (body.isActive === false && oldUser.isActive !== false) {
      sendWhatsAppToUser(id, '🚫 *JO Cars - تعطيل الحساب*\n\nتم تعطيل حسابك. للتواصل مع الإدارة: ' + (process.env.NEXT_PUBLIC_APP_URL || 'https://jocars.com') + '/tickets');
    }

    return successResponse(updated);
  } catch (error) {
    return errorResponse('فشل تحديث المستخدم', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await authenticateRequest(request);
  if (!actor || actor.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) return notFoundResponse('المستخدم');

    sendWhatsAppToUser(id, buildUserMessage('user_deleted', {}));

    await prisma.user.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE_USER', actorId: actor.id,
      entityType: 'USER', entityId: id,
      description: `حذف المستخدم ${oldUser.name}`,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse('فشل حذف المستخدم', 500);
  }
}
