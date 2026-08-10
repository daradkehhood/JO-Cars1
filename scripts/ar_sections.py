"""Arabic Report Section Builders"""
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether,
)
from ar_config import PAGE_W, M, GOLD, BLUE, LIGHT, GRAY, WHITE, BLACK, BG_LIGHT, ar


def hr(story, color=GOLD, w=2, space=8):
    story.append(HRFlowable(width="100%", thickness=w, color=color, spaceAfter=space))

def h1(story, s, text):
    story.append(Spacer(1, 6))
    hr(story)
    story.append(Paragraph(ar(text), s['h1']))

def h2(story, s, text):
    story.append(Paragraph(ar(text), s['h2']))

def h3(story, s, text):
    story.append(Paragraph(ar(text), s['h3']))

def body(story, s, text):
    story.append(Paragraph(ar(text), s['body']))

def bullet(story, s, text):
    story.append(Paragraph(f"  {ar(text)}", s['bullet']))

def bullet_en(story, s, text):
    story.append(Paragraph(f"  {text}", s['bullet']))

def make_table(story, s, headers, rows, widths):
    data = [[Paragraph(ar(h), s['th']) for h in headers]]
    for row in rows:
        data.append([Paragraph(ar(str(c)), s['td']) for c in row])
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, BG_LIGHT]),
    ]))
    story.append(t)
    story.append(Spacer(1, 6))


def build_cover(story, s):
    story.append(Spacer(1, 60))
    story.append(HRFlowable(width="60%", thickness=3, color=GOLD, spaceAfter=12))
    story.append(Paragraph("JO Cars", s['cover_title']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("تقرير فني وتجاري شامل", s['cover_sub']))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Comprehensive Technical & Business Report", s['cover_sub']))
    story.append(Spacer(1, 20))
    story.append(Paragraph("أغسطس 2026  |  الإصدار 2.0", s['cover_sub']))
    story.append(Spacer(1, 30))
    hr(story, GOLD, 1, 12)

    # Stats boxes
    stats = [("95", "صفحة"), ("166", "API"), ("66", "نموذج"), ("51K+", "سطر كود")]
    box_data = [[Paragraph(f'<font size="20" color="#D4A843"><b>{n}</b></font><br/>'
                           f'<font size="9" color="#8B949E">{l}</font>', s['body_center'])
                 for n, l in stats]]
    t = Table(box_data, colWidths=[100]*4)
    t.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (0, 0), 1, colors.HexColor("#333333")),
        ('BOX', (1, 0), (1, 0), 1, colors.HexColor("#333333")),
        ('BOX', (2, 0), (2, 0), 1, colors.HexColor("#333333")),
        ('BOX', (3, 0), (3, 0), 1, colors.HexColor("#333333")),
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(t)

    story.append(Spacer(1, 40))
    hr(story, GOLD, 1, 8)
    story.append(Paragraph("منصة JO Cars  |  سوق السيارات الأردني", s['small']))
    story.append(Paragraph("مدعوم بالذكاء الاصطناعي NVIDIA  |  مستضاف على Railway", s['small']))
    story.append(PageBreak())


def build_toc(story, s):
    h1(story, s, "فهرس المحتويات")
    story.append(Spacer(1, 8))
    toc = [
        "1. الملخص التنفيذي",
        "2. البنية التحتية التقنية",
        "3. بنية قاعدة البيانات",
        "4. نقاط نهاية API",
        "5. الصفحات والمسارات",
        "6. بنية الأمان",
        "7. قدرات الذكاء الاصطناعي",
        "8. تصميم واجهة المستخدم",
        "9. تحليل السوق الأردني",
        "10. التأثير الاجتماعي",
        "11. تحليل SWOT",
        "12. الأداء والتحسين",
        "13. خارطة الطريق المستقبلية",
    ]
    for item in toc:
        story.append(Paragraph(ar(item), s['toc_item']))
    story.append(PageBreak())


