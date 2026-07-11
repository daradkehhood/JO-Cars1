const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Delete corrupted record
  await p.carHistory.deleteMany({ where: { vin: '1FAFP40634F172702' } });

  // Add clean records
  const records = [
    {
      vin: '1FAFP40634F172702',
      eventType: 'REGISTRATION',
      title: 'تسجيل أول للسيارة',
      description: 'تم تسجيل السيارة لأول مرة في الولايات المتحدة',
      eventDate: new Date('2004-06-15'),
      mileage: 10,
      source: 'system',
    },
    {
      vin: '1FAFP40634F172702',
      eventType: 'MAINTENANCE',
      title: 'تغيير زيت المحرك',
      description: 'تم تغيير زيت المحرك والفلاتر عند 85,000 كم',
      eventDate: new Date('2024-03-15'),
      mileage: 85000,
      source: 'user',
    },
    {
      vin: '1FAFP40634F172702',
      eventType: 'OWNER_CHANGE',
      title: 'نقل ملكية',
      description: 'تم نقل ملكية السيارة إلى المالك الحالي',
      eventDate: new Date('2023-01-20'),
      mileage: 72000,
      source: 'user',
    },
    {
      vin: '1FAFP40634F172702',
      eventType: 'INSPECTION',
      title: 'فحص فني دوري',
      description: 'اجتاز الفحص الفني بنجاح',
      eventDate: new Date('2024-06-01'),
      mileage: 88000,
      source: 'user',
    },
  ];

  for (const r of records) {
    const created = await p.carHistory.create({ data: r });
    console.log('Added:', created.id, created.title);
  }

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
