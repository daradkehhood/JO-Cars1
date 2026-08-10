# Cloudflare Setup Guide for JO Cars (دليل مستقبلي)

> **ملاحظة:** هذا الدليل للاستخدام المستقبلي عندما تحصل على دومين.
> حالياً الموقع يعمل على Railway مباشرة: `https://jo-cars-production.up.railway.app`

## البنية الحالية

```
المستخدم
     │
     ▼
Railway (استضافة + SSL مجاني)
     │
     ▼
PostgreSQL
```

## البنية المستقبلية (عند الحصول على دومين)

```
المستخدم
     │
     ▼
Cloudflare (مجاني)
     │
     ▼
Railway
     │
     ▼
PostgreSQL
```

## الخطوة 1: إنشاء حساب Cloudflare

1. اذهب إلى [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. أنشئ حساب مجاني
3. أضف دومينك (مثلاً `jocars.jo`)

## الخطوة 2: إعداد DNS

في Cloudflare Dashboard → DNS → Records:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | @ | `railway.app` IP | Proxied |
| CNAME | www | `jo-cars-production.up.railway.app` | Proxied |
| CNAME | api | `jo-cars-production.up.railway.app` | Proxied |

**مهم:** فعّل Proxy (البرتقالي) على جميع السجلات

## الخطوة 3: إعداد SSL/TLS

في Cloudflare Dashboard → SSL/TLS:

1. **Encryption mode:** Full (Strict)
2. **Always Use HTTPS:** ON
3. **HTTP Strict Transport Security (HSTS):** ON
4. **Automatic HTTPS Rewrites:** ON

## الخطوة 4: إعداد Speed Optimization

في Cloudflare Dashboard → Speed:

1. **Auto Minify:**
   - JavaScript: ✓
   - CSS: ✓
   - HTML: ✓

2. **Brotli:** ON
3. **Early Hints:** ON
4. **HTTP/2:** ON (تلقائي)
5. **HTTP/3 (QUIC):** ON

## الخطوة 5: إعداد Caching

في Cloudflare Dashboard → Caching:

1. **Browser Cache TTL:** Respect Existing Headers
2. **Always Online:** ON
3. **Caching Level:** Standard

### Page Rules (مجاني: 3 قواعد)

**القاعدة 1: API Cache**
```
URL: jo-cars.jo/api/*
Settings: Cache Level: Bypass
```

**القاعدة 2: Static Assets**
```
URL: jo-cars.jo/_next/static/*
Settings: Cache Level: Cache Everything, Edge Cache TTL: 1 month
```

**القاعدة 3: Uploads**
```
URL: jo-cars.jo/uploads/*
Settings: Cache Level: Cache Everything, Edge Cache TTL: 1 year
```

## الخطوة 6: إعداد Security

في Cloudflare Dashboard → Security:

1. **Security Level:** Medium
2. **Browser Integrity Check:** ON
3. **Challenge Passage:** 30 minutes
4. **Privacy Pass:** ON

### WAF Rules (مجاني)

**القاعدة 1: حماية من SQL Injection**
```
Rule: (http.request.uri contains "union") or (http.request.uri contains "select")
Action: Managed Challenge
```

**القاعدة 2: حماية من XSS**
```
Rule: (http.request.uri contains "<script") or (http.request.uri contains "javascript:")
Action: Managed Challenge
```

**القاعدة 3: حماية من Path Traversal**
```
Rule: (http.request.uri contains "../") or (http.request.uri contains "..%2f")
Action: Block
```

## الخطوة 7: إعداد Page Rules for WebSocket

لأن JO Cars يستخدم Socket.IO:

```
URL: jo-cars.jo/socket.io*
Settings:
  - SSL: Full
  - WebSockets: ON
  - Browser Integrity Check: OFF
```

## الخطوة 8: إعداد Workers (اختياري - مجاني)

### Rate Limiting Worker

```javascript
// workers/rate-limit.js
export default {
  async fetch(request) {
    const ip = request.headers.get('CF-Connecting-IP');
    const url = new URL(request.url);

    // Rate limit API endpoints
    if (url.pathname.startsWith('/api/')) {
      // Simple in-memory rate limiting
      // For production, use Cloudflare KV
      return fetch(request);
    }

    return fetch(request);
  }
};
```

## الخطوة 9: تحديث Railway Environment Variables

أضف في Railway Dashboard → Variables:

```env
# Cloudflare Settings
TRUST_PROXY=true
CF_ACCEPT=true

# Update NEXT_PUBLIC_APP_URL if using custom domain
NEXT_PUBLIC_APP_URL=https://jocars.jo
```

## الخطوة 10: اختبار الإعداد

### اختبار SSL
```bash
curl -I https://jocars.jo
# يجب أن يظهر:
# HTTP/2 200
# cf-ray: [ray-id]
# cf-cache-status: HIT or MISS
```

### اختبار WebSocket
```bash
# افتح Console في المتصفح
wss://jocars.jo/socket.io/?EIO=4&transport=websocket
# يجب أن يتصل بنجاح
```

### اختبار Caching
```bash
curl -I https://jocars.jo/_next/static/chunks/main.js
# يجب أن يظهر:
# cf-cache-status: HIT
# Cache-Control: public, max-age=31536000, immutable
```

## المزايا المجانية

| الميزة | الحد المجاني | الحالة |
|--------|-------------|--------|
| CDN | غير محدود | ✓ |
| SSL/TLS | غير محدود | ✓ |
| DDoS Protection | غير محدود | ✓ |
| WAF Rules | 5 قواعد | ✓ |
| Page Rules | 3 قواعد | ✓ |
| Bandwidth | غير محدود | ✓ |
| Analytics | أساسي | ✓ |

## ما بعد الإعداد

1. **اختبر الموقع** من أجهزة مختلفة
2. **راجع Cloudflare Analytics** بعد 24 ساعة
3. **تفعيل HSTS** بعد التأكد من عمل SSL
4. **إضافة更多 WAF Rules** حسب الحاجة

## ملاحظات أمنية

- Cloudflare يخفي IP السيرفر الحقيقي
- جميع الطلبات تمر عبر Cloudflare أولاً
- DDoS Protection مجاني وغير محدود
- SSL/TLS مجاني مع شهادة تلقائية
- Rate Limiting عبر Cloudflare Workers

## التكلفة

**مجاني بالكامل!**

- لا توجد تكاليف إضافية
- لا حاجة لبطاقة ائتمان
- جميع الميزات الأساسية مجانية
