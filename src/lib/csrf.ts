import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'csrf-fallback-secret';

export function generateCSRFToken(): string {
  const token = randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  const payload = `${token}:${timestamp}`;
  const signature = createHash('sha256').update(`${payload}:${CSRF_SECRET}`).digest('hex');
  return `${payload}:${signature}`;
}

export function verifyCSRFToken(token: string): boolean {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return false;
    const [rawToken, timestamp, signature] = parts;
    const payload = `${rawToken}:${timestamp}`;
    const expectedSignature = createHash('sha256').update(`${payload}:${CSRF_SECRET}`).digest('hex');
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    if (sigBuffer.length !== expectedBuffer.length) return false;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return false;
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 60 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export function requireCSRF(request: Request): boolean {
  const token = request.headers.get('x-csrf-token');
  if (!token) return false;
  return verifyCSRFToken(token);
}
