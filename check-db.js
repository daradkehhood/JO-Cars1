const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  console.log('Cars:', await p.car.count());
  console.log('Users:', await p.user.count());
  console.log('Cities:', await p.city.count());
  console.log('Provinces:', await p.province.count());
  console.log('Articles:', await p.article.count());
  console.log('Services:', await p.maintenanceService.count());
  console.log('WantedAds:', await p.wantedAd.count());
  console.log('Plates:', await p.plate.count());
  await p.$disconnect();
}
main().catch(e => console.error(e));
