"""Consulting Data - Sections 5-9: Prisma, APIs, Security, Performance, Mobile"""

# ===================== القسم 5: تحليل Prisma =====================
S5 = {
    "title": "تحليل Prisma",
    "sections": [
        ("Prisma Schema", [
            "ال schema يغطي 66 نموذج بشكل شامل",
            "الأنواع محددة بشكل صحيح (String, Int, Float, Boolean, DateTime)",
            "العلاقت معرّفة via @relation",
            " بعض Enums مفقودة (UserRole موجود)",
            " بعض الحقول could use @default بدلاً من optional",
        ]),
        ("العلاقات", [
            "1:N relationships صحيحة في الأغلب",
            "M:N عبر junction tables: CarTagAssignment, WorkshopBrand",
            "بعض العلاقات تحتاج explicit cascade delete",
            "User-Workshop relationship مفقود أو ضعيف",
        ]),
        ("الاستعلامات", [
            "Prisma generate يُنشئ TypeScript client ممتاز",
            "بعض الاستعلامات تستخدم findMany بدون select (over-fetching)",
            "نحتاج select و include بشكل أكثر ذكاءً",
            "Pagination غير موجود في بعض endpoints",
        ]),
        ("Performance", [
            "Prisma connection pooling مفعل via Neon",
            "N+1 queries محتمل في car listing مع images",
            "batch queries ممكنة عبر $transaction",
            "missing: query logging للمطورين",
        ]),
        ("Connection Pool", [
            "Neon يوفر connection pooling تلقائي",
            "يجب ضبط DATABASE_URL مع connection_limit",
            " pool_timeout يجب ضبطه حسب الحمل",
            "يجب فصل قراءة وكتابة (read/write split)",
        ]),
        ("Indexes", [
            "Prisma لا يدعم تعريف indexes بشكل مباشر في بعض الحالات",
            "يجب إنشاء indexes عبر raw SQL أو migration",
            "الحاجة لـ composite indexes على (brandId, modelId)",
            "الحاجة لـ index على (createdAt) في الجداول كبيرة",
        ]),
        ("Migrations", [
            "Prisma migrate يعمل بشكل جيد",
            "يجب اختبار migrations على staging أولاً",
            "missing: rollback strategy",
            "missing: migration testing CI/CD",
        ]),
    ],
    "best_practices": [
        "استخدام select لتحديد الحقول المطلوبة فقط",
        "استخدام include بحذر لتجنب over-fetching",
        "تطبيق pagination في جميع list endpoints",
        "استخدام $transaction لعمليات multi-step",
        "إضافة Prisma logging في بيئة التطوير",
        "اختبار migrations على staging قبل Production",
    ],
    "errors": [
        "عدم وجود composite indexes",
        "بعض العلاقات تفتقر cascade delete",
        "نقص pagination في endpoints عديدة",
        "عدم استخدام select بفعالية",
        "لا يوجد query performance monitoring",
    ],
}

