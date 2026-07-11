import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const PART_TYPES = ['engine', 'transmission', 'body', 'electrical', 'suspension', 'brake', 'cooling', 'exhaust', 'interior', 'wheel', 'turbo', 'ac', 'other'];
const PART_TYPES_AR = ['محرك', 'جير', 'هيكل', 'كهرباء', 'تعليق', 'فرامل', 'تبريد', 'عادم', 'داخلي', 'جنط', 'توربو', 'مكيف', 'أخرى'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24')));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: 'APPROVED', deletedAt: null };

  if (searchParams.get('search')) {
    const q = searchParams.get('search') || '';
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { partNumber: { contains: q } },
    ];
  }
  if (searchParams.get('partType')) where.partType = searchParams.get('partType');
  if (searchParams.get('brandId')) where.brandId = searchParams.get('brandId');
  if (searchParams.get('cityId')) where.cityId = searchParams.get('cityId');
  if (searchParams.get('condition')) where.condition = searchParams.get('condition');

  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  if (priceMin || priceMax) {
    where.price = {};
    if (priceMin) (where.price as Record<string, number>).gte = parseInt(priceMin);
    if (priceMax) (where.price as Record<string, number>).lte = parseInt(priceMax);
  }

  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  try {
    const [parts, total] = await Promise.all([
      prisma.usedPart.findMany({
        where: where as any,
        orderBy: { [sortBy]: sortOrder },
        skip, take: limit,
        include: {
          user: { select: { id: true, name: true, dealerName: true, rating: true, ratingCount: true } },
          brand: { select: { id: true, nameAr: true, nameEn: true, logo: true } },
          city: { select: { id: true, nameAr: true, nameEn: true } },
        },
      }),
      prisma.usedPart.count({ where: where as any }),
    ]);

    return NextResponse.json({
      success: true,
      data: parts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: skip + parts.length < total },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'فشل تحميل القطع' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.canPost === false) return NextResponse.json({ error: 'تم إيقاف النشر لحسابك' }, { status: 403 });

  try {
    const formData = await request.formData();
    const uploadedFiles = formData.getAll('images') as File[];
    const data: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      if (key !== 'images') data[key] = value;
    }

    data.price = parseFloat(data.price as string);
    data.quantity = parseInt((data.quantity as string) || '1');
    data.isNegotiable = data.isNegotiable === 'true';

    if (!data.title || !data.partType || !data.price || !data.phone) {
      return NextResponse.json({ error: 'العنوان، النوع، السعر، والهاتف مطلوب' }, { status: 400 });
    }

    const saveFile = async (file: File) => {
      const bytes = await file.arrayBuffer();
      if (!bytes || bytes.byteLength === 0) return null;
      const buffer = Buffer.from(bytes);
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `part-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const dir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, filename), buffer);
      return `/uploads/${filename}`;
    };

    const urls: string[] = [];
    for (const img of uploadedFiles) {
      const url = await saveFile(img);
      if (url) urls.push(url);
    }

    const slug = `part-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const part = await prisma.usedPart.create({
      data: {
        title: data.title as string,
        slug,
        description: (data.description as string) || null,
        partType: data.partType as string,
        brandId: (data.brandId as string) || null,
        partNumber: (data.partNumber as string) || null,
        condition: (data.condition as string) || 'USED',
        price: data.price as number,
        currency: (data.currency as string) || 'JOD',
        quantity: data.quantity as number,
        phone: data.phone as string,
        whatsapp: (data.whatsapp as string) || null,
        cityId: (data.cityId as string) || null,
        isNegotiable: data.isNegotiable as boolean,
        status: 'PENDING',
        userId: user.id,
        images: JSON.stringify(urls),
        coverImage: urls[0] || null,
      },
      include: {
        user: { select: { id: true, name: true, dealerName: true } },
        brand: { select: { id: true, nameAr: true, nameEn: true } },
        city: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    return NextResponse.json({ success: true, data: part }, { status: 201 });
  } catch (error) {
    console.error('Part create error:', error);
    return NextResponse.json({ success: false, error: 'فشل إضافة القطعة' }, { status: 500 });
  }
}
