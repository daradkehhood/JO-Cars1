const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const fixes = [
    ['الfuheis', 'الفهيس'],
    ['المHTASAB', 'المحتسب'],
    ['الrajif', 'الرجيف'],
  ];
  
  for (const [old,New] of fixes) {
    const r = await prisma.$executeRawUnsafe('UPDATE "cities" SET "nameAr" = $1 WHERE "nameAr" = $2', New, old);
    console.log(old + ' → ' + New + ': ' + r + ' rows');
  }
  
  const r2 = await prisma.$executeRawUnsafe('UPDATE "cities" SET "nameAr" = $1 WHERE "nameAr" = $2', '芙蓉', '芙蓉');
  console.log('芙蓉 →芙蓉: ' + r2 + ' rows');
  
  await prisma.$disconnect();
}

fix().catch(e => { console.error(e.message); process.exit(1); });