# ===================== القسم 6: تحليل APIs =====================
S6 = {
    "title": "تحليل APIs",
    "overview": "166 API endpoint عبر 40+ وحدة - تحليل تفصيلي",
    "summary": {
        "total": 166,
        "authenticated": 140,
        "public": 26,
        "admin_only": 54,
    },
    "analysis": [
        ("الأداء", [
            "الطلبات البسيطة: < 100ms (ممتاز)",
            "الطلبات المعقدة: 200-500ms (مقبول)",
            "طلبات AI: 1-5 ثوانٍ (متوقع)",
            "لا يوجد caching على level API",
            "لا يوجد response compression",
        ]),
        ("الحماية", [
            "JWT authentication على endpoints الحساسة",
            "Role-based authorization (USER/ADMIN)",
            "CSRF protection على POST endpoints",
            "Rate limiting (in-memory فقط)",
            "Input validation عبر Zod",
        ]),
        ("التحقق من المدخلات", [
            "Zod schemas موجودة لمعظم endpoints",
            "بعض endpoints تفتقر validation كامل",
            "File upload validation محدود",
            "Missing: request size limits",
            "Missing: content-type validation",
        ]),
        ("Rate Limiting", [
            "في الذاكرة فقط (غير موزع)",
            "Missing: per-user rate limiting",
            "Missing: IP-based blocking",
            "Missing: API key rate limiting",
            "يجب تطبيق Redis-based rate limiting",
        ]),
        ("ال Authentication", [
            "JWT token في HttpOnly cookie (آمن)",
            "Bearer token في Authorization header",
            "Password hashing بـ bcrypt (10 rounds)",
            "Missing: token refresh mechanism",
            "Missing: session management",
        ]),
        ("ال Authorization", [
            "Role-based: USER, ADMIN",
            "Missing: fine-grained permissions",
            "Missing: resource-level authorization",
            "بعض endpoints تحقق الدور بشكل رئيسي",
            "يجب تطبيق ABAC (Attribute-Based)",
        ]),
        ("إمكانية الاختراق", [
            "XSS: DOMPurify يحمي (مقبول)",
            "SQL Injection: Prisma ORM يحمي (جيد)",
            "IDOR: بعض endpoints معرضة",
            "Business Logic: بعض المنطق غير آمن",
            "Missing: request signing",
        ]),
    ],
}

# ===================== القسم 7: تحليل الحماية الأمنية =====================
S7 = {
    "title": "تحليل الحماية الأمنية",
    "score": 68,
    "score_label": "مستوى الحماية من 100",
    "findings": [
        ("SQL Injection", "آمن", "Prisma ORM يستخدم parameterized queries", "لا يوجد إجراء"),
        ("XSS", "مقبول", "DOMPurify ينظف المحتوى", "تحسين: CSP أقوى"),
        ("CSRF", "مقبول", "CSRF token موجود", "تحسين: SameSite cookies"),
        ("SSRF", "معرض", "بعض endpoints تقبل URLs", "إصلاح: URL validation + allowlist"),
        ("RCE", "آمن", "لا يوجد eval أو exec", "لا يوجد إجراء"),
        ("Command Injection", "آمن", "لا يوجد shell commands", "لا يوجد إجراء"),
        ("Path Traversal", "مقبول", "path prevention middleware", "تحسين: stricter validation"),
        ("Clickjacking", "مقبول", "X-Frame-Options header", "تحسين: CSP frame-ancestors"),
        ("File Upload", "معرض", "رفع صور بس", "إصلاح: file type validation + scanning"),
        ("IDOR", "معرض", "بعends endpoints لا تتحقق من ownership", "إصلاح: ownership check"),
        ("Authentication", "مقبول", "JWT + bcrypt", "تحسين: MFA support"),
        ("Authorization", "مقبول", "Role-based basics", "تحسين: fine-grained permissions"),
        ("Session Hijacking", "مقبول", "HttpOnly cookies", "تحسين: session rotation"),
        ("JWT", "مقبول", "Secret key في env", "تحسين: shorter expiry + refresh"),
        ("Password Hashing", "جيد", "bcrypt 10 rounds", "لا يوجد إجراء"),
        ("Headers", "مقبول", "Security headers موجودة", "تحسين: tighter CSP"),
        ("Cookies", "مقبول", "HttpOnly + Secure flags", "تحسين: SameSite=Strict"),
        ("CORS", "مقبول", "CORS config موجود", "تحسين: أضيق scope"),
        ("CSP", "مقبول", "Content Security Policy موجودة", "تحسين: أقوى directives"),
        ("Rate Limiting", "ضعيف", "في الذاكرة فقط", "إصلاح: Redis-based"),
        ("Brute Force", "مقبول", "basic protection", "تحسين: account lockout"),
        ("Enumeration", "مقبول", "رسائل خطأ عامة", "لا يوجد إجراء"),
        ("Privilege Escalation", "مقبول", "role checks", "تحسين: resource-level auth"),
        ("Broken Access Control", "معرض", "بعض endpoints مفقودة", "إصلاح: comprehensive auth check"),
        ("Business Logic", "معرض", "بعض المنطق غير آمن", "إصلاح: logic validation"),
    ],
    "priority_fixes": [
        ("عالي", "تطبيق Redis-based rate limiting"),
        ("عالي", "إصلاح IDOR vulnerabilities"),
        ("عالي", "تحسين file upload security"),
        ("متوسط", "إضافة MFA support"),
        ("متوسط", "تحسين CSP directives"),
        ("متوسط", "تطبيق token refresh mechanism"),
        ("منخفض", "تحسين CORS policy"),
    ],
}

