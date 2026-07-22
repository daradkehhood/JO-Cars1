import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET as string;
const TOKEN_EXPIRY = '24h';
const ROTATION_THRESHOLD = 6 * 60 * 60 * 1000; // 6 hours

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function shouldRotateToken(token: string): boolean {
  const payload = verifyToken(token);
  if (!payload) return false;
  const tokenAge = Date.now() / 1000 - payload.iat;
  return tokenAge > ROTATION_THRESHOLD / 1000;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieToken = request.cookies.get('token')?.value;
  return cookieToken || null;
}

export async function authenticateRequest(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      phone: true,
      whatsapp: true,
      isActive: true,
      canPost: true,
      banStatus: true,
      banUntil: true,
      dealerName: true,
      dealerLogo: true,
      forumBannedCommentUntil: true,
      forumBannedTopicUntil: true,
      carCommentBannedUntil: true,
    },
  });

  if (!user) return null;
  if (!user.isActive) return null;
  if (user.banStatus && user.banUntil && new Date(user.banUntil) > new Date()) return null;

  return user;
}

export function requireRole(...roles: string[]) {
  return (user: { role: string } | null) => {
    if (!user) return false;
    return roles.includes(user.role);
  };
}

export function setAuthCookie(response: Response, token: string) {
  response.headers.set(
    'Set-Cookie',
    `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  );
}

export function rotateToken(response: Response, user: { id: string; email: string; role: string }) {
  const newToken = signToken({ userId: user.id, email: user.email, role: user.role });
  setAuthCookie(response, newToken);
  return newToken;
}
