import prisma from '@/lib/prisma';

export async function notifyAdmins(type: string, title: string, message: string, link?: string) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: admins.map(admin => ({
        type,
        title,
        message,
        userId: admin.id,
        link: link || null,
      })),
    });
  } catch (err) {
    console.error('Admin notification error:', err);
  }
}

export function getAdminNotifyLink(type: string, id?: string): string {
  switch (type) {
    case 'NEW_REPORT': return `/admin/reports`;
    case 'NEW_USER': return `/admin/users`;
    case 'NEW_MESSAGE': return `/admin/messages`;
    case 'NEW_CAR': return `/admin/cars`;
    case 'NEW_TICKET': return `/admin/tickets`;
    default: return '/admin';
  }
}
