"""PDF Report Data - All content for the 13 sections"""

STATS = {
    "pages": 95,
    "apis": 166,
    "models": 66,
    "components": 41,
    "loc": 51667,
    "relationships": 120,
}

# Section 1: Overview
OVERVIEW = {
    "title_en": "JO Cars Platform - Technical Report",
    "title_ar": "تقرير منصة JO Cars الفني والتجارب",
    "subtitle": "Comprehensive Technical & Business Documentation",
    "date": "August 2026",
    "version": "v2.0",
    "description": (
        "JO Cars is a comprehensive Jordanian automotive marketplace platform enabling "
        "users to buy and sell new/used cars, spare parts, custom plates, and access "
        "workshop services, auctions, forums, and AI-powered tools. The platform serves "
        "the Jordanian automotive market with localized features including province/city "
        "filtering, Jordanian Dinar pricing, customs calculation, and Arabic UI."
    ),
    "description_ar": (
        "منصة JO Cars هي سوق سيارات شاملة أردنية تتيح للمستخدمين شراء وبيع السيارات "
        "والقطع المستعملة واللوحات المخصصة والخدمات ورش العمل والمزادات والمنتديات "
        "والأدوات المدعومة بالذكاء الاصطناعي."
    ),
}

# Section 2: Tech Stack
TECH_STACK = [
    ("Framework", "Next.js 15 (App Router)"),
    ("Language", "TypeScript 5+"),
    ("Database", "PostgreSQL (Neon Serverless)"),
    ("ORM", "Prisma 6"),
    ("Auth", "JWT (HttpOnly Cookies + localStorage)"),
    ("State", "Zustand (persisted)"),
    ("Styling", "Tailwind CSS 4 + Velocity Elite Design System"),
    ("AI Backend", "NVIDIA AI API (GPT-OSS, GLM, MiniMax, Mistral)"),
    ("Charts", "Recharts"),
    ("Forms", "React Hook Form + Zod validation"),
    ("Sanitization", "DOMPurify"),
    ("Encryption", "AES-256-GCM + RSA-OAEP"),
    ("Deployment", "Railway"),
    ("CI/CD", "GitHub Actions"),
    ("Total Code", "51,667 lines"),
]

# Section 3: Database
DB_MODELS = [
    "User", "CarTag", "CarTagAssignment", "PremiumRequest", "Brand",
    "CarModel", "Province", "City", "MaintenanceService", "Car", "Plate",
    "Article", "CarHistory", "CarImage", "Favorite", "Conversation",
    "Message", "Report", "Notification", "Auction", "Bid", "Subscription",
    "Plan", "SavedSearch", "CarView", "ComparisonItem", "CarLog", "AuditLog",
    "Ticket", "TicketMessage", "UsedPart", "PriceAlert", "UserRating",
    "ForumCategory", "ForumTopic", "ForumPost", "ForumPostReport",
    "WantedAd", "WantedOffer", "CarComment", "CarCommentReport", "Badge",
    "SiteSettings", "CarReminder", "CarViewer", "UserGarage", "CarExpense",
    "GarageImage", "CarSoundRecording", "SoundAnalysis", "ReferenceSound",
    "SoundReport", "SoundBan", "Workshop", "WorkshopService", "WorkshopBrand",
    "WorkshopPrice", "WorkshopReview", "WorkshopAppointment", "WorkshopAd",
    "WorkshopAdReport", "WorkshopReport", "CostRecord", "TraderVerification",
    "CarBooking", "CarReview",
]