def build_section1(story, s):
    from ar_data1 import EXECUTIVE, STATS
    h1(story, s, "1. الملخص التنفيذي")

    h2(story, s, "نظرة عامة")
    body(story, s, EXECUTIVE["intro"])

    h2(story, s, "الرؤية")
    body(story, s, EXECUTIVE["vision"])

    h2(story, s, "المهمة")
    body(story, s, EXECUTIVE["mission"])

    h2(story, s, "إحصائيات المنصة")
    make_table(story, s,
        ["المقياس", "القيمة", "الوصف"],
        [
            ["الصفحات", str(STATS['pages']), "مكونات صفحات Next.js"],
            ["نقاط API", str(STATS['apis']), "نهايات RESTful API"],
            ["نماذج قاعدة البيانات", str(STATS['models']), "نماذج Prisma ORM"],
            ["المكونات", str(STATS['components']), "مكونات React قابلة لإعادة الاستخدام"],
            ["أسطر الكود", f"{STATS['loc']:,}", "كود TypeScript"],
            ["العلاقات", str(STATS['rels']), "علاقات قاعدة البيانات"],
        ],
        [120, 80, 260]
    )

    h2(story, s, "الميزات الرئيسية")
    features = [
        "سوق سيارات شامل مع فلاتر بحث متقدمة",
        "نظام مزادات حية للسيارات",
        "سوق للقطع المستعملة واللوحات المخصصة",
        "دليل ورش العمل مع نظام مواعيد",
        "منتدى تفاعلي لمشاركة المعرفة",
        "10 أدوات ذكاء اصطناعي متقدمة",
        "نظام تذاكر دعم فني",
        "لوحة تحكم إدارية شاملة (33 صفحة)",
        "نظام إشعارات ومحادثات فورية",
        "دعم كامل للعربية مع RTL",
    ]
    for f in features:
        bullet(story, s, f)
    story.append(PageBreak())


def build_section2(story, s):
    from ar_data1 import TECH_STACK, ARCHITECTURE
    h1(story, s, "2. البنية التحتية التقنية")

    h2(story, s, "المكونات التقنية")
    make_table(story, s,
        ["المكون", "التفاصيل"],
        [[name, desc] for name, desc in TECH_STACK],
        [120, 340]
    )

    h2(story, s, "طبقات النظام")
    for layer, desc in ARCHITECTURE["layers"]:
        h3(story, s, layer)
        body(story, s, desc)

    h2(story, s, "النمط المعماري")
    for p in ARCHITECTURE["patterns"]:
        bullet(story, s, p)
    story.append(PageBreak())


def build_section3(story, s):
    from ar_data1 import DB_TITLE, DB_DESC, DB_MODELS, RELATIONSHIPS
    h1(story, s, "3. بنية قاعدة البيانات")
    body(story, s, DB_DESC)

    for category, models in DB_MODELS.items():
        h2(story, s, category)
        rows = [[name, desc] for name, desc in models]
        make_table(story, s,
            ["النموذج", "الوصف"],
            rows,
            [130, 330]
        )

    h2(story, s, "العلاقات الرئيسية")
    for rel, desc in RELATIONSHIPS:
        bullet(story, s, f"{rel} - {desc}")
    story.append(PageBreak())


def build_section4(story, s):
    from ar_data2 import API_TITLE, API_DESC, API_MODULES
    h1(story, s, "4. نقاط نهاية API")
    body(story, s, API_DESC)

    for module, data in API_MODULES.items():
        h2(story, s, module)
        body(story, s, data["desc"])
        for route in data["routes"]:
            bullet(story, s, route)
        story.append(Spacer(1, 4))
    story.append(PageBreak())


def build_section5(story, s):
    from ar_data2 import PAGES_TITLE, PAGES_DESC, PAGE_CATEGORIES
    h1(story, s, "5. الصفحات والمسارات")
    body(story, s, PAGES_DESC)

    for category, pages in PAGE_CATEGORIES.items():
        h2(story, s, category)
        for page in pages:
            bullet(story, s, page)
    story.append(PageBreak())


def build_section6(story, s):
    from ar_data2 import SECURITY_TITLE, SECURITY_DESC, SECURITY_LAYERS
    h1(story, s, "6. بنية الأمان")
    body(story, s, SECURITY_DESC)

    for layer_name, items in SECURITY_LAYERS:
        h2(story, s, layer_name)
        for item in items:
            bullet(story, s, item)

    story.append(Spacer(1, 8))
    h2(story, s, "ملاحظات أمنية مهمة")
    notes = [
        "JWT tokens مخزنة في HttpOnly cookies (آمن) و localStorage (للمقارنة)",
        "Rate Limiting في الذاكرة فقط (غير موزع عبر المثيلات)",
        "DOMPurify ينظف جميع محتوى HTML المُنشأ من المستخدمين",
        "Prisma ORM يمنع SQL Injection عبر الاستعلامات المُعاملة",
        "مسارات الإدارة تتطلب دور USER + middleware إضافي",
        "كلمات المرور مشفرة بـ bcrypt مع 10 جولات",
    ]
    for n in notes:
        bullet(story, s, n)
    story.append(PageBreak())


