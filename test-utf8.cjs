const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.carHistory.findMany({ where: { vin: '1FAFP40634F172702' } }).then(r => {
  r.forEach(h => console.log(JSON.stringify({ title: h.title, desc: h.description }, null, 2)));
  return p.$disconnect();
});
