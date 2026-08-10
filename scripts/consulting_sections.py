"""Consulting Report Section Builders - 28 Sections (Complete)"""
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether,
)
from ar_config import PAGE_W, M, GOLD, BLUE, LIGHT, GRAY, WHITE, BLACK, BG_LIGHT, ar

W = PAGE_W - 2 * M


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

def score_bar(story, s, label, score, max_score=100):
    color_hex = "#16A34A" if score >= 80 else "#F59E0B" if score >= 60 else "#DC2626"
    text = f'{ar(label)}: <font color="{color_hex}"><b>{score}/{max_score}</b></font>'
    story.append(Paragraph(text, s['body']))
    story.append(Spacer(1, 2))


# ==================== Section 1: Idea Analysis ====================
def build_s01(story, s):
    from cd1 import S1
    h1(story, s, S1["title"])

    for section_title, items in S1["sections"]:
        h2(story, s, section_title)
        for item in items:
            bullet(story, s, item)
    story.append(PageBreak())


# ==================== Section 2: User Analysis ====================
def build_s02(story, s):
    from cd1 import S2
    h1(story, s, S2["title"])

    for section_title, items in S2["sections"]:
        h2(story, s, section_title)
        for item in items:
            bullet(story, s, item)
    story.append(PageBreak())


# ==================== Section 3: Page Analysis ====================
def build_s03(story, s):
    from cd1 import S3
    h1(story, s, S3["title"])

    for page in S3["pages"]:
        h2(story, s, page["name"])
        body(story, s, f'الهدف: {page["goal"]}')

        h3(story, s, "نقاط القوة:")
        for strength in page["strengths"]:
            bullet(story, s, strength)

        h3(story, s, "نقاط الضعف:")
        for weakness in page["weaknesses"]:
            bullet(story, s, weakness)

        h3(story, s, "التحسينات:")
        for fix in page["fixes"]:
            bullet(story, s, fix)
    story.append(PageBreak())


# ==================== Section 4: DB Analysis ====================
def build_s04(story, s):
    from cd1 import S4
    h1(story, s, S4["title"])
    body(story, s, S4["overview"])

    for section_title, items in S4["findings"]:
        h2(story, s, section_title)
        for item in items:
            bullet(story, s, item)

    h2(story, s, "التوصيات")
    for rec in S4["recommendations"]:
        bullet(story, s, rec)
    story.append(PageBreak())


# ==================== Section 5: Prisma Analysis ====================
def build_s05(story, s):
    from cd2 import S5
    h1(story, s, S5["title"])

    for section_title, items in S5["sections"]:
        h2(story, s, section_title)
        for item in items:
            bullet(story, s, item)

    h2(story, s, "أفضل الممارسات")
    for bp in S5["best_practices"]:
        bullet(story, s, bp)

    h2(story, s, "الأخطاء")
    for err in S5["errors"]:
        bullet(story, s, err)
    story.append(PageBreak())


# ==================== Section 6: API Analysis ====================
def build_s06(story, s):
    from cd2 import S6
    h1(story, s, S6["title"])
    body(story, s, S6["overview"])

    h2(story, s, "ملخص")
    summary = S6["summary"]
    body(story, s, f'إجمالي الـ APIs: {summary["total"]}')
    body(story, s, f'المحمية: {summary["authenticated"]}  |  العامة: {summary["public"]}  |  الإدارة فقط: {summary["admin_only"]}')

    for section_title, items in S6["analysis"]:
        h2(story, s, section_title)
        for item in items:
            bullet(story, s, item)
    story.append(PageBreak())


# ==================== Section 7: Security Analysis ====================
def build_s07(story, s):
    from cd2 import S7
    h1(story, s, S7["title"])
    score_bar(story, s, S7["score_label"], S7["score"])

    h2(story, s, "النتائج")
    rows = [[f[0], f[1], f[2], f[3]] for f in S7["findings"]]
    make_table(story, s, ["الفئة", "الحالة", "الوصف", "التوصية"], rows, [70, 50, 180, 160])

    h2(story, s, "الإصلاحات ذات الأولوية")
    for priority, fix in S7["priority_fixes"]:
        bullet(story, s, f"[{priority}] {fix}")
    story.append(PageBreak())


