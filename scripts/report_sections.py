"""PDF Report Section Builders"""
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether,
)

from report_config import (
    PAGE_W, MARGIN, GOLD, DARK_BG, CARD_BG, BLUE, LIGHT_TEXT,
    GRAY_TEXT, WHITE, BLACK, ar,
)


def add_section_title(story, styles, title, number=None):
    prefix = f"{number}. " if number else ""
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=6))
    story.append(Paragraph(f"{prefix}{title}", styles['SectionTitle']))
    story.append(Spacer(1, 4))


def add_subsection(story, styles, title):
    story.append(Paragraph(title, styles['SubSection']))


def build_cover(c, styles):
    """Build cover page"""
    c.saveState()
    # Dark background
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=True, stroke=False)

    # Gold accent line
    c.setStrokeColor(GOLD)
    c.setLineWidth(3)
    c.line(MARGIN, PAGE_H - 180, PAGE_W - MARGIN, PAGE_H - 180)

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 140, "JO Cars")

    c.setFillColor(LIGHT_TEXT)
    c.setFont("Helvetica", 16)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 220, "Technical & Business Report")
    c.drawCentredString(PAGE_W / 2, PAGE_H - 245, "Taqir Funni wa Tijari")

    c.setFillColor(GRAY_TEXT)
    c.setFont("Helvetica", 11)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 290, "Comprehensive Platform Analysis")
    c.drawCentredString(PAGE_W / 2, PAGE_H - 308, "August 2026  |  v2.0")

    # Gold line bottom
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(MARGIN, 200, PAGE_W - MARGIN, 200)

    # Stats boxes
    box_w = 90
    box_h = 60
    stats = [("95", "Pages"), ("166", "APIs"), ("66", "Models"), ("51K+", "Lines")]
    total_w = len(stats) * box_w + (len(stats) - 1) * 15
    start_x = (PAGE_W - total_w) / 2
    y = 120

    for i, (num, label) in enumerate(stats):
        x = start_x + i * (box_w + 15)
        c.setFillColor(CARD_BG)
        c.roundRect(x, y, box_w, box_h, 6, fill=True, stroke=False)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(x + box_w / 2, y + 30, num)
        c.setFillColor(GRAY_TEXT)
        c.setFont("Helvetica", 9)
        c.drawCentredString(x + box_w / 2, y + 10, label)

    c.setFillColor(GRAY_TEXT)
    c.setFont("Helvetica", 9)
    c.drawCentredString(PAGE_W / 2, 60, "JO Cars Platform  |  Jordan Automotive Marketplace")
    c.drawCentredString(PAGE_W / 2, 48, "Powered by NVIDIA AI  |  Deployed on Railway")

    c.restoreState()


def build_toc(c, styles):
    """Build table of contents"""
    add_section_title(c, None, None)  # just for page break
    toc_items = [
        "1. Executive Overview",
        "2. Technology Stack",
        "3. Database Architecture (66 Models)",
        "4. API Routes (166 Endpoints)",
        "5. Pages & Routes (95 Pages)",
        "6. Security Architecture",
        "7. AI Features & Integration",
        "8. User Interface & Experience",
        "9. Jordanian Market Analysis",
        "10. Social Impact Assessment",
        "11. SWOT Analysis",
        "12. Performance & Optimization",
        "13. Future Development Roadmap",
    ]
    for item in toc_items:
        c.drawString(MARGIN + 20, 0, item)  # placeholder, will use platypus
    return toc_items


