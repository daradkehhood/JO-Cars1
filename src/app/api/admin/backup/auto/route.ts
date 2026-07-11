import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');
const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
    const backupName = `auto-backup-${timestamp}.db`;
    const backupPath = path.join(BACKUPS_DIR, backupName);

    fs.copyFileSync(DB_PATH, backupPath);
    const stats = fs.statSync(backupPath);
    const sizeFormatted = formatSize(stats.size);

    let emailSent = false;
    let emailError: string | null = null;

    const emailPass = process.env.EMAIL_PASS;
    const emailUser = process.env.EMAIL_USER || 'daradkehhood@gmail.com';

    if (emailPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: false,
          auth: { user: emailUser, pass: emailPass },
        });

        const dbStats = fs.statSync(DB_PATH);

        await transporter.sendMail({
          from: `"JO Cars Backup" <${emailUser}>`,
          to: 'daradkehhood@gmail.com',
          subject: `📦 نسخة احتياطية - ${backupName}`,
          html: `
            <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:linear-gradient(135deg,#7c3aed,#6366f1);padding:20px;text-align:center;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:24px">JO Cars</h1>
                <p style="color:rgba(255,255,255,0.8);margin:5px 0 0">نسخة احتياطية تلقائية</p>
              </div>
              <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;background:#f9fafb">
                <p style="font-size:16px;color:#374151">تم إنشاء نسخة احتياطية لقاعدة البيانات بنجاح ✅</p>
                <table style="width:100%;border-collapse:collapse;margin:15px 0">
                  <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px">اسم الملف</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:bold" dir="ltr">${backupName}</td></tr>
                  <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px">حجم النسخة</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:bold">${sizeFormatted}</td></tr>
                  <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px">حجم القاعدة الحالية</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:bold">${formatSize(dbStats.size)}</td></tr>
                  <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px">التاريخ</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:bold">${now.toLocaleDateString('ar-JO', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}</td></tr>
                </table>
                <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px">هذه رسالة تلقائية من نظام النسخ الاحتياطي لـ JO Cars</p>
              </div>
            </div>
          `,
          attachments: [{ filename: backupName, path: backupPath }],
        });
        emailSent = true;
      } catch (err: any) {
        emailError = err.message;
      }
    }

    const backups = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('auto-backup-'))
      .map(f => ({ name: f, time: fs.statSync(path.join(BACKUPS_DIR, f)).birthtimeMs }))
      .sort((a, b) => b.time - a.time);

    let deleted: string[] = [];
    if (backups.length > 10) {
      const toDelete = backups.slice(10);
      toDelete.forEach(f => {
        fs.unlinkSync(path.join(BACKUPS_DIR, f.name));
        deleted.push(f.name);
      });
    }

    return successResponse({
      name: backupName,
      size: stats.size,
      sizeFormatted,
      createdAt: stats.birthtime.toISOString(),
      emailSent,
      emailError,
      message: emailSent
        ? 'تم إنشاء النسخة وإرسالها إلى البريد الإلكتروني'
        : emailPass
          ? `تم إنشاء النسخة ولكن فشل إرسال الإيميل: ${emailError}`
          : 'تم إنشاء النسخة محلياً',
      autoDeleted: deleted.length > 0 ? deleted : null,
    });
  } catch (error) {
    return errorResponse('فشل إنشاء النسخة الاحتياطية', 500);
  }
}