# ==================== Section 8: Performance Analysis ====================
def build_s08(story, s):
    from cd2 import S8
    h1(story, s, S8["title"])

    h2(story, s, "القياسات الحالية")
    rows = [[m[0], m[1], m[2]] for m in S8["current"]]
    make_table(story, s, ["المقياس", "الحالة", "الهدف"], rows, [100, 200, 160])

    h2(story, s, "التوسع مع عدد المستخدمين")
    rows2 = [[sc[0], sc[1], sc[2]] for sc in S8["scale"]]
    make_table(story, s, ["عدد المستخدمين", "الأداء", "الملاحظات"], rows2, [100, 150, 210])
    story.append(PageBreak())


# ==================== Section 9: Mobile Analysis ====================
def build_s09(story, s):
    from cd2 import S9
    h1(story, s, S9["title"])
    score_bar(story, s, "التقييم العام", S9["score"])

    h2(story, s, "النتائج")
    for finding in S9["findings"]:
        score_bar(story, s, finding[0], 80 if finding[1] == "جيد" else 60 if finding[1] == "مقبول" else 40)
        body(story, s, finding[2])

    h2(story, s, "التوصيات")
    for rec in S9["recommendations"]:
        bullet(story, s, rec)
    story.append(PageBreak())


# ==================== Section 10: SEO Analysis ====================
def build_s10(story, s):
    from cd3 import S10
    h1(story, s, "10. تحليل SEO")
    score_bar(story, s, "التقييم العام", S10["score"])

    h2(story, s, "النتائج")
    rows = [[f[0], f[1], f[2], f[3]] for f in S10["findings"]]
    make_table(story, s, ["الفئة", "الحالة", "الوصف", "التوصية"], rows, [70, 50, 170, 170])

    h2(story, s, "المفقود")
    for m in S10["missing"]:
        bullet(story, s, m)
    story.append(PageBreak())


# ==================== Section 11: UX Analysis ====================
def build_s11(story, s):
    from cd3 import S11
    h1(story, s, "11. تحليل تجربة المستخدم")

    h2(story, s, "الجوانب الرئيسية")
    for aspect in S11["aspects"]:
        score_bar(story, s, aspect[0], aspect[1])
        body(story, s, aspect[2])
        if len(aspect) > 3:
            body(story, s, f"  الهدف: {aspect[3]}")

    h2(story, s, "التحسينات المقترحة")
    for imp in S11["improvements"]:
        bullet(story, s, imp)
    story.append(PageBreak())


# ==================== Section 12: Admin Panel Analysis ====================
def build_s12(story, s):
    from cd3 import S12
    h1(story, s, "12. تحليل لوحة الإدارة")

    h2(story, s, "الأقسام")
    for mod in S12["modules"]:
        score_bar(story, s, mod[0], mod[1])
        body(story, s, mod[2])
        body(story, s, f"  المفقود: {mod[3]}")

    h2(story, s, "الميزات المفقودة")
    for m in S12["missing"]:
        bullet(story, s, m)
    story.append(PageBreak())


# ==================== Section 13: Features Analysis ====================
def build_s13(story, s):
    from cd3 import S13
    h1(story, s, "13. تحليل الميزات")

    h2(story, s, "الميزات الحالية")
    for feat in S13["current_features"]:
        score_bar(story, s, feat[0], feat[1])
        body(story, s, feat[2])

    h2(story, s, "الميزات الجديدة المقترحة")
    rows = [[f[0], f[1], f[2]] for f in S13["new_features"]]
    make_table(story, s, ["الميزة", "الأولوية", "التفاصيل"], rows, [120, 80, 260])

    h2(story, s, "ميزات AI الحالية")
    for ai in S13["ai_features"]:
        bullet(story, s, ai)

    h2(story, s, "ميزات التفاعل اليومي")
    for eng in S13["daily_engagement"]:
        bullet(story, s, eng)
    story.append(PageBreak())


