import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const badges = [
  { id: 'badge_trusted', nameAr: 'بائع موثوق', nameEn: 'Trusted Seller', icon: '🥇', color: '#f59e0b' },
  { id: 'badge_golden', nameAr: 'معرض ذهبي', nameEn: 'Golden Showroom', icon: '🥈', color: '#94a3b8' },
  { id: 'badge_fast', nameAr: 'بائع سريع الرد', nameEn: 'Fast Response', icon: '🥉', color: '#cd7f32' },
  { id: 'badge_certified', nameAr: 'تاجر معتمد', nameEn: 'Certified Dealer', icon: '⭐', color: '#3b82f6' },
];

for (const b of badges) {
  await prisma.badge.upsert({
    where: { id: b.id },
    update: b,
    create: b,
  });
  console.log(`Badge: ${b.nameAr}`);
}

await prisma.$disconnect();
