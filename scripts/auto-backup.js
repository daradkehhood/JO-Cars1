const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'prisma', 'dev.db');
const BACKUPS_DIR = path.join(ROOT, 'backups');
const ENV_PATH = path.join(ROOT, '.env');

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const content = fs.readFileSync(ENV_PATH, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  });
  return env;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function sendEmail(backupPath, backupName, env) {
  const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: env.EMAIL_USER || 'daradkehhood@gmail.com',
      pass: env.EMAIL_PASS,
    },
  });

  const stats = fs.statSync(backupPath);
  const dbStats = fs.statSync(DB_PATH);

  await transporter.sendMail({
    from: `"JO Cars Backup" <${env.EMAIL_USER || 'daradkehhood@gmail.com'}>`,
    to: 'daradkehhood@gmail.com',
    subject: `📦 نسخة احتياطية - ${backupName}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7c3aed, #6366f1); padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">JO Cars</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">نسخة احتياطية تلقائية</p>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; background: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">تم إنشاء نسخة احتياطية لقاعدة البيانات بنجاح ✅</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">اسم الملف</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: bold;" dir="ltr">${backupName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">حجم النسخة</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: bold;">${formatSize(stats.size)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">حجم القاعدة الحالية</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: bold;">${formatSize(dbStats.size)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">التاريخ</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: bold;">${new Date().toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
          </table>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            هذه رسالة تلقائية من نظام النسخ الاحتياطي لـ JO Cars
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: backupName,
        path: backupPath,
      },
    ],
  });
}

async function main() {
  console.log(`[${new Date().toISOString()}] بدء النسخة الاحتياطية التلقائية...`);

  const env = loadEnv();

  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ قاعدة البيانات غير موجودة:', DB_PATH);
    process.exit(1);
  }

  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
  const backupName = `auto-backup-${timestamp}.db`;
  const backupPath = path.join(BACKUPS_DIR, backupName);

  fs.copyFileSync(DB_PATH, backupPath);
  const stats = fs.statSync(backupPath);
  console.log(`✅ تم إنشاء النسخة: ${backupName} (${formatSize(stats.size)})`);

  if (env.EMAIL_PASS) {
    try {
      console.log('📧 جاري إرسال الإيميل...');
      await sendEmail(backupPath, backupName, env);
      console.log('✅ تم إرسال الإيميل بنجاح');
    } catch (err) {
      console.error('❌ فشل إرسال الإيميل:', err.message);
    }
  } else {
    console.log('⚠️ لم يتم تعيين EMAIL_PASS في .env — تم حفظ النسخة محلياً فقط');
  }

  const backups = fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.startsWith('auto-backup-'))
    .map(f => ({ name: f, time: fs.statSync(path.join(BACKUPS_DIR, f)).birthtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  if (backups.length > 10) {
    const toDelete = backups.slice(10);
    toDelete.forEach(f => {
      fs.unlinkSync(path.join(BACKUPS_DIR, f.name));
      console.log(`🗑️ حذف نسخة قديمة: ${f.name}`);
    });
  }

  console.log(`[${new Date().toISOString()}] انتهى بنجاح ✅`);
}

main().catch(err => {
  console.error('❌ خطأ عام:', err);
  process.exit(1);
});
