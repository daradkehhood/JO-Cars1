import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

await prisma.badge.deleteMany();

const badges = [
  { id: 'badge_trusted', nameAr: 'بائع موثوق', nameEn: 'Trusted Seller', icon: '🥇', color: '#f59e0b' },
  { id: 'badge_golden', nameAr: 'معرض ذهبي', nameEn: 'Golden Showroom', icon: '🥈', color: '#94a3b8' },
  { id: 'badge_fast', nameAr: 'بائع سريع الرد', nameEn: 'Fast Response', icon: '🥉', color: '#cd7f32' },
  { id: 'badge_certified', nameAr: 'تاجر معتمد', nameEn: 'Certified Dealer', icon: '⭐', color: '#3b82f6' },
];

for (const b of badges) {
  const created = await prisma.badge.create({ data: b });
  console.log(`Created: ${created.icon} ${created.nameAr} (${created.id})`);
}

await prisma.$disconnect();
