import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

const MODELS = [
  'user', 'car', 'carImage', 'carTag', 'carTagAssignment', 'favorite',
  'message', 'conversation', 'report', 'notification', 'subscription',
  'savedSearch', 'carView', 'carLog', 'priceAlert', 'userRating',
  'usedPart', 'forumCategory', 'forumTopic', 'forumPost', 'forumPostReport',
  'auction', 'bid', 'carHistory', 'premiumRequest', 'auditLog',
  'ticket', 'ticketMessage', 'plate', 'article', 'wantedAd', 'wantedOffer',
  'carComment', 'carCommentReport', 'maintenanceService', 'carReminder',
  'userGarage', 'carExpense', 'carSoundRecording', 'soundReport', 'soundBan',
  'siteSettings', 'brand', 'model', 'city', 'province', 'carReminder',
];

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const counts: Record<string, number> = {};
    let totalRecords = 0;

    for (const modelName of MODELS) {
      try {
        const model = (prisma as any)[modelName];
        if (model && typeof model.count === 'function') {
          const count = await model.count();
          counts[modelName] = count;
          totalRecords += count;
        }
      } catch {}
    }

    const tables = Object.keys(counts).length;

    return successResponse({
      tables,
      totalRecords,
      counts,
      backups: [],
    });
  } catch (error) {
    return errorResponse('فشل تحميل إحصائيات قاعدة البيانات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'export') {
      const exportData: Record<string, any> = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        tables: {},
      };

      for (const modelName of MODELS) {
        try {
          const model = (prisma as any)[modelName];
          if (model && typeof model.findMany === 'function') {
            const records = await model.findMany({ take: 10000 });
            if (records.length > 0) {
              exportData.tables[modelName] = records;
            }
          }
        } catch {}
      }

      const jsonStr = JSON.stringify(exportData, null, 2);
      const sizeBytes = Buffer.byteLength(jsonStr, 'utf-8');
      const sizeFormatted = sizeBytes < 1024 * 1024
        ? `${(sizeBytes / 1024).toFixed(1)} KB`
        : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

      return new NextResponse(jsonStr, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="jocars-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    }

    if (action === 'import') {
      const { data } = body;
      if (!data || !data.tables) return errorResponse('بيانات غير صالحة');

      let imported = 0;
      const errors: string[] = [];

      for (const [modelName, records] of Object.entries(data.tables)) {
        try {
          const model = (prisma as any)[modelName];
          if (model && Array.isArray(records) && records.length > 0) {
            for (const record of records) {
              try {
                await model.upsert({
                  where: { id: record.id || 'non-existent' },
                  update: record,
                  create: record,
                });
                imported++;
              } catch {
                try {
                  await model.create({ data: record });
                  imported++;
                } catch {
                  errors.push(modelName);
                }
              }
            }
          }
        } catch {
          errors.push(modelName);
        }
      }

      return successResponse({
        message: `تم استيراد ${imported} سجل${errors.length > 0 ? ` (${errors.length} جدول به أخطاء)` : ''}`,
        imported,
        errors,
      });
    }

    return errorResponse('إجراء غير معروف');
  } catch (error) {
    return errorResponse('فشل تنفيذ العملية: ' + (error as Error).message, 500);
  }
}
