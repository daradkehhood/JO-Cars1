const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin2@jocars.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin account already exists:', existing.email);
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log('Updated role to ADMIN');
    await prisma.$disconnect();
    return;
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    const generated = crypto.randomBytes(16).toString('hex');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  كلمة مرور الأدمن (احفظها الآن):            ║');
    console.log('║  ' + generated + '  ║');
    console.log('║  شغّل السكربت مرة ثانية مع:                ║');
    console.log('║  ADMIN_PASSWORD=' + generated + '  ║');
    console.log('╚══════════════════════════════════════════════╝');
    await prisma.$disconnect();
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin 2',
      email,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Created admin account:', admin.email);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