# ==================== Section 14: Jordan Market Deep ====================
def build_s14(story, s):
    from cd3 import S14
    h1(story, s, "14. تحليل سوق الأردن المعمّق")

    for section_title, items in [
        ("المشاكل الحالية", S14["problems"]),
        ("ماذا يريد الأردنيون", S14["what_jordanians_want"]),
        ("الخدمات المفقودة", S14["missing_services"]),
        ("الحلول المقترحة", S14["solutions"]),
    ]:
        h2(story, s, section_title)
        for item in items:
            bullet(story, s, item)
    story.append(PageBreak())


# ==================== Section 15: Competitors ====================
def build_s15(story, s):
    from cd4 import S15
    h1(story, s, "15. مقارنة المنافسين")

    for comp in S15["comparison"]:
        h2(story, s, comp["name"])
        body(story, s, f'النوع: {comp["type"]}  |  المستخدمون: {comp["users"]}')
        h3(story, s, "نقاط القوة:")
        for p in comp["pros"]:
            bullet(story, s, p)
        h3(story, s, "نقاط الضعف:")
        for c in comp["cons"]:
            bullet(story, s, c)
        body(story, s, f'ميزة JO Cars: {comp["jo_cars_advantage"]}')

    h2(story, s, "لماذا JO Cars")
    for reason in S15["why_jo_cars"]:
        bullet(story, s, reason)

    h2(story, s, "ما يجب إضافته")
    for item in S15["what_to_add"]:
        bullet(story, s, item)
    story.append(PageBreak())


# ==================== Section 16: Development Roadmap ====================
def build_s16(story, s):
    from cd4 import S16
    h1(story, s, "16. خطة التطوير")

    for level_name, items in S16["priority_levels"]:
        h2(story, s, level_name)
        for item in items:
            bullet(story, s, item)
    story.append(PageBreak())


# ==================== Section 17: Financial Analysis ====================
def build_s17(story, s):
    from cd4 import S17
    h1(story, s, "17. التحليل المالي")

    h2(story, s, "مصادر الإيرادات")
    rows = [[r[0], r[1], r[2]] for r in S17["revenue_streams"]]
    make_table(story, s, ["المصدر", "الوصف", "النطاق"], rows, [100, 200, 160])

    h2(story, s, "التوقعات")
    rows2 = [[p["users"], p["monthly"], p["annual"], p["assumptions"]] for p in S17["projections"]]
    make_table(story, s, ["المستخدمون", "شهري", "سنوي", "الافتراضات"], rows2, [70, 90, 100, 200])

    h2(story, s, "التكاليف الشهرية")
    rows3 = [[c[0], c[1]] for c in S17["costs"]]
    make_table(story, s, ["البند", "التكلفة"], rows3, [200, 260])
    story.append(PageBreak())


# ==================== Section 18: Final Rating ====================
def build_s18(story, s):
    from cd5 import S18
    h1(story, s, "18. التقييم النهائي")

    h2(story, s, S18["overall_label"])
    score_bar(story, s, "التقييم العام", S18["overall_score"])

    h2(story, s, "التفاصيل")
    for rating in S18["ratings"]:
        score_bar(story, s, rating[0], rating[1])
        body(story, s, rating[2])
    story.append(PageBreak())


# ==================== Section 19: 2-Year Roadmap ====================
def build_s19(story, s):
    from cd5 import S19
    h1(story, s, "19. خارطة الطريق (سنتين)")

    for phase_name, items in S19["phases"]:
        h2(story, s, phase_name)
        for item in items:
            bullet(story, s, item)
    story.append(PageBreak())


