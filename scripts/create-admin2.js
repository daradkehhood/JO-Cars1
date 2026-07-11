const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin2@jocars.com' } });
  if (existing) {
    console.log('Admin account already exists:', existing.email);
    await prisma.user.update({
      where: { email: 'admin2@jocars.com' },
      data: { role: 'ADMIN' },
    });
    console.log('Updated role to ADMIN');
    await prisma.$disconnect();
    return;
  }

  const password = bcrypt.hashSync('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin 2',
      email: 'admin2@jocars.com',
      password,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Created admin account:', admin.email, '(password: admin123)');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