def build_section1_overview(story, styles):
    from report_data import OVERVIEW, STATS
    add_section_title(story, styles, "Executive Overview", 1)

    story.append(Paragraph(OVERVIEW["description"], styles['BodyText2']))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"<b>Arabic:</b> {OVERVIEW['description_ar']}", styles['BodyArabic']))
    story.append(Spacer(1, 10))

    # Stats table
    stats_data = [
        [Paragraph("Metric", styles['TableHeader']),
         Paragraph("Value", styles['TableHeader']),
         Paragraph("Description", styles['TableHeader'])],
        [Paragraph("Pages", styles['TableCell']),
         Paragraph(str(STATS['pages']), styles['TableCell']),
         Paragraph("Next.js App Router page components", styles['TableCell'])],
        [Paragraph("API Routes", styles['TableCell']),
         Paragraph(str(STATS['apis']), styles['TableCell']),
         Paragraph("RESTful API endpoints", styles['TableCell'])],
        [Paragraph("DB Models", styles['TableCell']),
         Paragraph(str(STATS['models']), styles['TableCell']),
         Paragraph("Prisma ORM database models", styles['TableCell'])],
        [Paragraph("Components", styles['TableCell']),
         Paragraph(str(STATS['components']), styles['TableCell']),
         Paragraph("Reusable React components", styles['TableCell'])],
        [Paragraph("Lines of Code", styles['TableCell']),
         Paragraph(f"{STATS['loc']:,}", styles['TableCell']),
         Paragraph("TypeScript source code", styles['TableCell'])],
        [Paragraph("Relationships", styles['TableCell']),
         Paragraph(str(STATS['relationships']), styles['TableCell']),
         Paragraph("Database relationships", styles['TableCell'])],
    ]

    t = Table(stats_data, colWidths=[100, 80, 280])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#FAFAFA")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#FAFAFA"), WHITE]),
    ]))
    story.append(t)


def build_section2_techstack(story, styles):
    from report_data import TECH_STACK
    add_section_title(story, styles, "Technology Stack", 2)

    data = [
        [Paragraph("Technology", styles['TableHeader']),
         Paragraph("Details", styles['TableHeader'])]
    ]
    for tech, detail in TECH_STACK:
        data.append([
            Paragraph(f"<b>{tech}</b>", styles['TableCell']),
            Paragraph(detail, styles['TableCell']),
        ])

    t = Table(data, colWidths=[140, 320])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#FAFAFA"), WHITE]),
    ]))
    story.append(t)


def build_section3_database(story, styles):
    from report_data import DB_MODELS
    add_section_title(story, styles, "Database Architecture", 3)
    story.append(Paragraph(
        f"PostgreSQL database with <b>66 Prisma models</b> and <b>120+ relationships</b>. "
        f"Managed via Prisma ORM with serverless PostgreSQL (Neon).",
        styles['BodyText2']
    ))
    story.append(Spacer(1, 6))

    # Models table - 3 columns
    rows = []
    for i in range(0, len(DB_MODELS), 3):
        row = []
        for j in range(3):
            idx = i + j
            if idx < len(DB_MODELS):
                row.append(Paragraph(f"{idx+1}. {DB_MODELS[idx]}", styles['TableCell']))
            else:
                row.append(Paragraph("", styles['TableCell']))
        rows.append(row)

    data = [[Paragraph("Model", styles['TableHeader']),
             Paragraph("Model", styles['TableHeader']),
             Paragraph("Model", styles['TableHeader'])]] + rows

    col_w = 154
    t = Table(data, colWidths=[col_w, col_w, col_w])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#FAFAFA"), WHITE]),
    ]))
    story.append(t)

    # Key relationships
    story.append(Spacer(1, 10))
    add_subsection(story, styles, "Key Relationships")
    rels = [
        "User 1:N Car (seller), User 1:N Favorite, User 1:N Message",
        "Car 1:N CarImage, Car 1:N CarView, Car 1:N CarComment",
        "Car N:1 Brand, Car N:1 CarModel (Brand 1:N CarModel)",
        "Auction 1:N Bid, Conversation 1:N Message",
        "Workshop 1:N WorkshopService, Workshop 1:N WorkshopReview",
        "ForumCategory 1:N ForumTopic 1:N ForumPost",
    ]
    for r in rels:
        story.append(Paragraph(f"  {r}", styles['BulletItem']))


