# JO Cars - منصة السيارات الأردنية

أول منصة أردنية متخصصة في بيع وشراء السيارات مع ميزات الذكاء الاصطناعي المتقدمة.

## التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| **Next.js 14** (App Router) | إطار العمل الرئيسي - SSR, SSG, API Routes |
| **React 18** | مكتبة الواجهات |
| **TypeScript** | أمان الأنواع |
| **Tailwind CSS** | التصميم والتنسيق |
| **Prisma ORM** | إدارة قاعدة البيانات |
| **PostgreSQL** | قاعدة البيانات |
| **JWT** | المصادقة |
| **Cloudinary** | تخزين ومعالجة الصور |
| **Google Maps API** | الخرائط والموقع |
| **Zod** | التحقق من البيانات |
| **Framer Motion** | الحركات والانتقالات |
| **Recharts** | الرسوم البيانية |

## ميزات الذكاء الاصطناعي

1. **تقدير سعر السيارة** - بناءً على البيانات والسوق
2. **كشف الأسعار غير المنطقية** - تنبيه عند الأسعار غير الواقعية
3. **تحسين وصف السيارة** - كتابة وصف احترافي تلقائياً
4. **استخراج المواصفات من الصور** - تعبئة النموذج تلقائياً
5. **اكتشاف الخدوش والانبعاجات** - تحليل الصور لاكتشاف الأضرار
6. **تقييم الحالة العامة** - تقييم شامل للسيارة
7. **قراءة رقم الهيكل (VIN)** - باستخدام OCR
8. **إزالة الخلفية** - تحسين الصور تلقائياً
9. **تحسين جودة الصور** - زيادة الدقة وإزالة التشويش
10. **البحث الذكي** - بلغة طبيعية
11. **المساعد الذكي** - شات بوت للمساعدة
12. **إنشاء نموذج ثلاثي الأبعاد** - من 20-40 صورة
13. **فيديو 360 درجة** - تلقائي من النموذج
14. **الواقع المعزز (AR)** - مشاهدة السيارة بالحجم الحقيقي

## بنية المشروع

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # الصفحة الرئيسية
│   ├── layout.tsx         # التخطيط الرئيسي
│   ├── cars/              # صفحات السيارات
│   │   ├── page.tsx       # البحث
│   │   ├── [id]/page.tsx  # تفاصيل السيارة
│   │   ├── add/page.tsx   # إضافة سيارة
│   │   └── compare/       # المقارنة
│   ├── auth/              # المصادقة
│   ├── dealers/           # الوكلاء
│   ├── messages/          # الرسائل
│   ├── favorites/         # المفضلة
│   ├── admin/             # لوحة التحكم
│   └── api/               # REST API
├── components/            
│   ├── ui/                # مكونات واجهة مشتركة
│   ├── layout/            # Header, Footer
│   ├── cars/              # مكونات السيارات
│   ├── home/              # أقسام الصفحة الرئيسية
│   ├── admin/             # مكونات لوحة التحكم
│   └── ai/                # مكونات الذكاء الاصطناعي
├── ai/                    # وحدات الذكاء الاصطناعي
│   ├── base.ts           # الفئة الأساسية
│   ├── price-estimator.ts
│   ├── damage-detector.ts
│   ├── description-generator.ts
│   ├── spec-extractor.ts
│   ├── condition-scorer.ts
│   ├── smart-search.ts
│   └── ...
├── lib/                   # مكتبات مساعدة
├── hooks/                 # React Hooks
├── store/                 # State Management
├── types/                 # TypeScript Types
└── styles/               # أنماط CSS
```

## متطلبات التشغيل

- **Node.js** v18.17+
- **PostgreSQL** v14+
- **npm** أو **yarn**

## التثبيت والتشغيل

### 1. تثبيت المتطلبات

```bash
# تثبيت Node.js: https://nodejs.org
# تثبيت PostgreSQL: https://postgresql.org

# التحقق من التثبيت
node --version
npm --version
psql --version
```

### 2. إنشاء قاعدة البيانات

```bash
# الدخول إلى PostgreSQL
psql -U postgres

