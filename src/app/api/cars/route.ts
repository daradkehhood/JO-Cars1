import { NextRequest, NextResponse } from 'next/server';
import prisma, { getCached, invalidateCache } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { carSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';
import { generateSlug } from '@/lib/utils';
import { generateRefCode } from '@/lib/generate-refcode';
import { uploadMultipleImages, uploadImage } from '@/lib/cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: 'APPROVED', deletedAt: null };
  if (searchParams.get('showSold') === 'true') delete where.status;

  if (searchParams.get('featured') === 'true') where.featured = true;
  if (searchParams.get('isNew') === 'true') where.isNew = true;
  if (searchParams.get('search') || searchParams.get('query')) {
    const q = searchParams.get('search') || searchParams.get('query') || '';
    const normalized = q.trim().toUpperCase().replace(/[\s-]+/g, '');
    const refCodePattern = /^[A-Z0-9]{6,7}$/;
    if (refCodePattern.test(normalized)) {
      const cleanCode = normalized.length === 6 ? normalized.slice(0, 3) + '-' + normalized.slice(3) : normalized;
      where.refCode = cleanCode;
    } else {
      where.OR = [
        { description: { contains: q } },
        { brand: { nameAr: { contains: q } } },
        { brand: { nameEn: { contains: q } } },
        { model: { nameAr: { contains: q } } },
        { model: { nameEn: { contains: q } } },
      ];
    }
  }
  if (searchParams.get('brandId')) where.brandId = searchParams.get('brandId');
  if (searchParams.get('modelId')) where.modelId = searchParams.get('modelId');
  if (searchParams.get('cityId')) where.cityId = searchParams.get('cityId');
  if (searchParams.get('fuelType')) where.fuelType = searchParams.get('fuelType');
  if (searchParams.get('transmission')) where.transmission = searchParams.get('transmission');
  if (searchParams.get('condition')) where.condition = searchParams.get('condition');
  if (searchParams.get('bodyType')) where.bodyType = searchParams.get('bodyType');
  if (searchParams.get('drivetrain')) where.drivetrain = searchParams.get('drivetrain');
  if (searchParams.get('color')) where.color = searchParams.get('color');

  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  if (priceMin || priceMax) {
    where.price = {};
    if (priceMin) (where.price as Record<string, number>).gte = parseInt(priceMin);
    if (priceMax) (where.price as Record<string, number>).lte = parseInt(priceMax);
  }

  const yearMin = searchParams.get('yearMin');
  const yearMax = searchParams.get('yearMax');
  if (yearMin || yearMax) {
    where.year = {};
    if (yearMin) (where.year as Record<string, number>).gte = parseInt(yearMin);
    if (yearMax) (where.year as Record<string, number>).lte = parseInt(yearMax);
  }

  const kmMin = searchParams.get('kilometersMin');
  const kmMax = searchParams.get('kilometersMax');
  if (kmMin || kmMax) {
    where.kilometers = {};
    if (kmMin) (where.kilometers as Record<string, number>).gte = parseInt(kmMin);
    if (kmMax) (where.kilometers as Record<string, number>).lte = parseInt(kmMax);
  }

  if (searchParams.get('exclude')) {
    where.id = { not: searchParams.get('exclude') };
  }

  const orderBy: Record<string, string> = {};
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  orderBy[sortBy] = sortOrder;

  const user = await authenticateRequest(request).catch(() => null);

  const cacheKey = `cars:${JSON.stringify({ where, skip, limit, orderBy: { featured: 'desc', ...orderBy } })}`;

  try {
    if (!user) {
      const cached = await getCached(cacheKey, async () => {
        const [cars, total] = await Promise.all([
          prisma.car.findMany({
            where: where as any,
            orderBy: [{ featured: 'desc' }, orderBy as any],
            skip,
            take: limit,
            include: {
              brand: { select: { id: true, nameAr: true, nameEn: true, slug: true, logo: true } },
              model: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
              city: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
              images: { select: { id: true, url: true, thumbnail: true, isCover: true, order: true }, orderBy: { order: 'asc' }, take: 1 },
              user: { select: { id: true, name: true, dealerName: true, dealerLogo: true, rating: true, badges: true } },
              auction: { select: { id: true, currentPrice: true, status: true, endDate: true, _count: { select: { bids: true } } } },
            },
          }),
          prisma.car.count({ where: where as any }),
        ]);
        return { data: cars, total };
      }, 15000);
      return NextResponse.json({
        success: true,
        data: cached.data,
        pagination: {
          page, limit, total: cached.total,
          totalPages: Math.ceil(cached.total / limit),
          hasMore: skip + cached.data.length < cached.total,
        },
      });
    }

    let favoriteCarIds: Set<string> = new Set();
    if (user) {
      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id },
        select: { carId: true },
      });
      favoriteCarIds = new Set(favorites.map(f => f.carId));
    }

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where: where as any,
        orderBy: [{ featured: 'desc' }, orderBy as any],
        skip,
        take: limit,
        include: {
          brand: { select: { id: true, nameAr: true, nameEn: true, slug: true, logo: true } },
          model: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
          city: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
          images: { select: { id: true, url: true, thumbnail: true, isCover: true, order: true }, orderBy: { order: 'asc' }, take: 1 },
          user: { select: { id: true, name: true, dealerName: true, dealerLogo: true, rating: true, badges: true } },
          auction: { select: { id: true, currentPrice: true, status: true, endDate: true, _count: { select: { bids: true } } } },
        },
      }),
      prisma.car.count({ where: where as any }),
    ]);

    const data = cars.map(car => ({
      ...car,
      isFavorited: favoriteCarIds.has(car.id),
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + cars.length < total,
      },
    });
  } catch (error) {
    console.error('Cars fetch error:', error);
    return errorResponse('فشل تحميل السيارات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();
  if (user.canPost === false) return errorResponse('تم إيقاف النشر لحسابك', 403);
  if (user.banStatus) return errorResponse('حسابك محظور', 403);

  try {
    const formData = await request.formData();

    const uploadedFiles = formData.getAll('images') as File[];
    const coverFile = formData.get('coverImage') as File | null;

    const data: Record<string, unknown> = {};
    let conditionDetailsStr: string | null = null;
    for (const [key, value] of formData.entries()) {
      if (key === 'conditionDetails') { conditionDetailsStr = value as string; continue; }
      if (key !== 'images' && key !== 'coverImage' && key !== 'video') {
        data[key] = value;
      }
    }

    data.year = parseInt(data.year as string);
    data.kilometers = parseInt(data.kilometers as string);
    data.price = parseFloat(data.price as string);
    data.doors = parseInt((data.doors as string) || '4');
    data.ownerCount = parseInt((data.ownerCount as string) || '1');
    if (data.engineCapacity) data.engineCapacity = parseFloat(data.engineCapacity as string);
    if (data.cylinders) data.cylinders = parseInt(data.cylinders as string);
    data.isNegotiable = data.isNegotiable === 'true';
    data.hasWarranty = data.hasWarranty === 'true';
    data.hasServiceHistory = data.hasServiceHistory === 'true';
    data.isDamaged = data.isDamaged === 'true';
    data.isPaintOriginal = data.isPaintOriginal !== 'false';
    if (data.locationLat) data.locationLat = parseFloat(data.locationLat as string);
    if (data.locationLng) data.locationLng = parseFloat(data.locationLng as string);
    if (data.videoUrl === '') delete data.videoUrl;

    const validation = carSchema.safeParse(data);
    if (!validation.success) return validationErrorResponse(validation.error);

    const hasCloudinary = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your-api-key';
    let uploadedImages: { url: string }[] = [];
    let coverUrl: string | undefined;

    if (hasCloudinary) {
      if (uploadedFiles.length > 0) {
        const buffers = await Promise.all(uploadedFiles.map(img => img.arrayBuffer()));
        const base64s = buffers.map(buf => Buffer.from(buf).toString('base64'));
        uploadedImages = await uploadMultipleImages(base64s, 'jo-cars/cars');
      }
      if (coverFile) {
        const buffer = await coverFile.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const result = await uploadImage(base64, { folder: 'jo-cars/covers' });
        coverUrl = result.secure_url;
      }
    } else {
      const saveLocalFile = async (file: File) => {
        const bytes = await file.arrayBuffer();
        if (!bytes || bytes.byteLength === 0) throw new Error('Empty file');
        const buffer = Buffer.from(bytes);
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const dir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(dir, { recursive: true });
        const filePath = path.join(dir, filename);
        await writeFile(filePath, buffer);
        return `/uploads/${filename}`;
      };
      for (const img of uploadedFiles) {
        const url = await saveLocalFile(img);
        uploadedImages.push({ url });
      }
      if (coverFile) coverUrl = await saveLocalFile(coverFile);
    }

    const slug = generateSlug(data.brandId as string, data.modelId as string, data.year as number, Date.now().toString());
    const refCode = await generateRefCode();

    const car = await prisma.car.create({
      data: {
        ...validation.data,
        conditionDetails: conditionDetailsStr,
        slug,
        refCode,
        status: 'PENDING',
        userId: user.id,
        coverImage: coverUrl || null,
        images: uploadedImages.length > 0 ? {
          create: uploadedImages.map((img, i) => ({
            url: img.url,
            isCover: i === 0,
            order: i,
          })),
        } : undefined,
      },
      include: {
        brand: true, model: true, city: true, images: true,
      },
    });

    invalidateCache('cars');

    await prisma.notification.create({
      data: {
        type: 'NEW_CAR',
        title: 'إعلان جديد قيد المراجعة',
        message: `تم إضافة إعلان جديد: ${car.brand?.nameAr} ${car.model?.nameAr} ${car.year}`,
        userId: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id || '',
        link: `/admin/cars`,
      },
    }).catch(() => {});

    return successResponse(car, 201);
  } catch (error) {
    console.error('Car create error:', error);
    return errorResponse('فشل إضافة السيارة', 500);
  }
}