# Section 4: API Routes by Module
API_MODULES = {
    "Admin (54)": [
        "advanced-stats", "audit-logs", "backup", "backup/auto",
        "badges", "badges/[id]", "brands", "car-comment-reports",
        "car-comment-users/[id]/ban", "car-logs", "cars", "cars/[id]",
        "cars/[id]/feature", "cars/[id]/permanent", "cars/[id]/restore",
        "cities", "cities/[id]", "content-tools", "conversations",
        "conversations/[id]", "forum-categories", "forum-categories/[id]",
        "forum-reports", "forum-users/[id]/ban", "maintenance", "models",
        "news-aggregator", "notifications", "parts", "parts/[id]", "plans",
        "plans/[id]", "premium-requests", "provinces", "provinces/[id]",
        "reports", "security", "seller-reports", "settings", "stats",
        "subscriptions", "subscriptions/[id]", "tags", "tags/[id]", "tickets",
        "traders-approval", "users", "users/[id]", "workshops",
        "workshops/ads", "workshops/reports",
    ],
    "AI Tools (13)": [
        "analysis/[id]", "car-review", "chat", "chat/stream", "customs",
        "description", "market-price", "personality-match", "price-analysis",
        "price-estimate", "purchase-assistant", "smart-search", "sound",
    ],
    "Cars (18)": [
        "cars", "cars/bookings", "cars/brands", "cars/cities",
        "cars/favorites", "cars/models", "cars/my", "cars/[id]",
        "cars/[id]/comments", "cars/[id]/images", "cars/[id]/reactivate",
        "cars/[id]/report", "cars/[id]/reviews", "cars/[id]/sold",
        "cars/[id]/sounds", "cars/[id]/sounds/analyze",
        "cars/[id]/sounds/[soundId]", "cars/[id]/viewers",
    ],
    "Workshops (17)": [
        "workshops", "workshops/[id]", "workshops/[id]/ads",
        "workshops/[id]/appointments", "workshops/[id]/costs",
        "workshops/[id]/report", "workshops/[id]/reviews",
        "workshops/[id]/stats", "workshops/dashboard/ads",
        "workshops/dashboard/ads/[id]", "workshops/dashboard/appointments",
        "workshops/dashboard/brands", "workshops/dashboard/brands/[id]",
        "workshops/dashboard/info", "workshops/dashboard/prices",
        "workshops/dashboard/prices/[id]", "workshops/dashboard/reviews",
        "workshops/dashboard/services", "workshops/dashboard/services/[id]",
        "workshops/dashboard/stats",
    ],
    "Forum (6)": [
        "categories", "posts", "posts/[id]", "posts/[id]/report",
        "topics", "topics/[id]",
    ],
    "Auth (3)": ["login", "profile", "register"],
    "Auctions (3)": ["auctions", "auctions/[id]", "auctions/[id]/bid"],
    "Wanted (3)": ["wanted", "wanted/[id]", "wanted/[id]/offers"],
    "Car History (3)": ["car-history", "car-history/decode/[vin]", "car-history/[vin]"],
    "Car Reminders (3)": ["car-reminders", "car-reminders/send", "car-reminders/[id]"],
    "Other Modules": [
        "articles", "articles/[slug]", "badges", "bookings", "bookings/[id]",
        "car-comments/[id]", "car-comments/[id]/report", "car-finder",
        "car-tags", "contact", "conversations", "conversations/[id]/messages",
        "dealers", "expenses", "financing/calculate", "garage", "garage/[id]",
        "health", "maintenance", "maintenance/[id]", "messages",
        "notifications", "parts", "parts/[id]", "plates", "plates/[id]",
        "premium-requests", "price-alerts", "price-alerts/[id]",
        "ratings", "ratings/user/[id]", "reports", "resale-value",
        "sounds/bans", "sounds/check-ban", "sounds/reports",
        "sounds/stream/[id]", "tickets", "tickets/[id]", "upload",
        "users",
    ],
}

