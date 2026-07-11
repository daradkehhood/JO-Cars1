import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import fs from 'fs';
import path from 'path';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');
const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.db') || f.endsWith('.sqlite') || f.endsWith('.backup'))
      .map(f => {
        const stats = fs.statSync(path.join(BACKUPS_DIR, f));
        return {
          name: f,
          size: stats.size,
          sizeFormatted: formatSize(stats.size),
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const dbStats = fs.statSync(DB_PATH);
    const currentDb = {
      size: dbStats.size,
      sizeFormatted: formatSize(dbStats.size),
      modifiedAt: dbStats.mtime.toISOString(),
      path: DB_PATH,
    };

    return successResponse({ backups: files, currentDb });
  } catch (error) {
    return errorResponse('فشل تحميل قائمة النسخ الاحتياطية', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;

    if (action === 'export') {
      if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
      const backupName = `backup-${timestamp}.db`;
      const backupPath = path.join(BACKUPS_DIR, backupName);

      fs.copyFileSync(DB_PATH, backupPath);

      const stats = fs.statSync(backupPath);
      return successResponse({
        name: backupName,
        size: stats.size,
        sizeFormatted: formatSize(stats.size),
        createdAt: stats.birthtime.toISOString(),
        message: 'تم إنشاء النسخة الاحتياطية بنجاح',
      });
    }

    if (action === 'import') {
      const file = formData.get('file') as File | null;
      if (!file) return errorResponse('الرجاء رفع ملف النسخة الاحتياطية');

      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.length === 0) return errorResponse('الملف فارغ');

      const uploadPath = path.join(BACKUPS_DIR, `upload-${Date.now()}.db`);
      fs.writeFileSync(uploadPath, buffer);

      const autoBackupName = `pre-import-${Date.now()}.db`;
      const autoBackupPath = path.join(BACKUPS_DIR, autoBackupName);
      fs.copyFileSync(DB_PATH, autoBackupPath);

      await prisma.$disconnect();
      fs.copyFileSync(uploadPath, DB_PATH);

      try { fs.unlinkSync(uploadPath); } catch {}

      return successResponse({
        message: 'تم استيراد قاعدة البيانات بنجاح. قد تحتاج إعادة تشغيل الخادم.',
        autoBackup: autoBackupName,
      });
    }

    return errorResponse('إجراء غير معروف');
  } catch (error) {
    return errorResponse('فشل تنفيذ العملية', 500);
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