# ==================== Section 20: Final Report ====================
def build_s20(story, s):
    from cd5 import S20
    h1(story, s, "20. التقرير النهائي")

    for section_title, items in [
        ("المشاكل الرئيسية", S20["problems"]),
        ("المخاطر", S20["risks"]),
        ("نقاط القوة", S20["strengths"]),
        ("نقاط الضعف", S20["weaknesses"]),
        ("التوصيات", S20["suggestions"]),
    ]:
        h2(story, s, section_title)
        for item in items:
            bullet(story, s, item)

    story.append(Spacer(1, 12))
    h2(story, s, "الاستنتاج")
    score_bar(story, s, S20["readiness_label"], S20["readiness"])
    body(story, s, S20["recommendation"])

    story.append(Spacer(1, 30))
    hr(story, GOLD, 2, 12)
    story.append(Paragraph(ar("JO Cars - تقرير استشاري شامل"), s['body_center']))
    story.append(Paragraph(ar("أغسطس 2026"), s['small']))


# ==================== Section 21: Jordan Market Statistics ====================
def build_s21(story, s):
    from cd6 import S_MARKET_STATS
    h1(story, s, S_MARKET_STATS["title"])

    h2(story, s, "إحصائيات السوق الأردني")
    rows = [[r[0], r[1], r[2]] for r in S_MARKET_STATS["stats"]]
    make_table(story, s, ["المقياس", "الرقم", "المصدر"], rows, [120, 140, 200])

    h2(story, s, "فجوات السوق")
    for item in S_MARKET_STATS["market_gaps"]:
        bullet(story, s, item)
    story.append(PageBreak())


# ==================== Section 22: Competitor Comparison Table ====================
def build_s22(story, s):
    from cd6 import S_COMPETITOR_TABLE
    h1(story, s, S_COMPETITOR_TABLE["title"])

    h2(story, s, "مقارنة الميزات")
    headers = ["الميزة", "OpenSooq", "Facebook", "Haraj", "JO Cars"]
    widths = [140, 70, 70, 70, 70]
    rows = []
    for feat in S_COMPETITOR_TABLE["features"]:
        rows.append([
            feat[0],
            "✓" if feat[1] else "✗",
            "✓" if feat[2] else "✗",
            "✓" if feat[3] else "✗",
            "✓" if feat[4] else "✗",
        ])
    make_table(story, s, headers, rows, widths)

    h2(story, s, "الملخص")
    for name, score in S_COMPETITOR_TABLE["summary"].items():
        body(story, s, f'{name}: {score}')

    story.append(Spacer(1, 12))
    h2(story, s, "الخلاصة")
    body(story, s, S_COMPETITOR_TABLE["conclusion"])
    story.append(PageBreak())


# ==================== Section 23: Technical Infrastructure ====================
def build_s23(story, s):
    from cd6 import S_TECH_STACK
    h1(story, s, S_TECH_STACK["title"])

    h2(story, s, "المكونات التقنية")
    headers = ["المكون", "النوع", "الميزة"]
    widths = [120, 140, 200]
    rows = [[c[0], c[1], c[2]] for c in S_TECH_STACK["components"]]
    make_table(story, s, headers, rows, widths)

    h2(story, s, "البنية المعمارية")
    for item in S_TECH_STACK["architecture"]:
        bullet(story, s, item)

    h2(story, s, "تحسينات مستقبلية مع Cloudflare")
    for item in S_TECH_STACK["cloudflare_future"]:
        bullet(story, s, item)

    story.append(Spacer(1, 12))
    body(story, s, S_TECH_STACK["lines_of_code"])
    body(story, s, S_TECH_STACK["code_quality"])
    story.append(PageBreak())


# ==================== Section 24: Security Section ====================
def build_s24(story, s):
    from cd6 import S_SECURITY
    h1(story, s, S_SECURITY["title"])

    h2(story, s, "طبقات الحماية")
    headers = ["الحماية", "الوصف", "الحالة"]
    widths = [110, 250, 100]
    rows = [[l[0], l[1], l[2]] for l in S_SECURITY["layers"]]
    make_table(story, s, headers, rows, widths)

    h2(story, s, "تحسينات مستقبلية مع Cloudflare")
    for item in S_SECURITY["cloudflare_recommendation"]:
        bullet(story, s, item)

    h2(story, s, "ملاحظات أمنية")
    for note in S_SECURITY["notes"]:
        bullet(story, s, note)
    story.append(PageBreak())