def build_section4_apis(story, styles):
    from report_data import API_MODULES
    add_section_title(story, styles, "API Routes", 4)
    story.append(Paragraph(
        "<b>166 API endpoints</b> organized across 40+ modules. "
        "All routes use Next.js App Router (route.ts handlers).",
        styles['BodyText2']
    ))

    for module, routes in API_MODULES.items():
        add_subsection(story, styles, module)
        # Show first 8 routes, then "... and N more"
        shown = routes[:8]
        for r in shown:
            story.append(Paragraph(f"  /api/{r}", styles['BulletItem']))
        if len(routes) > 8:
            story.append(Paragraph(
                f"  ... and {len(routes) - 8} more endpoints",
                styles['SmallGray']
            ))


def build_section5_pages(story, styles):
    from report_data import PAGE_CATEGORIES
    add_section_title(story, styles, "Pages & Routes", 5)
    story.append(Paragraph(
        "<b>95 page components</b> across the application, organized by functional area.",
        styles['BodyText2']
    ))

    for category, pages in PAGE_CATEGORIES.items():
        add_subsection(story, styles, category)
        for p in pages[:6]:
            story.append(Paragraph(f"  {p}", styles['BulletItem']))
        if len(pages) > 6:
            story.append(Paragraph(
                f"  ... and {len(pages) - 6} more pages",
                styles['SmallGray']
            ))


def build_section6_security(story, styles):
    from report_data import SECURITY_FEATURES
    add_section_title(story, styles, "Security Architecture", 6)

    data = [
        [Paragraph("Feature", styles['TableHeader']),
         Paragraph("Implementation", styles['TableHeader'])]
    ]
    for feat, impl in SECURITY_FEATURES:
        data.append([
            Paragraph(f"<b>{feat}</b>", styles['TableCell']),
            Paragraph(impl, styles['TableCell']),
        ])

    t = Table(data, colWidths=[130, 330])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#FAFAFA"), WHITE]),
    ]))
    story.append(t)

    story.append(Spacer(1, 8))
    add_subsection(story, styles, "Security Notes")
    notes = [
        "JWT tokens stored in both HttpOnly cookies (secure) and localStorage (convenience)",
        "Rate limiting is in-memory only (not distributed across instances)",
        "DOMPurify sanitizes all user-generated HTML content",
        "Prisma ORM prevents SQL injection via parameterized queries",
        "Admin routes require USER role check + additional middleware",
    ]
    for n in notes:
        story.append(Paragraph(f"  {n}", styles['BulletItem']))


def build_section7_ai(story, styles):
    from report_data import AI_FEATURES
    add_section_title(story, styles, "AI Features & Integration", 7)
    story.append(Paragraph(
        "AI capabilities powered by <b>NVIDIA AI API</b> with multiple model backends.",
        styles['BodyText2']
    ))

    data = [
        [Paragraph("Feature", styles['TableHeader']),
         Paragraph("Description", styles['TableHeader'])]
    ]
    for feat, desc in AI_FEATURES:
        data.append([
            Paragraph(f"<b>{feat}</b>", styles['TableCell']),
            Paragraph(desc, styles['TableCell']),
        ])

    t = Table(data, colWidths=[140, 320])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#FAFAFA"), WHITE]),
    ]))
    story.append(t)

    story.append(Spacer(1, 8))
    add_subsection(story, styles, "AI Models")
    models = [
        "Default: GPT-OSS-120B (openai/gpt-oss-120b) - General intelligence",
        "GLM: Z-AI GLM-5.2 (z-ai/glm-5.2) - Chinese/English",
        "MiniMax: MiniMax-M3 (minimaxai/minimax-m3) - Multimodal",
        "Mistral: Medium 3.5 128B (mistralai/mistral-medium-3.5-128b) - European languages",
    ]
    for m in models:
        story.append(Paragraph(f"  {m}", styles['BulletItem']))


