"""Arabic PDF Configuration"""
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import arabic_reshaper
from bidi.algorithm import get_display

PAGE_W, PAGE_H = A4
M = 40  # margin

GOLD = colors.HexColor("#D4A843")
DARK = colors.HexColor("#0D1117")
CARD = colors.HexColor("#1A1F2E")
BLUE = colors.HexColor("#2563EB")
GREEN = colors.HexColor("#16A34A")
RED = colors.HexColor("#DC2626")
LIGHT = colors.HexColor("#E6EDF3")
GRAY = colors.HexColor("#8B949E")
WHITE = colors.white
BLACK = colors.HexColor("#1C1C1C")
BG_LIGHT = colors.HexColor("#F6F8FA")

def register_fonts():
    """Register Arabic fonts"""
    font_path = r"C:\Windows\Fonts\tahoma.ttf"
    bold_path = r"C:\Windows\Fonts\tahomabd.ttf"
    if os.path.exists(font_path):
        pdfmetrics.registerFont(TTFont("AR", font_path))
    else:
        pdfmetrics.registerFont(TTFont("AR", "Helvetica"))
    if os.path.exists(bold_path):
        pdfmetrics.registerFont(TTFont("ARB", bold_path))
    else:
        pdfmetrics.registerFont(TTFont("ARB", "Helvetica-Bold"))
    return "AR", "ARB"

def ar(text):
    """Arabic reshaper + bidi"""
    try:
        reshaped = arabic_reshaper.reshape(text)
        return get_display(reshaped)
    except:
        return text

def make_styles(ar_f, arb_f):
    s = {}
    s['cover_title'] = ParagraphStyle('ct', fontName=arb_f, fontSize=32, leading=44, alignment=TA_CENTER, textColor=GOLD, spaceAfter=8)
    s['cover_sub'] = ParagraphStyle('cs', fontName=ar_f, fontSize=14, leading=20, alignment=TA_CENTER, textColor=LIGHT, spaceAfter=4)
    s['toc_title'] = ParagraphStyle('tt', fontName=arb_f, fontSize=20, leading=28, textColor=GOLD, spaceAfter=12, alignment=TA_CENTER)
    s['toc_item'] = ParagraphStyle('ti', fontName=ar_f, fontSize=11, leading=18, textColor=BLACK, spaceAfter=4, rightIndent=20)
    s['h1'] = ParagraphStyle('h1', fontName=arb_f, fontSize=20, leading=28, textColor=GOLD, spaceAfter=8, spaceBefore=14, alignment=TA_RIGHT)
    s['h2'] = ParagraphStyle('h2', fontName=arb_f, fontSize=14, leading=20, textColor=BLUE, spaceAfter=6, spaceBefore=10, alignment=TA_RIGHT)
    s['h3'] = ParagraphStyle('h3', fontName=arb_f, fontSize=12, leading=16, textColor=colors.HexColor("#1E40AF"), spaceAfter=4, spaceBefore=8, alignment=TA_RIGHT)
    s['body'] = ParagraphStyle('body', fontName=ar_f, fontSize=10, leading=16, textColor=BLACK, spaceAfter=4, alignment=TA_RIGHT)
    s['body_center'] = ParagraphStyle('bc', fontName=ar_f, fontSize=10, leading=16, textColor=BLACK, spaceAfter=4, alignment=TA_CENTER)
    s['bullet'] = ParagraphStyle('bul', fontName=ar_f, fontSize=9.5, leading=15, textColor=BLACK, spaceAfter=3, rightIndent=16, bulletIndent=8, alignment=TA_RIGHT)
    s['bullet_l'] = ParagraphStyle('bull', fontName=ar_f, fontSize=9.5, leading=15, textColor=BLACK, spaceAfter=3, leftIndent=16, bulletIndent=8)
    s['th'] = ParagraphStyle('th', fontName=arb_f, fontSize=9, leading=13, textColor=WHITE, alignment=TA_CENTER)
    s['td'] = ParagraphStyle('td', fontName=ar_f, fontSize=8.5, leading=12, textColor=BLACK, alignment=TA_RIGHT)
    s['td_l'] = ParagraphStyle('tdl', fontName=ar_f, fontSize=8.5, leading=12, textColor=BLACK)
    s['small'] = ParagraphStyle('sm', fontName=ar_f, fontSize=8, leading=10, textColor=GRAY, spaceAfter=2, alignment=TA_RIGHT)
    s['en'] = ParagraphStyle('en', fontName="Helvetica", fontSize=9, leading=13, textColor=colors.HexColor("#333333"), spaceAfter=3)
    s['en_bold'] = ParagraphStyle('enb', fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=BLACK, spaceAfter=4)
    return s