# ==================== Section 25: Why Will Succeed ====================
def build_s25(story, s):
    from cd6 import S_WHY_SUCCEED
    h1(story, s, S_WHY_SUCCEED["title"])

    for i, reason in enumerate(S_WHY_SUCCEED["reasons"], 1):
        h2(story, s, f'{i}. {reason[0]}')
        body(story, s, reason[1])
    story.append(PageBreak())


# ==================== Section 26: Real Usage Scenario ====================
def build_s26(story, s):
    from cd6 import S_USAGE_SCENARIO
    h1(story, s, S_USAGE_SCENARIO["title"])

    body(story, s, S_USAGE_SCENARIO["scenario"])

    for step in S_USAGE_SCENARIO["steps"]:
        h2(story, s, step[0])
        body(story, s, step[1])

    story.append(Spacer(1, 12))
    h2(story, s, "الرؤية الرئيسية")
    body(story, s, S_USAGE_SCENARIO["key_insight"])
    story.append(PageBreak())


# ==================== Section 27: Detailed Revenue Model ====================
def build_s27(story, s):
    from cd6 import S_REVENUE_MODEL
    h1(story, s, S_REVENUE_MODEL["title"])

    h2(story, s, "مصادر الإيرادات التفصيلية")
    for stream in S_REVENUE_MODEL["streams"]:
        h3(story, s, stream["name"])
        body(story, s, f'الوصف: {stream["desc"]}')
        body(story, s, f'التسعير: {stream["pricing"]}')
        body(story, s, f'الهدف: {stream["target"]}')
        body(story, s, f'الإيراد الشهري: {stream["monthly"]}')

    story.append(Spacer(1, 12))
    h2(story, s, "الإجمالي")
    body(story, s, f'الإيراد الشهري المحتمل: {S_REVENUE_MODEL["total_monthly_potential"]}')
    body(story, s, f'الإيراد السنوي المحتمل: {S_REVENUE_MODEL["total_annual_potential"]}')
    story.append(PageBreak())


# ==================== Section 28: 5-Year Roadmap ====================
def build_s28(story, s):
    from cd6 import S_ROADMAP_5Y
    h1(story, s, S_ROADMAP_5Y["title"])

    for phase in S_ROADMAP_5Y["phases"]:
        h2(story, s, f'{phase["year"]}: {phase["title"]}')
        for item in phase["items"]:
            bullet(story, s, item)
    story.append(PageBreak())


# ==================== Section 29: Final Rating Update ====================
def build_s29(story, s):
    from cd6 import S_FINAL_RATING
    h1(story, s, S_FINAL_RATING["title"])

    h2(story, s, S_FINAL_RATING["overall_label"])
    score_bar(story, s, "التقييم العام", int(S_FINAL_RATING["overall_score"] * 10))

    h2(story, s, "التفاصيل")
    for rating in S_FINAL_RATING["categories"]:
        score_bar(story, s, rating[0], int(rating[1] * 10))
        body(story, s, rating[2])

    h2(story, s, "التحسينات المقترحة لتحسين التقييم")
    for imp in S_FINAL_RATING["improvements_needed"]:
        bullet(story, s, imp)

    story.append(Spacer(1, 12))
    body(story, s, f'مع التحسينات: {S_FINAL_RATING["with_improvements"]}')

    story.append(Spacer(1, 30))
    hr(story, GOLD, 2, 12)
    story.append(Paragraph(ar("JO Cars - تقرير استشاري شامل (محدث)"), s['body_center']))
    story.append(Paragraph(ar("أغسطس 2026 - النسخة النهائية"), s['small']))