def build_section7(story, s):
    from ar_data2 import AI_TITLE, AI_DESC, AI_FEATURES, AI_MODELS
    h1(story, s, "7. قدرات الذكاء الاصطناعي")
    body(story, s, AI_DESC)

    h2(story, s, "الميزات")
    make_table(story, s,
        ["الميزة", "الوصف"],
        [[feat, desc] for feat, desc in AI_FEATURES],
        [140, 320]
    )

    h2(story, s, "النماذج المدعومة")
    make_table(story, s,
        ["النموذج", "الوصف", "المعرّف"],
        [[name, desc, mid] for name, desc, mid in AI_MODELS],
        [130, 200, 130]
    )
    story.append(PageBreak())


def build_section8(story, s):
    from ar_data2 import UI_TITLE, UI_DESC, DESIGN_SYSTEM
    h1(story, s, "8. تصميم واجهة المستخدم")
    body(story, s, UI_DESC)

    for category, items in DESIGN_SYSTEM:
        h2(story, s, category)
        for item in items:
            bullet(story, s, item)
    story.append(PageBreak())


def build_section9(story, s):
    from ar_data2 import MARKET_TITLE, MARKET_DESC, MARKET_INSIGHTS, COMPETITORS
    h1(story, s, "9. تحليل السوق الأردني")
    body(story, s, MARKET_DESC)

    h2(story, s, "نظرة عامة على السوق")
    for insight in MARKET_INSIGHTS:
        bullet(story, s, insight)

    h2(story, s, "المنافسون")
    make_table(story, s,
        ["المنافس", "الوصف", "الحضور"],
        [[name, desc, pres] for name, desc, pres in COMPETITORS],
        [100, 250, 80]
    )

    h2(story, s, "تمييز JO Cars")
    diffs = [
        "أدوات ذكاء اصطناعي لا يوفرها المنافسون",
        "سوق ورش العمل مع نظام مواعيد",
        "منتدى تفاعلي لمشاركة المعرفة",
        "تصميم عربي أولاً مع تجربة مستخدم عصرية",
        "نظام مزادات حية للسيارات",
        "حاسبة جمارك أردنية متكاملة",
    ]
    for d in diffs:
        bullet(story, s, d)
    story.append(PageBreak())


def build_section10(story, s):
    from ar_data2 import SOCIAL_TITLE, SOCIAL_IMPACT
    h1(story, s, "10. التأثير الاجتماعي")

    h2(story, s, "التأثيرات الإيجابية")
    for impact in SOCIAL_IMPACT:
        bullet(story, s, impact)

    h2(story, s, "التأثير الاقتصادي")
    econ = [
        "سوق رقمي يقلل الاعتماد على المعارض الفعلية",
        "رقمنة الورش تزيد من إمكانية الوصول للخدمات",
        "الشفافية في الأسعار تقلل عدم التوازن في المعلومات",
        "أدوات الذكاء الاصطناعي تعمم الخبرة automotive",
    ]
    for e in econ:
        bullet(story, s, e)
    story.append(PageBreak())


def build_section11(story, s):
    from ar_data2 import SWOT_TITLE, SWOT
    h1(story, s, "11. تحليل SWOT")

    for category, items in SWOT.items():
        h2(story, s, category)
        for item in items:
            bullet(story, s, item)
    story.append(PageBreak())


def build_section12(story, s):
    from ar_data2 import PERF_TITLE, PERFORMANCE
    h1(story, s, "12. الأداء والتحسين")

    make_table(story, s,
        ["المقياس", "التفاصيل"],
        [[metric, detail] for metric, detail in PERFORMANCE],
        [130, 330]
    )
    story.append(PageBreak())


def build_section13(story, s):
    from ar_data2 import ROADMAP_TITLE, ROADMAP
    h1(story, s, "13. خارطة الطريق المستقبلية")

    for phase, items in ROADMAP:
        h2(story, s, phase)
        for item in items:
            bullet(story, s, item)
