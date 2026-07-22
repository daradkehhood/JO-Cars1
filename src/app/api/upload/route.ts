import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { authenticateRequest } from '@/lib/auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET &&
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME !== 'your-cloud-name'
  );
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`upload:${ip}`, RATE_LIMITS.UPLOAD);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'تم تجاوز الحد المسموح' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم رفع الملف' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ success: false, error: 'نوع الملف غير مدعوم' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, error: 'نوع الملف غير صالح' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'حجم الملف يتجاوز 5 ميجابايت' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Preferred: Cloudinary (persistent across deploys, CDN-served)
    if (isCloudinaryConfigured()) {
      const { uploadImage } = await import('@/lib/cloudinary');
      const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;
      const folder = user.role === 'DEALER' ? 'jo-cars/dealers' : 'jo-cars/users';
      const result = await uploadImage(dataUri, { folder });
      return NextResponse.json({ success: true, data: { url: result.secure_url, provider: 'cloudinary' } });
    }

    // Fallback: store as base64 data URI in database (persistent across deploys)
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;
    return NextResponse.json({ success: true, data: { url: dataUri, provider: 'data-uri' } });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ success: false, error: 'فشل رفع الملف' }, { status: 500 });
  }
}
