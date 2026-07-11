const ULTRA_MSG_TOKEN = process.env.ULTRA_MSG_TOKEN || '';
const ULTRA_MSG_INSTANCE = process.env.ULTRA_MSG_INSTANCE || 'instance0';

interface WhatsAppResult {
  success: boolean;
  method: 'ultramsg' | 'log';
  messageId?: string;
  error?: string;
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('962')) return cleaned;
  if (cleaned.startsWith('0')) return '962' + cleaned.slice(1);
  if (cleaned.startsWith('+')) return cleaned.slice(1);
  if (cleaned.startsWith('7')) return '962' + cleaned;
  return cleaned;
}

async function sendUltraMsg(to: string, message: string): Promise<WhatsAppResult> {
  try {
    const params = new URLSearchParams({
      token: ULTRA_MSG_TOKEN,
      to: formatPhone(to),
      body: message,
      priority: '10',
      referenceId: '',
    });

    const res = await fetch(`https://api.ultramsg.com/${ULTRA_MSG_INSTANCE}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await res.json();
    return {
      success: data.sent === true || !!data.messageId,
      method: 'ultramsg',
      messageId: data.messageId,
      error: data.error || data.description,
    };
  } catch (err: any) {
    return { success: false, method: 'ultramsg', error: err.message };
  }
}

function logNotification(to: string, message: string): WhatsAppResult {
  console.log(`[WhatsApp Notification] To: ${to} | Message: ${message}`);
  return { success: true, method: 'log' };
}

export async function sendWhatsApp(
  to: string,
  message: string,
): Promise<WhatsAppResult> {
  if (!to) {
    return { success: false, method: 'log', error: 'رقم الهاتف مطلوب' };
  }

  if (ULTRA_MSG_TOKEN) {
    const result = await sendUltraMsg(to, message);
    if (result.success) return result;
    console.warn('[WhatsApp] UltraMsg failed, falling back to log:', result.error);
  }

  return logNotification(to, message);
}

export function buildCarMessage(
  type: 'new_message' | 'new_conversation' | 'price_alert' | 'seller_reply',
  data: {
    senderName?: string;
    carTitle?: string;
    carPrice?: number;
    messagePreview?: string;
    carUrl?: string;
    receiverName?: string;
  },
): string {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jocars.com';

  const templates: Record<string, string> = {
    new_message: `🔔 *JO Cars - رسالة جديدة*\n\nمن: ${data.senderName || 'مستخدم'}\nالسيارة: ${data.carTitle || ''}\nالرسالة: ${data.messagePreview || ''}\n\n👇 للرد:\n${siteUrl}/messages`,
    new_conversation: `💬 *JO Cars - استفسار عن سيارة*\n\nالمشتري: ${data.senderName || 'مستخدم'}\nالسيارة: ${data.carTitle || ''}\nالسعر: ${data.carPrice?.toLocaleString() || ''} د.أ\nالرسالة: ${data.messagePreview || ''}\n\n👇 للرد:\n${siteUrl}/messages`,
    seller_reply: `📩 *JO Cars - رد على استفسارك*\n\nالبائع: ${data.senderName || 'مستخدم'}\nالسيارة: ${data.carTitle || ''}\nالرد: ${data.messagePreview || ''}\n\n👇 للمتابعة:\n${siteUrl}/messages`,
    price_alert: `💰 *JO Cars - تنبيه سعر*\n\n${data.carTitle || 'سيارة'} مطابقة لبحثك!\nالسعر: ${data.carPrice?.toLocaleString() || ''} د.أ\n\n👇 للمشاهدة:\n${siteUrl}/cars`,
  };

  return templates[type] || '';
}

export function isWhatsAppConfigured(): boolean {
  return !!ULTRA_MSG_TOKEN;
}

export async function sendWhatsAppToUser(userId: string, message: string): Promise<WhatsAppResult> {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { whatsapp: true, whatsappNotifications: true },
    });
    if (user?.whatsapp && user?.whatsappNotifications) {
      return sendWhatsApp(user.whatsapp, message);
    }
    return { success: false, method: 'log', error: 'المستخدم ليس لديه واتساب مفعل' };
  } catch (err: any) {
    return { success: false, method: 'log', error: err.message };
  }
}

export async function sendWhatsAppToAdmins(message: string): Promise<void> {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true, whatsappNotifications: true },
      select: { whatsapp: true },
    });
    for (const admin of admins) {
      if (admin.whatsapp) sendWhatsApp(admin.whatsapp, message);
    }
  } catch (err: any) {
    console.error('[WhatsApp] sendToAdmins error:', err.message);
  }
}

export async function sendWhatsAppToAllUsers(message: string): Promise<void> {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const users = await prisma.user.findMany({
      where: { isActive: true, whatsappNotifications: true },
      select: { whatsapp: true },
      take: 200,
    });
    for (const user of users) {
      if (user.whatsapp) sendWhatsApp(user.whatsapp, message);
    }
  } catch (err: any) {
    console.error('[WhatsApp] sendToAllUsers error:', err.message);
  }
}

export function buildAdminMessage(type: string, data: Record<string, string | undefined>): string {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jocars.com';
  const templates: Record<string, string> = {
    new_report: `🚩 *JO Cars - بلاغ جديد*\n\nمن: ${data.reporterName || 'مستخدم'}\nالسبب: ${data.reason || ''}\nالسيارة: ${data.carTitle || ''}\n\n👇 للمشاهدة:\n${siteUrl}/admin/reports`,
    new_ticket: `🎫 *JO Cars - تذكرة دعم جديدة*\n\nمن: ${data.userName || 'مستخدم'}\nالعنوان: ${data.subject || ''}\nالقسم: ${data.category || ''}\nالأولوية: ${data.priority || ''}\n\n👇 للمشاهدة:\n${siteUrl}/admin/tickets`,
  };
  return templates[type] || '';
}

export function buildUserMessage(type: string, data: Record<string, string | number | undefined>): string {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jocars.com';
  const templates: Record<string, string> = {
    ticket_reply: `📩 *JO Cars - رد على التذكرة*\n\nتذكرة: ${data.subject || ''}\nالرد: ${data.replyPreview || ''}\n\n👇 للمتابعة:\n${siteUrl}/tickets/${data.ticketId || ''}`,
    car_featured: `⭐ *JO Cars - إعلان مميز*\n\nتم تمييز إعلانك:\n${data.carTitle || ''}\n\n👇 للمشاهدة:\n${siteUrl}/cars/${data.carSlug || ''}`,
    badge_assigned: `🏅 *JO Cars - شارة جديدة*\n\nتم إضافة شارة لك:\n${data.badgeName || ''}\n\nمن قبل إدارة JO Cars 🎉`,
    user_banned: `🚫 *JO Cars - تعليق الحساب*\n\nتم تعليق حسابك.\nالسبب: ${data.reason || 'مخالفة الشروط'}\nتاريخ انتهاء التعليق: ${data.banUntil || 'غير محدد'}\n\nللتواصل مع الإدارة: ${siteUrl}/tickets`,
    user_unbanned: `✅ *JO Cars - إعادة تفعيل الحساب*\n\nتم إعادة تفعيل حسابك. يمكنك استخدام الموقع كالمعتاد 🎉`,
    user_suspended: `⛔ *JO Cars - إيقاف النشر*\n\nتم إيقاف صلاحية النشر لحسابك.\nللتواصل مع الإدارة: ${siteUrl}/tickets`,
    user_activated: `✅ *JO Cars - تفعيل النشر*\n\nتم تفعيل صلاحية النشر لحسابك. يمكنك إضافة إعلانات جديدة 🚗`,
    user_deleted: `🗑️ *JO Cars - حذف الحساب*\n\nتم حذف حسابك من الموقع.\nإذا كان هناك خطأ، تواصل مع الإدارة: ${siteUrl}/tickets`,
    new_forum_category: `📢 *JO Cars - منتدى جديد*\n\nتم إضافة قسم جديد في المنتدى:\n${data.categoryName || ''}\n\n👇 للمشاهدة:\n${siteUrl}/forum`,
  };
  return templates[type] || '';
}