# إنشاء قاعدة البيانات
CREATE DATABASE jo_cars;

# الخروج
\q
```

### 3. إعداد المشروع

```bash
# نسخ المتغيرات البيئية
cp .env.example .env

# تعديل ملف .env - ضبط إعدادات قاعدة البيانات
# DATABASE_URL="postgresql://postgres:password@localhost:5432/jo_cars"
```

### 4. تثبيت الحزم وتشغيل المشروع

```bash
# تثبيت الحزم
npm install

# إنشاء جداول قاعدة البيانات
npx prisma db push

# إضافة البيانات الأولية
npx prisma db seed

# تشغيل المشروع محلياً
npm run dev
```

المشروع سيعمل على: **http://localhost:3000**

### 5. حساب المدير الافتراضي

- البريد: `admin@jocars.com`
- كلمة المرور: `Admin@123456`

## الأوامر المتاحة

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل المشروع محلياً |
| `npm run build` | بناء المشروع للإنتاج |
| `npm start` | تشغيل نسخة الإنتاج |
| `npm run lint` | فحص الكود |
| `npm run typecheck` | فحص الأنواع |
| `npm run db:push` | مزامنة قاعدة البيانات |
| `npm run db:migrate` | إنشاء migration |
| `npm run db:seed` | إضافة البيانات الأولية |
| `npm run db:studio` | فتح Prisma Studio |

## API Endpoints

### المصادقة
- `POST /api/auth/register` - إنشاء حساب
- `POST /api/auth/login` - تسجيل دخول
- `GET /api/auth/profile` - الملف الشخصي
- `PUT /api/auth/profile` - تعديل الملف

### السيارات
- `GET /api/cars` - قائمة السيارات (مع فلترة وبحث)
- `GET /api/cars/[id]` - تفاصيل السيارة
- `POST /api/cars` - إضافة سيارة
- `PUT /api/cars/[id]` - تعديل سيارة
- `DELETE /api/cars/[id]` - حذف سيارة
- `GET /api/cars/brands` - قائمة الشركات
- `GET /api/cars/models` - قائمة الموديلات
- `GET /api/cars/cities` - قائمة المحافظات
- `GET /api/cars/favorites` - المفضلة
- `POST /api/cars/favorites` - إضافة/إزالة من المفضلة

### الذكاء الاصطناعي
- `POST /api/ai/price-estimate` - تقدير السعر
- `POST /api/ai/description` - تحسين الوصف
- `POST /api/ai/smart-search` - بحث ذكي

### أخرى
- `GET /api/dealers` - قائمة الوكلاء
- `GET /api/messages` - الرسائل
- `POST /api/messages` - إرسال رسالة
- `GET /api/notifications` - الإشعارات
- `POST /api/reports` - إبلاغ عن إعلان

## النشر على Vercel

```bash
# تثبيت Vercel CLI
npm i -g vercel

# ربط المشروع
vercel link

# نشر
vercel --prod
```

تأكد من إضافة جميع المتغيرات البيئية في إعدادات Vercel.

## هيكل قاعدة البيانات

```
users (المستخدمين)
├── roles: USER, DEALER, ADMIN
├── ratings, verification
└── dealer info

brands (شركات السيارات)
└── car_models (الموديلات)

cars (السيارات)
├── full specs
├── price, location
├── AI analysis data
├── 3D model references
└── images (CarImage)

cities (المحافظات)

favorites (المفضلة)
messages (الرسائل)
notifications (الإشعارات)
reports (البلاغات)
subscriptions (الاشتراكات)
plans (الباقات)
```

## المساهمة

نرحب بمساهماتكم! يرجى اتباع الخطوات:

1. Fork المشروع
2. إنشاء فرع (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات
4. Push الفرع
5. فتح Pull Request

## الترخيص

جميع الحقوق محفوظة © JO Cars

---

**JO Cars** - منصة السيارات الأذكى في الأردن 🇯🇴
