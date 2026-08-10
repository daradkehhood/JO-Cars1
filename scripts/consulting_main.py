"""JO Cars Consulting Report Generator - 29 Sections (Complete)"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from reportlab.platypus import SimpleDocTemplate, PageBreak
from reportlab.lib.pagesizes import A4

from ar_config import register_fonts, make_styles, PAGE_W, M, GOLD
from consulting_sections import (
    build_s01, build_s02, build_s03, build_s04, build_s05,
    build_s06, build_s07, build_s08, build_s09, build_s10,
    build_s11, build_s12, build_s13, build_s14, build_s15,
    build_s16, build_s17, build_s18, build_s19, build_s20,
    build_s21, build_s22, build_s23, build_s24, build_s25,
    build_s26, build_s27, build_s28, build_s29,
)

OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'JO_Cars_Consulting_Report_AR.pdf')


def build_cover(story, s):
    """Consulting report cover page"""
    from reportlab.platypus import Spacer, HRFlowable, Paragraph, Table, TableStyle
    from reportlab.lib import colors
    from ar_config import ar, BG_LIGHT, WHITE, LIGHT

    story.append(Spacer(1, 60))
    story.append(HRFlowable(width="60%", thickness=3, color=GOLD, spaceAfter=12))
    story.append(Paragraph("JO Cars", s['cover_title']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("تقرير استشاري شامل", s['cover_sub']))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Comprehensive Consulting Report", s['cover_sub']))
    story.append(Spacer(1, 20))
    story.append(Paragraph("أغسطس 2026  |  الإصدار 1.0", s['cover_sub']))
    story.append(Spacer(1, 12))

    # Stats boxes
    stats = [("29", "قسم"), ("95", "صفحة"), ("166", "API"), ("66", "نموذج")]
    box_data = [[Paragraph(
        f'<font size="20" color="#D4A843"><b>{n}</b></font><br/>'
        f'<font size="9" color="#8B949E">{l}</font>', s['body_center']
    ) for n, l in stats]]
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
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
    story.append(Paragraph("منصة JO Cars  |  سوق السيارات الأردني  |  استشارات تقنية", s['small']))
    story.append(PageBreak())


def build_toc(story, s):
    """Table of Contents for 20 consulting sections"""
    from reportlab.platypus import Spacer, HRFlowable, Paragraph, PageBreak
    from ar_config import ar

    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=8))
    story.append(Paragraph(ar("فهرس المحتويات"), s['h1']))
    story.append(Spacer(1, 8))

    toc_items = [
        "1. تحليل الفكرة",
        "2. تحليل المستخدمين",
        "3. تحليل الصفحات",
        "4. تحليل قاعدة البيانات",
        "5. تحليل Prisma ORM",
        "6. تحليل APIs",
        "7. تحليل الأمان",
        "8. تحليل الأداء",
        "9. تحليل الموبايل",
        "10. تحليل SEO",
        "11. تحليل تجربة المستخدم",
        "12. تحليل لوحة الإدارة",
        "13. تحليل الميزات",
        "14. تحليل سوق الأردن المعمّق",
        "15. مقارنة المنافسين",
        "16. خطة التطوير",
        "17. التحليل المالي",
        "18. التقييم النهائي",
        "19. خارطة الطريق (سنتين)",
        "20. التقرير النهائي",
        "21. إحصائيات السوق الأردني",
        "22. جدول مقارنة المنافسين",
        "23. البنية التحتية التقنية",
        "24. قسم الأمان المتقدم",
        "25. لماذا ستنجح JO Cars؟",
        "26. سيناريو الاستخدام الحقيقي",
        "27. نموذج الإيرادات التفصيلي",
        "28. خارطة الطريق 2026-2030",
        "29. التقييم النهائي المحدث",
    ]
    for item in toc_items:
        story.append(Paragraph(ar(item), s['toc_item']))

    story.append(PageBreak())


def main():
    ar_f, arb_f = register_fonts()
    s = make_styles(ar_f, arb_f)

    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=M, rightMargin=M,
        topMargin=M, bottomMargin=M,
        title="JO Cars Consulting Report",
        author="JO Cars Team",
    )

    story = []

    # Cover + TOC
    build_cover(story, s)
    build_toc(story, s)

    # 29 consulting sections
    builders = [
        build_s01, build_s02, build_s03, build_s04, build_s05,
        build_s06, build_s07, build_s08, build_s09, build_s10,
        build_s11, build_s12, build_s13, build_s14, build_s15,
        build_s16, build_s17, build_s18, build_s19, build_s20,
        build_s21, build_s22, build_s23, build_s24, build_s25,
        build_s26, build_s27, build_s28, build_s29,
    ]

    for builder in builders:
        builder(story, s)

    doc.build(story)
    print(f"Generated: {OUTPUT}")
    print(f"File size: {os.path.getsize(OUTPUT):,} bytes")


if __name__ == "__main__":
    main()
