import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code.slice(0, 3) + '-' + code.slice(3);
}

async function main() {
  const cars = await prisma.car.findMany({ select: { id: true } });
  console.log(`Found ${cars.length} cars to update...`);

  const existingCodes = new Set<string>();
  const usedCodes = await prisma.car.findMany({
    where: { refCode: { not: null } },
    select: { refCode: true },
  });
  usedCodes.forEach((c: { refCode: string | null }) => { if (c.refCode) existingCodes.add(c.refCode); });

  let updated = 0;
  for (const car of cars) {
    let code: string;
    do {
      code = generateCode();
    } while (existingCodes.has(code));
    existingCodes.add(code);

    await prisma.car.update({
      where: { id: car.id },
      data: { refCode: code },
    });
    updated++;
    if (updated % 50 === 0) console.log(`Updated ${updated}/${cars.length}...`);
  }

  console.log(`Done! Updated ${updated} cars with refCodes.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
