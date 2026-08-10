const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin123456!', 12);
  const updated = await prisma.user.updateMany({
    where: { email: 'admin@jocars.com' },
    data: {
      password: hash,
      role: 'ADMIN',
      isActive: true,
      canPost: true,
    },
  });
  console.log('ADMIN_PASSWORD_UPDATED:', updated);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