# Section 5: Pages by Category
PAGE_CATEGORIES = {
    "Authentication (4)": [
        "/auth/login - User login with glassmorphism UI",
        "/auth/register - User registration with split-screen",
        "/auth/forgot-password - Password recovery",
        "/auth/verify-email - Email verification",
    ],
    "Public Pages (7)": [
        "/ - Home with HeroSection, FeaturedCars, LatestCars, BrandsSection, CitiesSection",
        "/about - About JO Cars",
        "/contact - Contact form",
        "/privacy - Privacy policy",
        "/terms - Terms of service",
        "/accessibility - Accessibility statement",
        "/cookies - Cookie policy",
    ],
    "Car Marketplace (5)": [
        "/cars - Car listings with advanced filters",
        "/cars/add - Add new car (mobile upload fix applied)",
        "/cars/[id] - Car detail page with auth guard",
        "/cars/compare - Side-by-side comparison",
        "/cars/favorites - User favorites",
    ],
    "Spare Parts (3)": [
        "/parts - Used parts marketplace",
        "/parts/add - List spare part",
        "/parts/[id] - Part detail",
    ],
    "Custom Plates (3)": [
        "/plates - Plate marketplace",
        "/plates/add - List custom plate",
        "/plates/[id] - Plate detail",
    ],
    "Wanted Ads (3)": [
        "/wanted - Wanted listings",
        "/wanted/add - Post wanted ad",
        "/wanted/[id] - Wanted ad detail",
    ],
    "Maintenance (2)": [
        "/maintenance - Maintenance tips & guides",
        "/maintenance/[id] - Maintenance article detail",
    ],
    "Workshops (4)": [
        "/workshops - Workshop directory",
        "/workshops/[id] - Workshop profile",
        "/workshops/dashboard - Workshop owner dashboard",
        "/workshops/add - Register new workshop",
    ],
    "Auctions (1)": [
        "/auctions - Live car auctions",
    ],
    "Forum (4)": [
        "/forum - Forum categories & latest",
        "/forum/[id] - Forum topic with posts",
        "/forum/create - Create new topic",
        "/forum/category/[id] - Category view",
    ],
    "AI & Tools (5)": [
        "/ai/chat - AI chat assistant",
        "/ai/car-review - AI car review",
        "/ai/description - AI description generator",
        "/ai/price-estimate - AI price estimator",
        "/ai/customs - Customs calculator",
    ],
    "Support Tickets (3)": [
        "/tickets - Ticket list",
        "/tickets/[id] - Ticket detail",
        "/tickets/new - Create new ticket",
    ],
    "User Dashboard (12)": [
        "/dashboard - User dashboard overview",
        "/dashboard/cars - My cars",
        "/dashboard/favorites - My favorites",
        "/dashboard/messages - Conversations",
        "/dashboard/garage - My garage",
        "/dashboard/saved - Saved searches",
        "/dashboard/price-alerts - Price alerts",
        "/dashboard/reminders - Car reminders",
        "/dashboard/profile - Edit profile",
        "/dashboard/subscriptions - My subscriptions",
        "/dashboard/garage/add - Add to garage",
        "/dashboard/notifications - Notifications",
    ],
    "Admin Panel (33)": [
        "/admin - Dashboard with advanced stats",
        "/admin/cars - Car management",
        "/admin/users - User management",
        "/admin/workshops - Workshop management",
        "/admin/tickets - Support tickets",
        "/admin/reports - User reports",
        "/admin/forums - Forum management",
        "/admin/parts - Parts management",
        "/admin/auctions - Auction management",
        "/admin/plates - Plate management",
        "/admin/wanted - Wanted ads management",
        "/admin/articles - Article management",
        "/admin/brands - Brand management",
        "/admin/models - Model management",
        "/admin/provinces - Province management",
        "/admin/cities - City management",
        "/admin/plans - Subscription plans",
        "/admin/premium - Premium requests",
        "/admin/badges - Badge management",
        "/admin/tags - Tag management",
        "/admin/settings - Site settings",
        "/admin/security - Security monitoring",
        "/admin/audit-logs - Audit trail",
        "/admin/backup - Backup management",
        "/admin/maintenance - Maintenance tools",
        "/admin/news - News aggregator",
        "/admin/content - Content tools",
        "/admin/seller-reports - Seller reports",
        "/admin/traders - Trader verification",
        "/admin/subscriptions - Subscription management",
        "/admin/conversations - Chat monitoring",
        "/admin/notifications - Notification management",
        "/admin/statistics - Advanced statistics",
    ],
    "Redirects & Other (8)": [
        "/car/[slug] - SEO-friendly car redirect",
        "/cars/[id] - Car detail redirect",
        "/maintenance/[slug] - Maintenance article redirect",
        "/workshops/[slug] - Workshop redirect",
        "/forum/[slug] - Forum topic redirect",
        "/articles/[slug] - Article redirect",
        "/maintenance/category/[slug] - Maintenance category",
        "/maintenance/tag/[slug] - Maintenance tag",
    ],
}

# Section 6: Security
SECURITY_FEATURES = [
    ("Authentication", "JWT with HttpOnly cookies + Bearer token; bcrypt password hashing"),
    ("Authorization", "Role-based (USER, ADMIN); middleware route protection"),
    ("CSRF Protection", "Token-based CSRF with cookie + header validation"),
    ("Rate Limiting", "In-memory rate limiter with configurable windows"),
    ("Input Validation", "Zod schemas for all API inputs"),
    ("XSS Prevention", "DOMPurify for HTML sanitization"),
    ("SQL Injection", "Pattern detection + parameterized queries via Prisma"),
    ("Path Traversal", "Path prevention middleware"),
    ("Security Headers", "CSP, HSTS, X-Frame-Options, X-Content-Type-Options"),
    ("Encryption", "AES-256-GCM for data at rest; RSA-OAEP for key exchange"),
    ("Audit Logging", "Comprehensive audit trail for admin actions"),
    ("IP Monitoring", "IP tracking and suspicious activity detection"),
]

