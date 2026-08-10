const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding rating and reviewCount columns to cars table if missing...');
  await prisma.$executeRawUnsafe('ALTER TABLE cars ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION DEFAULT 0;');
  await prisma.$executeRawUnsafe('ALTER TABLE cars ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER DEFAULT 0;');
  console.log('Columns rating and reviewCount successfully added to PostgreSQL cars table!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error adding columns:', err);
  process.exit(1);
});
