# خطة إنشاء تطبيق JO Cars الموبايل

## نظرة عامة
إنشاء تطبيق React Native (Expo) متكامل يحوي جميع ميزات موقع JO Cars الأصلي.

## التقنيات
- **React Native + Expo SDK 51** (Managed workflow)
- **Expo Router** (_file-based routing_ مطابق لـ Next.js App Router)
- **NativeWind** (Tailwind CSS for React Native)
- **Zustand** (State Management - مطابق للموقع)
- **React Native MMKV** (Persist storage بدل localStorage)
- **Socket.io-client** (Real-time messaging)
- **Expo Image Picker / Camera** (رفع الصور)
- **Exo AV** (Audio recording for engine sounds)
- **React Native Maps** (خرائط)
- **AsyncStorage** (backup storage)
- **React Native Reanimated** (animations)

## هيكل المشروع

```
CarsJOApp/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout (auth check, theme)
│   ├── (tabs)/                   # Bottom tab navigator
│   │   ├── _layout.tsx           # Tab bar config
│   │   ├── index.tsx             # Home
│   │   ├── cars.tsx              # Browse cars
│   │   ├── sell.tsx              # Sell car
│   │   ├── messages.tsx          # Messages
│   │   └── profile.tsx           # Profile
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── cars/
│   │   ├── [id].tsx              # Car detail
│   │   ├── add.tsx               # Add car (multi-step)
│   │   ├── compare.tsx           # Compare
│   │   └── search.tsx            # Advanced search
│   ├── parts/
│   │   ├── index.tsx
│   │   ├── [id].tsx
│   │   └── add.tsx
│   ├── plates/
│   │   ├── index.tsx
│   │   ├── [id].tsx
│   │   └── add.tsx
│   ├── wanted/
│   │   ├── index.tsx
│   │   ├── [id].tsx
│   │   └── add.tsx
│   ├── forum/
│   │   ├── index.tsx
│   │   ├── [slug].tsx
│   │   └── topic/[slug].tsx
│   ├── news/
│   │   ├── index.tsx
│   │   └── [slug].tsx
│   ├── dealers.tsx
│   ├── ai.tsx                    # AI Assistant chat
│   ├── car-finder.tsx            # Car finder wizard
│   ├── financing.tsx             # Financing calculator
│   ├── resale-value.tsx          # Resale value
│   ├── maintenance/
│   │   ├── index.tsx
│   │   └── add.tsx
│   ├── favorites.tsx
│   ├── my-cars.tsx
│   ├── my-garage.tsx
│   ├── price-alerts.tsx
│   ├── notifications.tsx
│   ├── tickets/
│   │   ├── index.tsx
│   │   ├── [id].tsx
│   │   └── new.tsx
│   ├── profile/[id].tsx
│   └── settings.tsx
├── components/
│   ├── ui/                       # Button, Input, Badge, Card, Modal
│   ├── layout/                   # Header, BottomNav, Drawer
│   ├── cars/                     # CarCard, CarGrid, CarFilters
│   ├── home/                     # HeroSection, FeaturedCars, etc.
│   ├── ai/                       # AIAssistant, ChatBubble
│   ├── messages/                 # ConversationList, ChatBubble
│   └── shared/                   # StarRating, Loading, EmptyState
├── lib/
│   ├── api.ts                    # API client (fetch wrapper)
│   ├── auth.ts                   # Token management
│   ├── socket.ts                 # Socket.io client
│   ├── utils.ts                  # Helpers (formatPrice, etc.)
│   └── constants.ts              # API URL, colors, config
├── store/
│   ├── authStore.ts              # Auth state (persisted)
│   ├── compareStore.ts           # Compare state (persisted)
│   ├── filterStore.ts            # Filter state
│   └── uiStore.ts                # UI state
├── hooks/
│   ├── useAuth.ts
│   └── useRefreshOnFocus.ts
├── types/
│   └── index.ts                  # All TypeScript types
├── assets/
│   ├── images/
│   └── fonts/
├── app.json
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

## الميزات الرئيسية (مرتبة حسب الأولوية)

### المرحلة 1 - الأساسي (MVP)
1. **المصادقة**: تسجيل دخول/خروج/تسجيل حساب جديد
2. **الصفحة الرئيسية**: بانر رئيسي + سيارات مميزة + أحدث + علامات تجارية + مدن
3. **تصفح السيارات**: قائمة + فلترة + بحث + تفاصيل سيارة
4. **إضافة سيارة**: نموذج متعدد الخطوات مع رفع صور
5. **المفضلة**: إضافة/إزالة من المفضلة
6. **底部 شريط التنقل**: الرئيسية، السيارات، بيع، رسائل، حسابي
7. **الثيم**: Dark/Light mode

### المرحلة 2 - الميزات المتوسطة
8. **الرسائل**: محادثات فورية مع Socket.io
9. **إشعارات**: قائمة الإشعارات
10. **الوكلاء**: صفحة الوكلاء
11. **قطع الغيار**: سوق قطع الغيار
12. **اللوحات**: سوق اللوحات
13. **الإعلانات المطلوبة**: "أبحث عن سيارة"
14. **المقارنة**: مقارنة حتى 3 سيارات
15. **المنتدى**: تصنيفات + مواضيع + ردود
16. **الأخبار**: مقالات وأخبار السيارات

### المرحلة 3 - الميزات المتقدمة
17. **المساعد الذكي (AI)**: شات بوت ذكي
18. **باحث السيارات**: معالج 5 خطوات
19. **حاسبة التمويل**: مقارنة بنوك
20. **حاسبة قيمة إعادة البيع**
21. **تنبيهات الأسعار**
22. **الصيانة**: سوق خدمات الصيانة
23. **الكراج الشخصي**: تتبع سياراتي والمصروفات
24. **تذاكر الدعم الفني**
25. **تقييم المستخدمين**
26. **تسجيل صوت المحرك + تحليل AI**
27. **سجل السيارة (VIN)**
28. **حاسبة الرسوم الجمركية**

### المرحلة 4 - لوحة التحكم (Admin)
29. **لوحة تحكم المدير**: إحصائيات + إدارة
30. **إدارة المستخدمين**: حظر/تفعيل
31. **إدارة السيارات**: موافقة/رفض/تمييز
32. **إدارة الإعدادات**

## نقاط الاتصال مع Backend
التطبيق سيستخدم نفس API endpoints الموجودة في الموقع:
- `NEXT_PUBLIC_API_URL` أو عنوان السيرفر مباشرة
- نفس JWT token authentication
- نفس Socket.io events
- الملفات: `/api/auth/*`, `/api/cars/*`, `/api/messages/*`, etc.

## التصميم البصري
- **نفس ألوان الموقع**: أزرق (#3B82F6) كلون رئيسي
- **RTL**: دعم كامل للعربية
- **Dark Mode**: نفس نظام الثيم
- **نفس الخطوط**: Tajawal للعربية
- **نفس أنماط الكروت**: rounded-2xl, shadows, gradients
- **底部 شريط**: 5 عناصر (الرئيسية، السيارات، + بيع، رسائل، حسابي)

## التحقق
1. `npx expo start` - تشغيل محلي
2. اختبار على Android emulator / iOS simulator
3. اختبار كل شاشة وتمرير
4. اختبار API connection
5. اختبار auth flow كامل
6. اختبار messaging real-time
7. اختبار dark/light mode
