/**
 * Realistic Car Seed Script
 *
 * Adds 10+ realistic Jordanian-market car listings with proper Arabic text
 * (UTF-8). Run after `prisma db push` against any environment:
 *
 *   npx tsx prisma/seed-cars.ts
 *
 * Make sure DATABASE_URL is set to the target database. The script
 * UPSERTS on `slug` so it's safe to run multiple times.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateRefCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part(3)}-${part(3)}`;
}

function generateSlug(brand: string, model: string, year: number, ts: number): string {
  return `${brand.toLowerCase()}-${model.toLowerCase()}-${year}-${ts}`;
}

async function getOrCreateModel(brandId: string, brandSlug: string, nameAr: string, nameEn: string) {
  const slug = `${brandSlug}-${nameEn.toLowerCase().replace(/\s+/g, '-')}`;
  return prisma.carModel.upsert({
    where: { slug_brandId: { slug, brandId } },
    update: {},
    create: { nameAr, nameEn, slug, brandId },
  });
}

async function getOrCreateUser(name: string, email: string, role: 'USER' | 'DEALER' = 'USER') {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      // bcrypt hash of "Demo@123456" — login is not required for this seed
      password: '$2a$12$lA7PbXLttg3wZL3.tEKB1.Y9VSF77RWlsO2Bj9d3xr/J4zZ3qfMxi',
      role,
      isActive: true,
      phone: '+962791234567',
    },
  });
}

async function main() {
  console.log('🚗 إضافة سيارات واقعية للسوق الأردني...');

  // Ensure we have a demo seller
  const seller = await getOrCreateUser('بائع تجريبي', 'demo.seller@jocars.com', 'DEALER');

  // Pick the first few cities and brands the seeder already inserted
  const [amman, irbid, zarqa, aqaba] = await Promise.all([
    prisma.city.findUnique({ where: { slug: 'amman' } }),
    prisma.city.findUnique({ where: { slug: 'irbid' } }),
    prisma.city.findUnique({ where: { slug: 'zarqa' } }),
    prisma.city.findUnique({ where: { slug: 'aqaba' } }),
  ]);
  if (!amman || !irbid || !zarqa || !aqaba) {
    throw new Error('المدن غير موجودة. شغّل prisma/seed.ts أولاً.');
  }

  // Helper: load a brand by slug
  const brandBySlug = async (slug: string) => {
    const b = await prisma.brand.findUnique({ where: { slug } });
    if (!b) throw new Error(`البراند ${slug} غير موجود. شغّل prisma/seed.ts أولاً.`);
    return b;
  };

  const toyota = await brandBySlug('toyota');
  const hyundai = await brandBySlug('hyundai');
  const kia = await brandBySlug('kia');
  const mercedes = await brandBySlug('mercedes');
  const bmw = await brandBySlug('bmw');
  const nissan = await brandBySlug('nissan');
  const honda = await brandBySlug('honda');
  const mitsubishi = await brandBySlug('mitsubishi');

  // Ensure at least one model per brand
  await getOrCreateModel(toyota.id, 'toyota', 'كورولا', 'Corolla');
  await getOrCreateModel(toyota.id, 'toyota', 'كامري', 'Camry');
  await getOrCreateModel(hyundai.id, 'hyundai', 'أكسنت', 'Accent');
  await getOrCreateModel(hyundai.id, 'hyundai', 'توسان', 'Tucson');
  await getOrCreateModel(kia.id, 'kia', 'ريو', 'Rio');
  await getOrCreateModel(kia.id, 'kia', 'سبورتاج', 'Sportage');
  await getOrCreateModel(mercedes.id, 'mercedes', 'C-Class', 'C-Class');
  await getOrCreateModel(mercedes.id, 'mercedes', 'E-Class', 'E-Class');
  await getOrCreateModel(bmw.id, 'bmw', 'الفئة الخامسة', '5 Series');
  await getOrCreateModel(bmw.id, 'bmw', 'X5', 'X5');
  await getOrCreateModel(nissan.id, 'nissan', 'صني', 'Sunny');
  await getOrCreateModel(nissan.id, 'nissan', 'التيما', 'Altima');
  await getOrCreateModel(honda.id, 'honda', 'أكورد', 'Accord');
  await getOrCreateModel(honda.id, 'honda', 'سيفيك', 'Civic');
  await getOrCreateModel(mitsubishi.id, 'mitsubishi', 'لانسر', 'Lancer');

  const corolla = await prisma.carModel.findFirst({ where: { nameEn: 'Corolla', brandId: toyota.id } });
  const camry = await prisma.carModel.findFirst({ where: { nameEn: 'Camry', brandId: toyota.id } });
  const accent = await prisma.carModel.findFirst({ where: { nameEn: 'Accent', brandId: hyundai.id } });
  const tucson = await prisma.carModel.findFirst({ where: { nameEn: 'Tucson', brandId: hyundai.id } });
  const rio = await prisma.carModel.findFirst({ where: { nameEn: 'Rio', brandId: kia.id } });
  const sportage = await prisma.carModel.findFirst({ where: { nameEn: 'Sportage', brandId: kia.id } });
  const cClass = await prisma.carModel.findFirst({ where: { nameEn: 'C-Class', brandId: mercedes.id } });
  const eClass = await prisma.carModel.findFirst({ where: { nameEn: 'E-Class', brandId: mercedes.id } });
  const bmw5 = await prisma.carModel.findFirst({ where: { nameEn: '5 Series', brandId: bmw.id } });
  const bmwX5 = await prisma.carModel.findFirst({ where: { nameEn: 'X5', brandId: bmw.id } });
  const sunny = await prisma.carModel.findFirst({ where: { nameEn: 'Sunny', brandId: nissan.id } });
  const altima = await prisma.carModel.findFirst({ where: { nameEn: 'Altima', brandId: nissan.id } });
  const accord = await prisma.carModel.findFirst({ where: { nameEn: 'Accord', brandId: honda.id } });
  const civic = await prisma.carModel.findFirst({ where: { nameEn: 'Civic', brandId: honda.id } });
  const lancer = await prisma.carModel.findFirst({ where: { nameEn: 'Lancer', brandId: mitsubishi.id } });

  if (!corolla || !camry || !accent || !tucson || !rio || !sportage || !cClass || !eClass ||
      !bmw5 || !bmwX5 || !sunny || !altima || !accord || !civic || !lancer) {
    throw new Error('فشل تحميل الموديلات بعد إنشائها.');
  }

  const cars: Array<{
    brandId: string;
    modelId: string;
    year: number;
    trim: string;
    kilometers: number;
    fuelType: string;
    transmission: string;
    color: string;
    drivetrain: string;
    condition: string;
    bodyType: string;
    description: string;
    price: number;
    cityId: string;
    coverImage: string;
    featured: boolean;
    isNew: boolean;
  }> = [
    {
      brandId: toyota.id, modelId: corolla.id, year: 2020, trim: 'GLi',
      kilometers: 78000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'أبيض', drivetrain: 'FWD', condition: 'EXCELLENT', bodyType: 'SEDAN',
      description: 'تويوتا كورولا 2020 بحالة ممتازة، صيانة دورية منتظمة عند الوكالة، بدون حوادث، استخدام عائلي. السيارة جاهزة للفحص في أي وقت.',
      price: 12500, cityId: amman.id, coverImage: '/images/placeholder-car.svg', featured: true, isNew: false,
    },
    {
      brandId: toyota.id, modelId: camry.id, year: 2019, trim: 'GLE',
      kilometers: 95000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'أسود', drivetrain: 'FWD', condition: 'VERY_GOOD', bodyType: 'SEDAN',
      description: 'تويوتا كامري 2019 فل كامل، شاشة، كاميرا، فتحة سقف، جلد طبيعي. السيارة نظيفة جداً ومكيفة ممتازة.',
      price: 16800, cityId: amman.id, coverImage: '/images/placeholder-car.svg', featured: true, isNew: false,
    },
    {
      brandId: hyundai.id, modelId: accent.id, year: 2018, trim: 'Sedan',
      kilometers: 110000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'فضي', drivetrain: 'FWD', condition: 'GOOD', bodyType: 'SEDAN',
      description: 'هيونداي أكسنت 2018 اقتصادية في الوقود، مثالية للاستخدام اليومي. مكيف بارد، فرش نظيف، صيانة منتظمة.',
      price: 7800, cityId: zarqa.id, coverImage: '/images/placeholder-car.svg', featured: false, isNew: false,
    },
    {
      brandId: hyundai.id, modelId: tucson.id, year: 2021, trim: 'Smart Plus',
      kilometers: 45000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'رمادي', drivetrain: 'FWD', condition: 'EXCELLENT', bodyType: 'SUV',
      description: 'هيونداي توسان 2021 بصمة، شاشة لمس، كاميرا 360، فتحة سقف بانوراما. ضمان وكيل حتى 2026.',
      price: 19500, cityId: amman.id, coverImage: '/images/placeholder-car.svg', featured: true, isNew: false,
    },
    {
      brandId: kia.id, modelId: rio.id, year: 2017, trim: 'LX',
      kilometers: 135000, fuelType: 'PETROL', transmission: 'MANUAL',
      color: 'أحمر', drivetrain: 'FWD', condition: 'GOOD', bodyType: 'HATCHBACK',
      description: 'كيا ريو 2017 يدوي، اقتصادية جداً، مناسبة للمبتدئين. مكيف بارد، زجاج كهرباء، فرش ممتاز.',
      price: 5500, cityId: irbid.id, coverImage: '/images/placeholder-car.svg', featured: false, isNew: false,
    },
    {
      brandId: kia.id, modelId: sportage.id, year: 2020, trim: 'EX',
      kilometers: 60000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'أبيض لؤلؤي', drivetrain: 'AWD', condition: 'VERY_GOOD', bodyType: 'SUV',
      description: 'كيا سبورتاج 2020 دفع رباعي، شاشة كبيرة، كاميرا خلفية، حساسات، مثبت سرعة. السيارة بحالة وكالة.',
      price: 17200, cityId: amman.id, coverImage: '/images/placeholder-car.svg', featured: false, isNew: false,
    },
    {
      brandId: mercedes.id, modelId: cClass.id, year: 2018, trim: 'C200',
      kilometers: 88000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'أسود', drivetrain: 'RWD', condition: 'VERY_GOOD', bodyType: 'SEDAN',
      description: 'مرسيدس C200 موديل 2018، AMG package، جلد، شاشة، فتحة سقف، Burmester sound. صيانة منتظمة عند الوكيل.',
      price: 24500, cityId: amman.id, coverImage: '/images/placeholder-car.svg', featured: true, isNew: false,
    },
    {
      brandId: mercedes.id, modelId: eClass.id, year: 2017, trim: 'E300',
      kilometers: 105000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'فضي', drivetrain: 'RWD', condition: 'GOOD', bodyType: 'SEDAN',
      description: 'مرسيدس E300 2017، فل كامل، مقاعد جلد، ذاكرة مقاعد، شاشة كبيرة. السيارة نظيفة جداً ومريحة.',
      price: 22000, cityId: aqaba.id, coverImage: '/images/placeholder-car.svg', featured: false, isNew: false,
    },
    {
      brandId: bmw.id, modelId: bmw5.id, year: 2019, trim: '530i M Sport',
      kilometers: 72000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'أزرق', drivetrain: 'RWD', condition: 'EXCELLENT', bodyType: 'SEDAN',
      description: 'بي إم دبليو 530i M Sport 2019، هايبرد خفيف، شاشة، هيد أب، Harman Kardon. لا حوادث، ضمان شامل.',
      price: 28900, cityId: amman.id, coverImage: '/images/placeholder-car.svg', featured: true, isNew: false,
    },
    {
      brandId: bmw.id, modelId: bmwX5.id, year: 2019, trim: 'xDrive40i',
      kilometers: 95000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'أسود', drivetrain: 'FOUR_WD', condition: 'VERY_GOOD', bodyType: 'SUV',
      description: 'بي إم دبليو X5 2019 دفع رباعي، مقاعد جلد، شاشة، كاميرا 360، فتحة سقف. السيارة بحالة ممتازة.',
      price: 32500, cityId: amman.id, coverImage: '/images/placeholder-car.svg', featured: true, isNew: false,
    },
    {
      brandId: nissan.id, modelId: sunny.id, year: 2016, trim: 'SV',
      kilometers: 165000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'أبيض', drivetrain: 'FWD', condition: 'GOOD', bodyType: 'SEDAN',
      description: 'نيسان صني 2016 اقتصادية، مكيف بارد، صيانة منتظمة. مناسبة للطلاب أو الاستخدام اليومي.',
      price: 4800, cityId: zarqa.id, coverImage: '/images/placeholder-car.svg', featured: false, isNew: false,
    },
    {
      brandId: nissan.id, modelId: altima.id, year: 2020, trim: 'SV',
      kilometers: 55000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'فضي', drivetrain: 'FWD', condition: 'EXCELLENT', bodyType: 'SEDAN',
      description: 'نissan ألتيما 2020 جديدة نسبياً، شاشة، كاميرا، بصمة، push start. ضمان وكيل ساري.',
      price: 16800, cityId: irbid.id, coverImage: '/images/placeholder-car.svg', featured: false, isNew: false,
    },
    {
      brandId: honda.id, modelId: accord.id, year: 2018, trim: 'Sport',
      kilometers: 92000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'أبيض', drivetrain: 'FWD', condition: 'VERY_GOOD', bodyType: 'SEDAN',
      description: 'هوندا أكورد 2018 Sport، جلد، شاشة، كاميرا، حساسات. السيارة بحالة ممتازة وقطع غيارها متوفرة.',
      price: 14900, cityId: amman.id, coverImage: '/images/placeholder-car.svg', featured: false, isNew: false,
    },
    {
      brandId: honda.id, modelId: civic.id, year: 2019, trim: 'EX',
      kilometers: 70000, fuelType: 'PETROL', transmission: 'AUTOMATIC',
      color: 'أحمر', drivetrain: 'FWD', condition: 'EXCELLENT', bodyType: 'SEDAN',
      description: 'هوندا سيفيك 2019، هاتشباك، شاشة لمس، كاميرا، Apple CarPlay. السيارة ممتعة في القيادة وموفرة للوقود.',
      price: 13200, cityId: aqaba.id, coverImage: '/images/placeholder-car.svg', featured: false, isNew: false,
    },
    {
      brandId: mitsubishi.id, modelId: lancer.id, year: 2015, trim: 'EX',
      kilometers: 180000, fuelType: 'PETROL', transmission: 'MANUAL',
      color: 'رمادي', drivetrain: 'FWD', condition: 'FAIR', bodyType: 'SEDAN',
      description: 'ميتسوبيشي لانسر 2015 يدوي، بسعر مغرٍ، تحتاج بعض الصيانة البسيطة. مناسبة لمن يبحث عن سيارة اقتصادية للبدء.',
      price: 4200, cityId: zarqa.id, coverImage: '/images/placeholder-car.svg', featured: false, isNew: false,
    },
  ];

  let created = 0;
  for (const data of cars) {
    const ts = Date.now() + created;
    const slug = generateSlug(
      (await prisma.brand.findUnique({ where: { id: data.brandId } }))!.slug,
      (await prisma.carModel.findUnique({ where: { id: data.modelId } }))!.nameEn,
      data.year,
      ts
    );

    const existing = await prisma.car.findUnique({ where: { slug } });
    if (existing) continue;

    const car = await prisma.car.create({
      data: {
        slug,
        status: 'APPROVED',
        featured: data.featured,
        isNew: data.isNew,
        refCode: generateRefCode(),
        views: Math.floor(Math.random() * 200) + 20,
        saves: Math.floor(Math.random() * 15),
        brandId: data.brandId,
        modelId: data.modelId,
        year: data.year,
        trim: data.trim,
        kilometers: data.kilometers,
        fuelType: data.fuelType,
        transmission: data.transmission,
        color: data.color,
        doors: 4,
        engineCapacity: 2.0,
        cylinders: 4,
        drivetrain: data.drivetrain,
        condition: data.condition,
        bodyType: data.bodyType,
        lightingType: 'LED',
        rimType: 'ALLOY',
        description: data.description,
        price: data.price,
        fairPriceEstimate: Math.round(data.price * 0.93),
        currency: 'JOD',
        cityId: data.cityId,
        phone: '+962791234567',
        whatsapp: '+962791234567',
        coverImage: data.coverImage,
        isNegotiable: true,
        hasWarranty: data.year >= 2021,
        hasServiceHistory: true,
        isDamaged: false,
        isPaintOriginal: true,
        ownerCount: 1,
        userId: seller.id,
        conditionDetails: JSON.stringify([
          { key: 'engine', label: 'المحرك', icon: 'engine', rating: 4 + Math.random() },
          { key: 'transmission', label: 'ناقل الحركة', icon: 'transmission', rating: 4 + Math.random() },
          { key: 'ac', label: 'المكيف', icon: 'ac', rating: 4 + Math.random() },
          { key: 'interior', label: 'الداخلية', icon: 'interior', rating: 4 + Math.random() },
          { key: 'electrical', label: 'الكهرباء', icon: 'electrical', rating: 4 + Math.random() },
          { key: 'suspension', label: 'التعليق', icon: 'suspension', rating: 4 + Math.random() },
          { key: 'brakes', label: 'الفرامل', icon: 'brakes', rating: 4 + Math.random() },
          { key: 'tires', label: 'الإطارات', icon: 'tires', rating: 3 + Math.random() * 2 },
          { key: 'paint', label: 'البودي والدهان', icon: 'paint', rating: 3 + Math.random() * 2 },
        ]),
        images: {
          create: [
            { url: data.coverImage, isCover: true, order: 0 },
          ],
        },
      },
    });

    console.log(`  ✅ ${car.year} ${(await prisma.brand.findUnique({ where: { id: car.brandId } }))?.nameEn} - ${car.price} JOD (${car.refCode})`);
    created++;
  }

  console.log(`\n🎉 تم إنشاء ${created} سيارة بنجاح.`);
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
