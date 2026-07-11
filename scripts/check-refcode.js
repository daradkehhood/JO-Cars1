const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const cars = await prisma.car.findMany({ select: { id: true, refCode: true, brandId: true }, take: 10 });
  console.log('All cars refCodes:');
  cars.forEach(c => console.log(' ', c.refCode, c.id.substring(0, 8)));
  
  const searchCode = 'QZ6-H9K';
  const found = await prisma.car.findFirst({ where: { refCode: searchCode }, select: { id: true, refCode: true } });
  console.log('\nDirect lookup for', searchCode, ':', found ? 'FOUND' : 'NOT FOUND');
  
  await prisma.$disconnect();
}
test().catch(e => { console.error(e); process.exit(1); });
