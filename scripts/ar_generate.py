"""Main Arabic PDF Report Generator"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reportlab.platypus import SimpleDocTemplate, PageBreak
from reportlab.lib.pagesizes import A4

from ar_config import (
    PAGE_W, PAGE_H, M, GOLD, DARK, LIGHT, GRAY, WHITE, BLACK,
    register_fonts, ar, make_styles,
)
from ar_sections import (
    build_cover, build_toc,
    build_section1, build_section2, build_section3,
    build_section4, build_section5, build_section6,
    build_section7, build_section8, build_section9,
    build_section10, build_section11, build_section12,
    build_section13,
)


def footer(canvas, doc):
    canvas.saveState()
    # Gold line top
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.5)
    canvas.line(M, PAGE_H - 28, PAGE_W - M, PAGE_H - 28)
    # Page number
    canvas.setFillColor(GRAY)
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(PAGE_W / 2, 22, f"JO Cars  |  Page {doc.page}")
    # Footer line
    canvas.setStrokeColor(GOLD)
    canvas.line(M, 32, PAGE_W - M, 32)
    canvas.restoreState()


def main():
    ar_f, arb_f = register_fonts()
    styles = make_styles(ar_f, arb_f)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(os.path.dirname(script_dir), "JO_Cars_Technical_Report_AR.pdf")

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=M, rightMargin=M,
        topMargin=45, bottomMargin=45,
        title="JO Cars Technical Report - Arabic",
        author="JO Cars Platform",
    )

    story = []

    # Cover
    build_cover(story, styles)

    # TOC
    build_toc(story, styles)

    # 13 Sections
    build_section1(story, styles)
    build_section2(story, styles)
    build_section3(story, styles)
    build_section4(story, styles)
    build_section5(story, styles)
    build_section6(story, styles)
    build_section7(story, styles)
    build_section8(story, styles)
    build_section9(story, styles)
    build_section10(story, styles)
    build_section11(story, styles)
    build_section12(story, styles)
    build_section13(story, styles)

    doc.build(story, onFirstPage=footer, onLaterPages=footer)

    size_kb = os.path.getsize(output_path) / 1024
    print(f"PDF generated: {output_path}")
    print(f"Pages: {doc.page}")
    print(f"Size: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
