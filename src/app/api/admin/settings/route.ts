import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: 'default',
          siteName: 'JO Cars',
          siteNameAr: 'سوق السيارات',
          metaDescription: 'أكبر سوق لبيع وشراء السيارات في الأردن',
          metaKeywords: 'سيارات,بيع,شراء,الأردن',
          contactEmail: 'admin@jocars.com',
          contactPhone: '0790000000',
          fuelTypes: '["PETROL","DIESEL","HYBRID","ELECTRIC","PLUGIN_HYBRID"]',
          bodyTypes: '["SUV","SEDAN","HATCHBACK","COUPE","CONVERTIBLE","WAGON","PICKUP","VAN","MINIVAN","CROSSOVER","SPORTS","LUXURY"]',
        },
      });
    }
    return successResponse(settings);
  } catch {
    return errorResponse('فشل تحميل الإعدادات', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const data: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      if (key === 'logo' || key === 'logoDark' || key === 'favicon') {
        if (value instanceof File && value.size > 0) {
          const ext = value.name.split('.').pop() || 'png';
          const filename = `${key}-${Date.now()}.${ext}`;
          const dir = path.join(process.cwd(), 'public', 'uploads', 'settings');
          await mkdir(dir, { recursive: true });
          const bytes = await value.arrayBuffer();
          await writeFile(path.join(dir, filename), Buffer.from(bytes));
          data[key] = `/uploads/settings/${filename}`;
        }
      } else if (value !== 'undefined' && value !== 'null') {
        data[key] = value;
      }
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data } as any,
    });

    return successResponse(settings);
  } catch (error) {
    console.error('Settings update error:', error);
    return errorResponse('فشل تحديث الإعدادات', 500);
  }
}