# Section 7: AI Features
AI_FEATURES = [
    ("AI Chat Assistant", "Multi-model chat with GPT-OSS, GLM-5.2, MiniMax-M3, Mistral-Medium-3.5"),
    ("Smart Search", "AI-powered natural language car search"),
    ("Price Estimation", "Market-aware price prediction using vehicle data"),
    ("Market Analysis", "Real-time market trend analysis and comparisons"),
    ("Purchase Assistant", "Guided car buying recommendations"),
    ("Personality Match", "AI matching cars to user preferences"),
    ("Car Review", "AI-generated comprehensive car reviews"),
    ("Description Gen", "Auto-generate car listing descriptions"),
    ("Sound Analysis", "Engine sound diagnostics via audio analysis"),
    ("Customs Calculator", "Jordan customs & tax estimation"),
]

# Section 8: Market Analysis
JORDAN_MARKET = {
    "title": "Jordanian Automotive Market Analysis",
    "title_ar": "تحليل سوق السيارات الأردني",
    "points": [
        "Jordan's vehicle market serves ~1.5 million registered vehicles",
        "Strong demand for Toyota, Hyundai, Kia, Nissan, and Mercedes",
        "Growing used car market driven by import regulations",
        "Customs duties range 20-80% based on vehicle age and engine size",
        "Electric vehicle adoption accelerating with government incentives",
        "Workshop & maintenance sector critical for vehicle longevity",
        "Number plate customization is a cultural tradition in Jordan",
        "Price sensitivity drives demand for fair market valuation tools",
    ],
}

# Section 9: Social Impact
SOCIAL_IMPACT = [
    "Empowers Jordanian citizens with transparent automotive pricing",
    "Creates employment opportunities for mechanics and workshops",
    "Reduces information asymmetry in used car transactions",
    "Promotes digital commerce in Jordan's automotive sector",
    "Facilitates community knowledge sharing via forums",
    "Supports small businesses through workshop digital presence",
    "Environmental awareness through EV and maintenance content",
]

# Section 10: SWOT
SWOT = {
    "Strengths": [
        "Full-stack TypeScript ensures type safety",
        "AI-powered tools differentiate from competitors",
        "Comprehensive feature set (auctions, forums, workshops)",
        "Arabic-first design with RTL support",
        "Modern UI/UX with Velocity Elite design system",
    ],
    "Weaknesses": [
        "In-memory rate limiting (not distributed)",
        "JWT in localStorage (XSS risk)",
        "Single-server deployment (Railway)",
        "No real-time WebSocket for auctions",
        "Limited offline support",
    ],
    "Opportunities": [
        "EV market growth in Jordan",
        "AI-powered valuation tools expansion",
        "Workshop franchise partnerships",
        "Insurance integration",
        "Regional expansion (Levant market)",
    ],
    "Threats": [
        "Established competitors (Haraj, OpenSooq)",
        "Data privacy regulations (Jordan PDPL)",
        "AI API cost scaling",
        "Platform reliability during peak auction times",
        "Cybersecurity threats to financial transactions",
    ],
}

# Section 11: Future Roadmap
ROADMAP = [
    ("Phase 1 - Q3 2026", [
        "WebSocket real-time auction bidding",
        "PWA with offline car browsing",
        "Native mobile app (React Native)",
        "Payment gateway integration (Zain Cash, Fawry)",
    ]),
    ("Phase 2 - Q4 2026", [
        "Insurance marketplace integration",
        "Vehicle history VIN decoder (Jordan MOI data)",
        "AR car visualization for listings",
        "Multi-language support (English, Turkish)",
    ]),
    ("Phase 3 - Q1 2027", [
        "Fleet management tools",
        "Workshop franchise platform",
        "Blockchain-verified car history",
        "Predictive maintenance AI",
    ]),
]

# Section 12: Performance
PERFORMANCE = [
    ("Lighthouse Score", "Target: 90+ Performance, 95+ Accessibility"),
    ("Bundle Size", "Next.js code splitting + dynamic imports"),
    ("Image Optimization", "Next.js Image component with blur placeholders"),
    ("Database", "Neon serverless PostgreSQL with connection pooling"),
    ("Caching", "Static generation for public pages"),
    ("API Response", "Target: < 200ms for standard queries"),
    ("CDN", "Railway edge caching"),
]
