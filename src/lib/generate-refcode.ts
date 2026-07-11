import prisma from '@/lib/prisma';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function generateRandom(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  code = code.slice(0, 3) + '-' + code.slice(3);
  return code;
}

export async function generateRefCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRandom();
    const existing = await prisma.car.findUnique({ where: { refCode: code } });
    if (!existing) return code;
  }
  return generateRandom() + Math.random().toString(36).slice(2, 4).toUpperCase();
}
