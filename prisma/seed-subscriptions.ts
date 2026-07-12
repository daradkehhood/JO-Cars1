import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding subscriptions...');

  const users = await prisma.user.findMany({ take: 10 });
  if (users.length === 0) {
    console.log('No users found. Create users first.');
    return;
  }

  const plans = [
    { name: 'BASIC', nameAr: 'الأساسية', price: 5, durationDays: 30 },
    { name: 'SILVER', nameAr: 'الفضية', price: 15, durationDays: 30 },
    { name: 'GOLD', nameAr: 'الذهبية', price: 30, durationDays: 60 },
    { name: 'PLATINUM', nameAr: 'البلاتينية', price: 50, durationDays: 90 },
    { name: 'VIP', nameAr: 'VIP', price: 100, durationDays: 365 },
  ];

  const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED'];

  let created = 0;
  for (let i = 0; i < Math.min(users.length, 8); i++) {
    const user = users[i];
    const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (existing) {
      console.log(`User ${user.name} already has subscription, skipping.`);
      continue;
    }

    const plan = plans[i % plans.length];
    const status = statuses[i % statuses.length];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60));

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    await prisma.subscription.create({
      data: {
        plan: plan.name,
        status,
        startDate,
        endDate,
        autoRenew: Math.random() > 0.4,
        price: plan.price + (Math.random() * 5 - 2.5),
        userId: user.id,
      },
    });
    console.log(`Created subscription for ${user.name} (${plan.nameAr} - ${status})`);
    created++;
  }

  console.log(`\nDone! Created ${created} subscriptions.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
