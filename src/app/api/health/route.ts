import { NextResponse } from 'next/server';

/**
 * Lightweight health check endpoint used by the client-side offline detection.
 * Returns a tiny JSON response so the browser can verify connectivity.
 */
export async function GET() {
  return NextResponse.json({ ok: true, t: Date.now() });
}
