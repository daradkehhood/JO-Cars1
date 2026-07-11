import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { sendWhatsApp, buildCarMessage } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
      include: {
        car: { select: { id: true, slug: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } } },
        buyer: { select: { id: true, name: true, image: true } },
        seller: { select: { id: true, name: true, image: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result = conversations.map((c) => {
      const lastMsg = c.messages[0] || null;
      const unreadCount = 0;
      return { ...c, lastMessage: lastMsg, unreadCount };
    });

    const enriched = await Promise.all(
      result.map(async (c) => {
        const count = await prisma.message.count({
          where: { conversationId: c.id, read: false, receiverId: user.id },
        });
        return { ...c, unreadCount: count };
      })
    );

    return successResponse(enriched);
  } catch (error) {
    return errorResponse('فشل تحميل المحادثات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { carId, sellerId, content } = body;

    if (!carId || !sellerId) {
      return errorResponse('معرّف السيارة والبائع مطلوبان');
    }

    if (user.id === sellerId) {
      return errorResponse('لا يمكنك مراسلة نفسك');
    }

    let conversation = await prisma.conversation.findUnique({
      where: { carId_buyerId_sellerId: { carId, buyerId: user.id, sellerId } },
      include: {
        car: { select: { id: true, slug: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } } },
        buyer: { select: { id: true, name: true, image: true } },
        seller: { select: { id: true, name: true, image: true } },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { carId, buyerId: user.id, sellerId },
        include: {
          car: { select: { id: true, slug: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } } },
          buyer: { select: { id: true, name: true, image: true } },
          seller: { select: { id: true, name: true, image: true } },
        },
      });
    }

    if (content && content.trim()) {
      const message = await prisma.message.create({
        data: {
          content: content.trim(),
          senderId: user.id,
          receiverId: sellerId,
          carId,
          conversationId: conversation.id,
        },
        include: {
          sender: { select: { id: true, name: true, image: true } },
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      await prisma.notification.create({
        data: {
          type: 'NEW_MESSAGE',
          title: 'رسالة جديدة',
          message: `رسالة جديدة من ${user.name} بخصوص ${conversation.car?.slug || 'سيارة'}`,
          userId: sellerId,
          link: `/messages?conversationId=${conversation.id}`,
        },
      });

      const seller = await prisma.user.findUnique({
        where: { id: sellerId },
        select: { whatsapp: true, whatsappNotifications: true },
      });

      if (seller?.whatsapp && seller?.whatsappNotifications) {
        const car = await prisma.car.findUnique({
          where: { id: carId },
          select: { price: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } }, year: true },
        });

        const carTitle = car ? `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}` : '';

        sendWhatsApp(seller.whatsapp, buildCarMessage('new_conversation', {
          senderName: user.name,
          carTitle,
          carPrice: car?.price,
          messagePreview: content?.slice(0, 100),
        }));
      }

      return successResponse({ conversation, message }, 201);
    }

    return successResponse({ conversation, message: null });
  } catch (error) {
    return errorResponse('فشل إنشاء المحادثة', 500);
  }
}