def build_section8_uiux(story, styles):
    add_section_title(story, styles, "User Interface & Experience", 8)
    story.append(Paragraph(
        "The platform features a <b>Velocity Elite</b> design system with dark glassmorphism aesthetics.",
        styles['BodyText2']
    ))

    add_subsection(story, styles, "Design System Highlights")
    items = [
        "Color Palette: Dark surfaces (#121414, #0c0f0f), Gold accents (#ffc640), Blue highlights (#1d4ed8)",
        "Typography: IBM Plex Sans + Be Vietnam Pro + IBM Plex Sans Arabic",
        "Components: Glassmorphism cards, ambient lighting, multi-layer depth overlays",
        "Responsive: Mobile-first with bottom navigation, tablet, and desktop layouts",
        "Animations: Typewriter effect on hero, smooth scroll, hover transitions",
        "RTL Support: Full right-to-left layout for Arabic content",
    ]
    for item in items:
        story.append(Paragraph(f"  {item}", styles['BulletItem']))

    add_subsection(story, styles, "Key UI Components")
    comps = [
        "HeroSection - Cinematic glassmorphism with search bar",
        "CarCard - Multi-layer depth with gold hover accents",
        "Header - Transparent-to-solid scroll effect",
        "MobileBottomNav - Touch-optimized bottom navigation",
        "FeaturedCars / LatestCars - Animated car grids",
        "BrandsSection - Brand logo carousel",
    ]
    for c in comps:
        story.append(Paragraph(f"  {c}", styles['BulletItem']))


def build_section9_market(story, styles):
    from report_data import JORDAN_MARKET
    add_section_title(story, styles, "Jordanian Market Analysis", 9)
    story.append(Paragraph(
        f"<b>{JORDAN_MARKET['title']}</b>",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        f"<b>{JORDAN_MARKET['title_ar']}</b>",
        styles['BodyArabic']
    ))
    story.append(Spacer(1, 6))
    for point in JORDAN_MARKET['points']:
        story.append(Paragraph(f"  {point}", styles['BulletItem']))

    add_subsection(story, styles, "Competitive Landscape")
    competitors = [
        "Haraj - Largest classifieds, limited car-specific features",
        "OpenSooq - General marketplace, basic car listings",
        "OlxJordan - Regional player, English-focused",
        "JO Cars Differentiation - AI tools, workshops, auctions, forums, Arabic-first UX",
    ]
    for c in competitors:
        story.append(Paragraph(f"  {c}", styles['BulletItem']))


def build_section10_social(story, styles):
    from report_data import SOCIAL_IMPACT
    add_section_title(story, styles, "Social Impact Assessment", 10)
    for item in SOCIAL_IMPACT:
        story.append(Paragraph(f"  {item}", styles['BulletItem']))

    add_subsection(story, styles, "Economic Impact")
    econ = [
        "Digital marketplace reduces physical lot dependency",
        "Workshop digitization increases service accessibility",
        "Price transparency reduces information asymmetry",
        "AI tools democratize automotive expertise",
    ]
    for e in econ:
        story.append(Paragraph(f"  {e}", styles['BulletItem']))


def build_section11_swot(story, styles):
    from report_data import SWOT
    add_section_title(story, styles, "SWOT Analysis", 11)

    for category, items in SWOT.items():
        add_subsection(story, styles, category)
        for item in items:
            story.append(Paragraph(f"  {item}", styles['BulletItem']))


def build_section12_performance(story, styles):
    from report_data import PERFORMANCE
    add_section_title(story, styles, "Performance & Optimization", 12)

    data = [
        [Paragraph("Metric", styles['TableHeader']),
         Paragraph("Details", styles['TableHeader'])]
    ]
    for metric, detail in PERFORMANCE:
        data.append([
            Paragraph(f"<b>{metric}</b>", styles['TableCell']),
            Paragraph(detail, styles['TableCell']),
        ])

    t = Table(data, colWidths=[150, 310])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#FAFAFA"), WHITE]),
    ]))
    story.append(t)


def build_section13_roadmap(story, styles):
    from report_data import ROADMAP
    add_section_title(story, styles, "Future Development Roadmap", 13)

    for phase, items in ROADMAP:
        add_subsection(story, styles, phase)
        for item in items:
            story.append(Paragraph(f"  {item}", styles['BulletItem']))
