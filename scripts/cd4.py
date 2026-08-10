"""Consulting Data - Sections 15-17: Competitors, Development, Financial"""

# ===================== القسم 15: مقارنة المنافسين =====================
S15 = {
    "title": "مقارنة المنافسين",
    "comparison": [
        {
            "name": "OpenSooq (السوق المفتوح)",
            "type": "سوق عام",
            "users": "2M+",
            "pros": ["حضور كبير", "تطبيق موبايل", "سهولة الاستخدام"],
            "cons": ["غير متخصص بالسيارات", "لا يوجد AI tools", "لا يوجد ورش", "لا يوجد مزادات"],
            "jo_cars_advantage": "AI tools + ورش + مزادات + متخصص بالسيارات",
        },
        {
            "name": "Facebook Marketplace",
            "type": "سوق اجتماعي",
            "users": "3M+ أردني",
            "pros": ["جمهور ضخم", "مجاني", "محادثة مباشرة"],
            "cons": ["غير آمن", "لا يوجد تقييم", "لا يوجد ضمان", "spam عالي"],
            "jo_cars_advantage": "آمن + موثوق + تقييمات + ضمان",
        },
        {
            "name": "Haraj (حراج)",
            "type": "سوق متخصص",
            "users": "10M+",
            "pros": ["أكبر سوق سيارات", "تطبيق موبايل", "active community"],
            "cons": ["تصميم قديم", "لا يوجد AI", "لا يوجد ورش", "واجهة معقدة"],
            "jo_cars_advantage": "تصميم عصري + AI + ورش + واجهة بسيطة",
        },
        {
            "name": "معارض السيارات المحلية",
            "type": "معارض فعلية",
            "users": "N/A",
            "pros": ["ثقة محلية", "خدمة شخصية"],
            "cons": [" Presence رقمي ضعيف", "أسعار غير شفافة", "محدود جغرافياً"],
            "jo_cars_advantage": "توسع جغرافي + شفافية + AI",
        },
    ],
    "why_jo_cars": [
        "المنصة الوحيدة المتكاملة (سيارات + ورش + مزادات + منتدى)",
        "أدوات ذكاء اصطناعي لا يوفرها أي منافس",
        "تصميم عصري ومتجاوب",
        "تركيز على السوق الأردني مع محتوى محلي",
        "نظام تقييم وثقة متكامل",
        "حساب الجمارك والضريبة تلقائياً",
    ],
    "what_to_add": [
        "تطبيق موبايل أصلي",
        "نظام دفع إلكتروني",
        "real-time notifications",
        "نظام referral program",
        "content marketing (مقالات + فيديو)",
        "social media integration",
        "نظام loyalty points",
        "شراكات مع معارض السيارات",
    ],
}

# ===================== القسم 16: خطة التطوير =====================
S16 = {
    "title": "خطة التطوير",
    "priority_levels": [
        ("ضروري جداً", [
            "نظام دفع إلكتروني (Zain Cash, Fawry)",
            "PWA مع offline support",
            "إصلاح vulnerabilities الأمنية (IDOR, Rate Limiting)",
            "إضافة sitemap.xml و robots.txt",
            "إضافة Structured Data (Schema.org)",
            "تحسين file upload security",
            "تطبيق Redis-based rate limiting",
        ]),
        ("مهم", [
            "تطبيق موبايل أصلي (React Native)",
            "real-time bidding للمزادات",
            "نظام إشعارات Push (Firebase)",
            "نظام تقييم البائعين المتقدم",
            "تحسين SEO (metadata, OG tags)",
            "نظام bulk actions للإدارة",
            "تحسين mobile UX",
        ]),
        ("متوسط", [
            "نظام التوصيات الذكي",
            "نظام مقارنة التأمين",
            "نظام التمويل المقارن",
            "نظام loyalty points",
            "نظام referral program",
            "content marketing hub",
            "نظام A/B testing",
        ]),
        ("اختياري", [
            "نظام AR للسيارات",
            "نظام blockchain للسجل",
            "نظام voice search",
            "نظام chatbot متقدم",
            "نظام analytics متقدم",
            "نظام multi-language",
            "نظام franchise للورش",
        ]),
    ],
}

# ===================== القسم 17: التحليل المالي =====================
S17 = {
    "title": "التحليل المالي",
    "revenue_streams": [
        ("الاشتراكات المميزة", "حسابات بريميوم للمستخدمين والورش", "5-20 دينار/شهر"),
        ("الإعلانات المميزة", "تثبيت الإعلانات في أعلى النتائج", "3-10 دينار/إعلان"),
        ("إعلانات الورش", "إعلانات ترويجية للورش", "10-50 دينار/شهر"),
        ("نظام المزادات", "عمولة على كل مزاد ناجح", "5-10% من قيمة المزاد"),
        ("الإعلانات الخارجية", "إعلانات Google/Facebook ads", "-variable"),
        ("شركت التأمين", "عمولة على التأمين المباع", "20-40 دينار/عقد"),
        ("التمويل", "عمولة على القروض", "50-100 دينار/قرض"),
        ("البيانات", "بيع التقارير لشركات汽车行业", "حسب الاتفاق"),
    ],
    "projections": [
        {
            "users": "1,000",
            "monthly": "500-1,000 دينار",
            "annual": "6,000-12,000 دينار",
            "assumptions": "5% conversion rate, 50 premium users, 20 paid listings",
        },
        {
            "users": "10,000",
            "monthly": "5,000-15,000 دينار",
            "annual": "60,000-180,000 دينار",
            "assumptions": "5% conversion, 500 premium, 200 paid listings, 5 auctions/week",
        },
        {
            "users": "100,000",
            "monthly": "50,000-150,000 دينار",
            "annual": "600,000-1.8M دينار",
            "assumptions": "3% conversion, 3000 premium, 2000 paid, 20 auctions/week, insurance referrals",
        },
        {
            "users": "500,000",
            "monthly": "250,000-750,000 دينار",
            "annual": "3M-9M دينار",
            "assumptions": "3% conversion, 15000 premium, 10000 paid, 50 auctions/week, data sales",
        },
        {
            "users": "1,000,000",
            "monthly": "500,000-1.5M دينار",
            "annual": "6M-18M دينار",
            "assumptions": "3% conversion, 30000 premium, 20000 paid, 100+ auctions/week, franchise fees",
        },
    ],
    "costs": [
        ("الخوادم (Railway)", "50-200 دينار/شهر"),
        ("NVIDIA AI API", "100-500 دينار/شهر"),
        ("تطوير وصيانة", "500-2000 دينار/شهر"),
        ("تسويق", "200-1000 دينار/شهر"),
        ("دعم فني", "100-500 دينار/شهر"),
        ("إجمالي التكاليف الشهرية", "950-4,200 دينار/شهر"),
    ],
}
