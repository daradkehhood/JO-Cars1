"""PDF Report Configuration - Fonts, Colors, Styles"""
import os
import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

PAGE_W, PAGE_H = A4
MARGIN = 40

# Colors
GOLD = colors.HexColor("#D4A843")
DARK_BG = colors.HexColor("#121414")
CARD_BG = colors.HexColor("#1E2020")
BLUE = colors.HexColor("#1D4ED8")
LIGHT_TEXT = colors.HexColor("#F0F0F0")
GRAY_TEXT = colors.HexColor("#A0A0A0")
WHITE = colors.white
BLACK = colors.black
SECTION_BG = colors.HexColor("#F5F5F5")

def register_fonts():
    """Register Arabic-compatible fonts"""
    font_dirs = [
        r"C:\Windows\Fonts",
        r"/usr/share/fonts",
        "/usr/local/share/fonts",
    ]
    arabic_font = None
    for d in font_dirs:
        for name in ["arial.ttf", "Arial.ttf", "arialbd.ttf", "tahoma.ttf", "Tahoma.ttf"]:
            path = os.path.join(d, name)
            if os.path.exists(path):
                try:
                    pdfmetrics.registerFont(TTFont("ArabicFont", path))
                    arabic_font = "ArabicFont"
                    break
                except:
                    pass
        if arabic_font:
            break
    if not arabic_font:
        arabic_font = "Helvetica"
    return arabic_font

def ar(text):
    """Reshape and reorder Arabic text for PDF rendering"""
    try:
        reshaped = arabic_reshaper.reshape(text)
        return get_display(reshaped)
    except:
        return text

def build_styles(arabic_font):
    """Build paragraph styles"""
    styles = getSampleStyleSheet()
    base_font = arabic_font if arabic_font != "Helvetica" else "Helvetica"

    styles.add(ParagraphStyle(
        'CoverTitle', fontName=base_font, fontSize=28, leading=36,
        alignment=TA_CENTER, textColor=GOLD, spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        'CoverSubtitle', fontName=base_font, fontSize=14, leading=20,
        alignment=TA_CENTER, textColor=LIGHT_TEXT, spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        'SectionTitle', fontName=base_font, fontSize=18, leading=24,
        textColor=GOLD, spaceAfter=10, spaceBefore=16,
        borderPadding=(0, 0, 4, 0),
    ))
    styles.add(ParagraphStyle(
        'SubSection', fontName=base_font, fontSize=13, leading=18,
        textColor=BLUE, spaceAfter=6, spaceBefore=10,
    ))
    styles.add(ParagraphStyle(
        'BodyText2', fontName=base_font, fontSize=10, leading=15,
        textColor=BLACK, spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        'BodyArabic', fontName=base_font, fontSize=10, leading=15,
        textColor=BLACK, spaceAfter=4, alignment=TA_RIGHT,
    ))
    styles.add(ParagraphStyle(
        'BulletItem', fontName=base_font, fontSize=10, leading=14,
        textColor=BLACK, spaceAfter=2, leftIndent=20, bulletIndent=8,
    ))
    styles.add(ParagraphStyle(
        'TableHeader', fontName=base_font, fontSize=9, leading=12,
        textColor=WHITE, alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        'TableCell', fontName=base_font, fontSize=8, leading=11,
        textColor=BLACK,
    ))
    styles.add(ParagraphStyle(
        'SmallGray', fontName=base_font, fontSize=8, leading=10,
        textColor=GRAY_TEXT, spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        'TOCEntry', fontName=base_font, fontSize=12, leading=18,
        textColor=BLACK, spaceAfter=4, leftIndent=10,
    ))
    styles.add(ParagraphStyle(
        'StatNumber', fontName=base_font, fontSize=22, leading=28,
        textColor=GOLD, alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        'StatLabel', fontName=base_font, fontSize=9, leading=12,
        textColor=GRAY_TEXT, alignment=TA_CENTER,
    ))
    return styles