# ===================== القسم 8: تحليل الأداء =====================
S8 = {
    "title": "تحليل الأداء",
    "current": [
        ("سرعة الموقع", "2-4 ثوانٍ للصفحات الأولى (مقبول)", "الهدف: < 2 ثانية"),
        ("الاستعلامات", "100-500ms للطلبات البسيطة", "الهدف: < 200ms"),
        ("الصور", "lazy loading + optimized", "تحسين: WebP + CDN"),
        ("الكاش", "static generation للصفحات العامة", "تحسين: ISR + Redis"),
        ("الذاكرة", "Node.js default (~512MB)", "تحسين: memory limits + monitoring"),
        ("المعالج", "CPU-bound في طلبات AI", "تحسين: queue system"),
        ("Next.js", "App Router + SSR/SSG", "ممتاز أصلاً"),
        ("Prisma", "connection pooling عبر Neon", "تحسين: prepared statements"),
        ("PostgreSQL", "Neon serverless", "تحسين: read replicas"),
    ],
    "scale": [
        ("100 مستخدم", "يعمل بشكل ممتاز", "لا مشاكل متوقعة"),
        ("500 مستخدم", "يعمل بشكل جيد", "بطء طفيف في ساعات الذروة"),
        ("1000 مستخدم", "مقبول", "瓶颈: database connections + AI API calls"),
        ("5000 مستخدم", "يحتاج تحسينات", "瓶颈: rate limiting + caching + read replicas"),
        ("10000 مستخدم", "يحتاج إعادة هيكلة", "瓶颈: horizontal scaling + load balancing + queue system"),
    ],
}

# ===================== القسم 9: تحليل الهاتف =====================
S9 = {
    "title": "تحليل الهاتف",
    "score": 75,
    "findings": [
        ("Responsive Design", "جيد", "Mobile-first approach مع breakpoints"),
        ("جميع الشاشات", "مقبول", "البعض لا يتناسب مع small screens (< 320px)"),
        ("سهولة الاستخدام", "جيد", "MobileBottomNav يسهل التنقل"),
        ("الأزرار", "جيد", "أزرار كبيرة وواضحة"),
        ("سرعة الهاتف", "مقبول", "بطء في تحميل الصور على 3G"),
        ("Touch targets", "مقبول", "بعض الأزرار صغيرة جداً"),
        ("Offline support", "ضعيف", "لا يوجد offline mode"),
        ("PWA", "غير موجود", "يجب تحويله إلى PWA"),
        ("Mobile navigation", "جيد", "bottom nav + hamburger menu"),
        ("Form input", "مقبول", "بعض الحقول غير متوافقة مع mobile keyboards"),
    ],
    "recommendations": [
        "تحويل الموقع إلى PWA مع offline support",
        "تحسين touch targets (44px minimum)",
        "إضافة pull-to-refresh",
        "تحسين تحميل الصور للشبكات البطيئة",
        "إضافة haptic feedback للأزرار المهمة",
        "تحسين mobile forms مع input types صحيحة",
        "إضافة splash screen و app icons",
    ],
}
