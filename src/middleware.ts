import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function geoBlockPage(): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>غير مصرح - JO Cars</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;color:#fff}
    .c{text-align:center;padding:2rem;max-width:600px}
    .i{font-size:5rem;margin-bottom:1.5rem}
    h1{font-size:2rem;font-weight:700;margin-bottom:1rem}
    p{font-size:1.1rem;color:#94a3b8;line-height:1.8}
  </style>
</head>
<body>
  <div class="c">
    <div class="i">&#x1f30d;</div>
    <h1>غير متاح في منطقتك</h1>
    <p>سوق JO Cars متاح فقط للمستخدمين في الأردن.</p>
  </div>
</body>
</html>`,
    { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/uploads/') ||
      pathname.includes('.') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  if (process.env.GEO_RESTRICT_JORDAN === 'true') {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1';

    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return NextResponse.next();
    }

    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      if (data.countryCode !== 'JO') {
        return geoBlockPage();
      }
    } catch {}
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
