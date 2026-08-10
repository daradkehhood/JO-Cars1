"""Main PDF Report Generator"""
import sys
import os

# Add script directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle,
)
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

from report_config import (
    PAGE_W, PAGE_H, MARGIN, GOLD, DARK_BG, CARD_BG, BLUE,
    LIGHT_TEXT, GRAY_TEXT, WHITE, BLACK,
    register_fonts, ar, build_styles,
)
from report_sections import (
    build_cover,
    build_section1_overview,
    build_section2_techstack,
    build_section3_database,
    build_section4_apis,
    build_section5_pages,
    build_section6_security,
    build_section7_ai,
    build_section8_uiux,
    build_section9_market,
    build_section10_social,
    build_section11_swot,
    build_section12_performance,
    build_section13_roadmap,
)


def add_page_number(canvas, doc):
    """Add page numbers and footer to each page"""
    canvas.saveState()
    # Gold line at top
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, PAGE_H - 30, PAGE_W - MARGIN, PAGE_H - 30)

    # Page number
    canvas.setFillColor(GRAY_TEXT)
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(PAGE_W / 2, 25, f"JO Cars Technical Report  |  Page {doc.page}")

    # Footer line
    canvas.setStrokeColor(GOLD)
    canvas.line(MARGIN, 35, PAGE_W - MARGIN, 35)
    canvas.restoreState()


def build_pdf(output_path):
    """Build the complete PDF report"""
    # Register fonts
    arabic_font = register_fonts()
    styles = build_styles(arabic_font)

    # Create document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=50,
        bottomMargin=50,
        title="JO Cars Technical Report",
        author="JO Cars Platform",
    )

    story = []

    # --- TOC Page (as platypus) ---
    story.append(Spacer(1, 10))
    from reportlab.platypus import HRFlowable
    story.append(HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=10))
    story.append(Paragraph("Table of Contents", styles['SectionTitle']))
    story.append(Spacer(1, 12))

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
        story.append(Paragraph(f"<b>{item}</b>", styles['TOCEntry']))

    story.append(PageBreak())

    # --- Build all 13 sections ---
    build_section1_overview(story, styles)
    story.append(PageBreak())

    build_section2_techstack(story, styles)
    story.append(PageBreak())

    build_section3_database(story, styles)
    story.append(PageBreak())

    build_section4_apis(story, styles)
    story.append(PageBreak())

    build_section5_pages(story, styles)
    story.append(PageBreak())

    build_section6_security(story, styles)
    story.append(PageBreak())

    build_section7_ai(story, styles)
    story.append(PageBreak())

    build_section8_uiux(story, styles)
    story.append(PageBreak())

    build_section9_market(story, styles)
    story.append(PageBreak())

    build_section10_social(story, styles)
    story.append(PageBreak())

    build_section11_swot(story, styles)
    story.append(PageBreak())

    build_section12_performance(story, styles)
    story.append(PageBreak())

    build_section13_roadmap(story, styles)

    # --- Build document ---
    # Cover is a separate canvas draw, we'll use onFirstPage
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)

    # Now draw cover on page 1 by rebuilding with cover canvas
    # Actually, let's use a different approach: build story normally, then overlay cover
    print(f"PDF generated: {output_path}")
    print(f"Total pages: {doc.page}")


def build_cover_page(output_path):
    """Build a separate cover page PDF"""
    from reportlab.pdfgen import canvas
    from report_config import ar, register_fonts

    arabic_font = register_fonts()
    c = canvas.Canvas(output_path, pagesize=A4)

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
    stats_data = [("95", "Pages"), ("166", "APIs"), ("66", "Models"), ("51K+", "Lines")]
    total_w = len(stats_data) * box_w + (len(stats_data) - 1) * 15
    start_x = (PAGE_W - total_w) / 2
    y = 120

    for i, (num, label) in enumerate(stats_data):
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

    c.save()


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.dirname(script_dir)
    output_path = os.path.join(output_dir, "JO_Cars_Technical_Report.pdf")

    print("Generating JO Cars Technical Report...")
    print(f"Output: {output_path}")

    # Generate main PDF
    build_pdf(output_path)

    print("\nDone!")
