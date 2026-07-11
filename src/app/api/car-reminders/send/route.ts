import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    const token = process.env.ULTRA_MSG_TOKEN;
    const instance = process.env.ULTRA_MSG_INSTANCE;
    if (!token || !instance) return false;

    const res = await fetch(`https://api.ultramsg.com/${instance}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token, to: phone, body: message }),
    });
    const data = await res.json();
    return data.sent === true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const now = new Date();
    const reminders = await prisma.carReminder.findMany({
      where: {
        isActive: true,
        isCompleted: false,
        isNotified: false,
        dueDate: { lte: now },
      },
      include: { user: { select: { name: true, phone: true, whatsapp: true } } },
    });

    let sentCount = 0;
    for (const reminder of reminders) {
      const phone = reminder.whatsapp || reminder.user.whatsapp || reminder.user.phone;
      if (!phone) continue;

      const carInfo = reminder.carBrand ? `${reminder.carBrand} ${reminder.carModel || ''} ${reminder.carYear || ''}`.trim() : '';
      const message = `🚗 تذكير.by JO Cars\n\nمرحباً ${reminder.user.name}!\n\n${reminder.title}\n${carInfo ? `السيارة: ${carInfo}\n` : ''}${reminder.plateNumber ? `رقم اللوحة: ${reminder.plateNumber}\n` : ''}التاريخ: ${reminder.dueDate.toLocaleDateString('ar-JO')}\n\n${reminder.description || ''}\n\nلا تنسَ تسجيل الموعد!`;

      const sent = await sendWhatsApp(phone, message);
      if (sent) {
        await prisma.carReminder.update({ where: { id: reminder.id }, data: { isNotified: true } });
        sentCount++;
      }
    }

    return successResponse({ sent: sentCount, total: reminders.length });
  } catch {
    return errorResponse('فشل إرسال التذكيرات', 500);
  }
}
