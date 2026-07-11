const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  const password = '662009ammar00';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  console.log('Hashed password:', hashedPassword);
  
  const admin = await prisma.user.upsert({
    where: { email: 'mohammedhuod@jocars.com' },
    update: {},
    create: {
      name: 'الادمن جديد للموقع',
      email: 'mohammedhuod@jocars.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+962790000000',
      isActive: true,
    },
  });
  
  console.log('Admin created:', admin);
  await prisma.$disconnect();
}

main().catch(console.error);