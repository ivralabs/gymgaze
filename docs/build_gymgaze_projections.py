#!/usr/bin/env python3
"""
GymGaze Financial Projections — Standalone PDF Builder
Clean financial document, black and white, Times-Roman, A4 portrait.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import os

OUTPUT_PATH = "/Users/ivralabs/.openclaw/workspace/projects/gymgaze/docs/GymGaze-Financial-Projections.pdf"

# ─── Styles ──────────────────────────────────────────────────────────────────

styles = getSampleStyleSheet()

# Body
body_style = ParagraphStyle(
    'GGBody',
    fontName='Times-Roman',
    fontSize=9.5,
    leading=14,
    textColor=colors.black,
    spaceAfter=4,
)

# Section heading
h1_style = ParagraphStyle(
    'GGH1',
    fontName='Times-Bold',
    fontSize=13,
    leading=16,
    textColor=colors.black,
    spaceBefore=14,
    spaceAfter=6,
)

# Sub-heading / label
h2_style = ParagraphStyle(
    'GGH2',
    fontName='Times-Bold',
    fontSize=10.5,
    leading=13,
    textColor=colors.black,
    spaceBefore=8,
    spaceAfter=4,
)

# Table cell — normal
cell_style = ParagraphStyle(
    'GGCell',
    fontName='Times-Roman',
    fontSize=9,
    leading=12,
    textColor=colors.black,
)

# Table cell — bold
cell_bold_style = ParagraphStyle(
    'GGCellBold',
    fontName='Times-Bold',
    fontSize=9,
    leading=12,
    textColor=colors.black,
)

# Table header
hdr_style = ParagraphStyle(
    'GGHdr',
    fontName='Times-Bold',
    fontSize=9,
    leading=12,
    textColor=colors.white,
)

# Small disclaimer
small_style = ParagraphStyle(
    'GGSmall',
    fontName='Times-Roman',
    fontSize=7.5,
    leading=10,
    textColor=colors.black,
    spaceBefore=8,
)

note_style = ParagraphStyle(
    'GGNote',
    fontName='Times-Roman',
    fontSize=8.5,
    leading=11,
    textColor=colors.black,
    spaceBefore=4,
    spaceAfter=4,
)

# ─── Table helpers ────────────────────────────────────────────────────────────

BLACK = colors.black
WHITE = colors.white
LIGHT_GREY = colors.HexColor('#E8E8E8')
MID_GREY = colors.HexColor('#CCCCCC')
DARK_GREY = colors.HexColor('#444444')

def std_table_style(has_header=True):
    """Standard two-tone table style."""
    cmds = [
        ('FONTNAME', (0, 0), (-1, -1), 'Times-Roman'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('LEADING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.4, MID_GREY),
        ('ROWBACKGROUNDS', (0, 1 if has_header else 0), (-1, -1), [WHITE, LIGHT_GREY]),
    ]
    if has_header:
        cmds += [
            ('BACKGROUND', (0, 0), (-1, 0), DARK_GREY),
            ('FONTNAME', (0, 0), (-1, 0), 'Times-Bold'),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ]
    return TableStyle(cmds)

def p(text, style=None):
    """Convenience: wrap text in Paragraph."""
    return Paragraph(text, style or cell_style)

def pb(text):
    """Bold cell paragraph."""
    return Paragraph(text, cell_bold_style)

def ph(text):
    """Header cell paragraph."""
    return Paragraph(text, hdr_style)

# ─── Header / Footer canvas ───────────────────────────────────────────────────

class HeaderFooterCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_header_footer(self, total_pages):
        W, H = A4
        margin = 20 * mm

        # ── Header ──
        self.setFont('Times-Bold', 9)
        self.setFillColor(colors.black)
        self.drawString(margin, H - 13 * mm, 'GymGaze (Pty) Ltd \u2014 Financial Projections & Investment Summary')
        self.drawRightString(W - margin, H - 13 * mm, 'CONFIDENTIAL')

        self.setFont('Times-Roman', 8)
        self.drawString(margin, H - 18 * mm, 'October 2026')

        # Header rule
        self.setStrokeColor(colors.black)
        self.setLineWidth(0.6)
        self.line(margin, H - 20 * mm, W - margin, H - 20 * mm)

        # ── Footer ──
        self.setLineWidth(0.4)
        self.line(margin, 14 * mm, W - margin, 14 * mm)

        self.setFont('Times-Roman', 8)
        page_num = self._pageNumber
        self.drawCentredString(W / 2, 9 * mm, f'Page {page_num} of {total_pages}')


# ─── Document builder ─────────────────────────────────────────────────────────

def build():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=26 * mm,
        bottomMargin=22 * mm,
        title='GymGaze Financial Projections & Investment Summary',
        author='GymGaze (Pty) Ltd',
        subject='Investor Document — October 2026',
    )

    story = []
    W = A4[0] - 40 * mm  # usable width

    def rule():
        return HRFlowable(width='100%', thickness=0.4, color=MID_GREY, spaceAfter=6, spaceBefore=2)

    def section(title):
        story.append(Spacer(1, 4))
        story.append(Paragraph(title, h1_style))
        story.append(rule())

    # ══════════════════════════════════════════════════════════════════════════
    # 1. Business Overview
    # ══════════════════════════════════════════════════════════════════════════
    section('1. Business Overview')
    story.append(Paragraph(
        'GymGaze is a digital out-of-home advertising network installed across gym venues in South Africa. '
        'The company installs screens, manages content delivery via the Cuecast CMS platform (licensed), '
        'and sells advertising inventory to brands targeting gym-goers. '
        'GymGaze currently operates across 14 Edge Fitness venues with 102 screens in 4 provinces, '
        'reaching an estimated 35,000+ gym members across the network.',
        body_style
    ))

    # ══════════════════════════════════════════════════════════════════════════
    # 2. Network Summary
    # ══════════════════════════════════════════════════════════════════════════
    section('2. Network Summary')
    net_data = [
        [ph('Metric'), ph('Detail')],
        [p('Launch Partner'), p('Edge Fitness')],
        [p('Current Venues'), p('14')],
        [p('Current Screens'), p('102')],
        [p('Provinces'), p('Eastern Cape, Gauteng, Western Cape, KwaZulu-Natal')],
        [p('Estimated Gym Members (network)'), p('35,000+')],
        [p('Content Management'), p('Cuecast CMS (licensed)')],
        [p('Phase 2 Venues (Year 2)'), p('23 (Edge Fitness +9)')],
        [p('Phase 2 Screens (Year 2)'), p('~165')],
    ]
    col_w = [W * 0.42, W * 0.58]
    net_tbl = Table(net_data, colWidths=col_w)
    net_tbl.setStyle(std_table_style())
    story.append(net_tbl)

    # ══════════════════════════════════════════════════════════════════════════
    # 3. Revenue Model
    # ══════════════════════════════════════════════════════════════════════════
    section('3. Revenue Model')
    story.append(Paragraph(
        'GymGaze earns revenue by selling advertising slots on its screen network. Each screen runs a '
        '251-second content loop with 16 advertising slots. Pricing is CPM-based (cost per thousand '
        'impressions). Revenue is distributed as follows:',
        body_style
    ))
    story.append(Spacer(1, 4))

    rev_data = [
        [ph('Party'), ph('Share'), ph('Notes')],
        [p('Edge Fitness'), p('30% of gross'), p('Venue partner share')],
        [p('GymGaze Gross'), p('70% of gross'), p('After venue partner')],
        [p('Sales Rep Commission'), p('7% of GymGaze gross'), p('Capped at 7%')],
        [p('Broker Fee'), p('7% of GymGaze gross'), p('Introducer, capped at 7%')],
        [pb('GymGaze Net Revenue'), pb('56% of gross'), pb('After all commissions')],
    ]
    col_w3 = [W * 0.32, W * 0.28, W * 0.40]
    rev_tbl = Table(rev_data, colWidths=col_w3)
    rev_tbl.setStyle(std_table_style())
    # Bold last row
    rev_tbl.setStyle(TableStyle([
        ('FONTNAME', (0, -1), (-1, -1), 'Times-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), LIGHT_GREY),
    ]))
    story.append(rev_tbl)

    # ══════════════════════════════════════════════════════════════════════════
    # 4. Key Assumptions
    # ══════════════════════════════════════════════════════════════════════════
    section('4. Key Assumptions')
    assm_data = [
        [ph('Assumption'), ph('Value')],
        [p('Content loop duration'), p('251 seconds')],
        [p('Ad slots per loop'), p('16')],
        [p('Operating hours per week'), p('108 hours (6am\u201310pm, 7 days)')],
        [p('Estimated impressions per play'), p('5\u201312 (varies by scenario)')],
        [p('Impression-to-viewer ratio'), p('55% of gym traffic')],
        [p('CPM range'), p('R65\u2013R95')],
        [p('Widget sponsorships (3 available)'), p('R142,000/yr each')],
    ]
    col_w2 = [W * 0.55, W * 0.45]
    assm_tbl = Table(assm_data, colWidths=col_w2)
    assm_tbl.setStyle(std_table_style())
    story.append(assm_tbl)

    # ══════════════════════════════════════════════════════════════════════════
    # 5. Three-Scenario Revenue Projections — Year 1
    # ══════════════════════════════════════════════════════════════════════════
    section('5. Three-Scenario Revenue Projections \u2014 Year 1 (102 Screens)')
    story.append(Paragraph(
        'Projections across three sell-through scenarios. Conservative: 30% sell-through, CPM R65, '
        '5 impressions/play. Base: 55% sell-through, CPM R75, 8 impressions/play. '
        'Optimistic: 80% sell-through, CPM R95, 12 impressions/play.',
        body_style
    ))
    story.append(Spacer(1, 4))

    scen_data = [
        [ph(''), ph('Conservative'), ph('Base'), ph('Optimistic')],
        [p('Sell-Through'), p('30%'), p('55%'), p('80%')],
        [p('CPM Rate'), p('R65'), p('R75'), p('R95')],
        [p('Impressions / Play'), p('5'), p('8'), p('12')],
        [p('Gross Revenue'), p('R7,000,000'), p('R23,800,000'), p('R65,900,000')],
        [p('Edge Fitness Share (30%)'), p('R2,100,000'), p('R7,200,000'), p('R19,800,000')],
        [p('GymGaze Gross (70%)'), p('R4,900,000'), p('R16,600,000'), p('R46,100,000')],
        [p('Sales Commission (7%)'), p('R493,000'), p('R1,700,000'), p('R4,600,000')],
        [p('Broker Fee (7%)'), p('R493,000'), p('R1,700,000'), p('R4,600,000')],
        [p('GymGaze Net Revenue'), p('R3,914,000'), p('R13,200,000'), p('R36,900,000')],
        [p('Operating Costs'), p('R1,333,032'), p('R1,333,032'), p('R1,333,032')],
        [pb('Net Profit / Year'), pb('R2,611,515'), pb('R12,017,743'), pb('R35,563,656')],
        [pb('Net Profit / Month'), pb('R217,626'), pb('R1,001,479'), pb('R2,963,638')],
    ]
    col_w4 = [W * 0.34, W * 0.22, W * 0.22, W * 0.22]
    scen_tbl = Table(scen_data, colWidths=col_w4)
    scen_tbl.setStyle(std_table_style())
    scen_tbl.setStyle(TableStyle([
        ('FONTNAME', (0, -2), (-1, -1), 'Times-Bold'),
        ('BACKGROUND', (0, -2), (-1, -1), LIGHT_GREY),
        ('LINEABOVE', (0, -2), (-1, -2), 0.6, BLACK),
    ]))
    story.append(scen_tbl)

    # ══════════════════════════════════════════════════════════════════════════
    # 6. Phase 2 Projections
    # ══════════════════════════════════════════════════════════════════════════
    section('6. Phase 2 Projections \u2014 Year 2 (165 Screens, 23 Venues)')
    story.append(Paragraph(
        'Edge Fitness is adding 9 new gyms over the next 2 years, growing the network from 14 to 23 venues '
        'and from 102 to approximately 165 screens. Phase 2 operating costs increase modestly to R1,500,000/yr '
        'to accommodate an expanded team and additional venue rentals. No additional capital investment is required.',
        body_style
    ))
    story.append(Spacer(1, 4))

    ph2_data = [
        [ph('Scenario'), ph('Sell-Through'), ph('CPM'), ph('Gross Revenue'), ph('GymGaze Net Profit/yr')],
        [p('Conservative'), p('35%'), p('R65'), p('R13,300,000'), pb('R5,700,000')],
        [p('Base'), p('60%'), p('R75'), p('R42,100,000'), pb('R21,800,000')],
        [p('Optimistic'), p('80%'), p('R95'), p('R106,600,000'), pb('R57,900,000')],
    ]
    col_w5 = [W * 0.22, W * 0.16, W * 0.12, W * 0.25, W * 0.25]
    ph2_tbl = Table(ph2_data, colWidths=col_w5)
    ph2_tbl.setStyle(std_table_style())
    story.append(ph2_tbl)

    # ══════════════════════════════════════════════════════════════════════════
    # 7. Phase 3 — Multi-Chain Expansion
    # ══════════════════════════════════════════════════════════════════════════
    section('7. Phase 3 \u2014 Multi-Chain Expansion')
    story.append(Paragraph(
        "GymGaze's model is chain-agnostic. The same Cuecast platform, operations team and sales process "
        'can be deployed across any gym chain partnership. South Africa has an estimated 300+ independent '
        'gym clubs operating 5\u201320 locations, presenting a significant addressable network opportunity. '
        'Conservative Phase 3 assumption: 3 new chain partners \u00d7 avg 8 venues = 24 additional venues, '
        'yielding a combined network of 47 venues and \u2248300 screens by Year 3.',
        body_style
    ))
    story.append(Spacer(1, 4))

    ph3_data = [
        [ph('Chain'), ph('Est. Venues'), ph('Region Focus'), ph('Status')],
        [p('Workout Gym'), p('~15'), p('KwaZulu-Natal'), p('Target')],
        [p('Planet Fitness'), p('20+'), p('Gauteng'), p('Target')],
        [p('Anytime Fitness SA'), p('30+'), p('National'), p('Target')],
        [p('Pure Gym SA'), p('10+'), p('National'), p('Target')],
        [p('Snap Fitness SA'), p('~15'), p('National'), p('Target')],
    ]
    col_w6 = [W * 0.30, W * 0.20, W * 0.28, W * 0.22]
    ph3_tbl = Table(ph3_data, colWidths=col_w6)
    ph3_tbl.setStyle(std_table_style())
    story.append(ph3_tbl)

    # ══════════════════════════════════════════════════════════════════════════
    # 8. Annual Operating Cost Structure
    # ══════════════════════════════════════════════════════════════════════════
    section('8. Annual Operating Cost Structure')
    cost_data = [
        [ph('Cost Item'), ph('Annual Amount')],
        [p('Venue rental (Edge Fitness, 14 venues)'), p('R344,400')],
        [p('Internet connectivity (14 SIM data plans)'), p('R100,632')],
        [p('Salaries (Sales Rep + Technician + Coordinator)'), p('R780,000')],
        [p('Equipment & public liability insurance'), p('R33,600')],
        [p('Platform infrastructure (12 months)'), p('R14,400')],
        [p('Miscellaneous / contingency'), p('R60,000')],
        [pb('Total Annual Operating Costs'), pb('R1,333,032')],
    ]
    col_w7 = [W * 0.68, W * 0.32]
    cost_tbl = Table(cost_data, colWidths=col_w7)
    cost_tbl.setStyle(std_table_style())
    cost_tbl.setStyle(TableStyle([
        ('FONTNAME', (0, -1), (-1, -1), 'Times-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), LIGHT_GREY),
        ('LINEABOVE', (0, -1), (-1, -1), 0.6, BLACK),
    ]))
    story.append(cost_tbl)

    # ══════════════════════════════════════════════════════════════════════════
    # 9. Investor Returns
    # ══════════════════════════════════════════════════════════════════════════
    section('9. Investor Returns')
    inv_data = [
        [ph('Metric'), ph('Conservative'), ph('Base'), ph('Optimistic')],
        [p('GymGaze Net Profit / Year'), p('R2,611,515'), p('R12,017,743'), p('R35,563,656')],
        [p('Investor Dividend (20%)'), p('R522,303 / yr'), p('R2,403,549 / yr'), p('R7,112,731 / yr')],
        [p('Bi-Annual Payment'), p('R261,151'), p('R1,201,774'), p('R3,556,365')],
        [p('Payback Period'), p('2.8 years'), p('0.6 years'), p('0.2 years')],
        [p('Buyback Trigger'), p('At R1M ARR'), p('At R1M ARR'), p('At R1M ARR')],
        [p('Buyback Price'), p('R2,900,000 (2\u00d7)'), p('R2,900,000 (2\u00d7)'), p('R2,900,000 (2\u00d7)')],
    ]
    col_w8 = [W * 0.34, W * 0.22, W * 0.22, W * 0.22]
    inv_tbl = Table(inv_data, colWidths=col_w8)
    inv_tbl.setStyle(std_table_style())
    story.append(inv_tbl)
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        '<i>Conservative scenario used as planning baseline. All figures exclude VAT. '
        'Projections based on industry CPM benchmarks and contracted venue data.</i>',
        note_style
    ))

    # ══════════════════════════════════════════════════════════════════════════
    # 10. Use of Funds
    # ══════════════════════════════════════════════════════════════════════════
    section('10. Use of Funds \u2014 R1,450,000')
    fund_data = [
        [ph('Item'), ph('Amount')],
        [p('Digital screens \u2014 102 TVs (portrait + landscape)'), p('R488,000')],
        [p('Android media players \u2014 25 units'), p('R20,150')],
        [p('HDMI splitters \u2014 25 units (various port counts)'), p('R6,540')],
        [p('Installation labour (14 venues)'), p('R42,000')],
        [p('Cables, brackets and power strips'), p('R43,860')],
        [p('6-month operating runway (salaries)'), p('R450,000')],
        [p('SIM data \u2014 12 months, 14 venues'), p('R100,632')],
        [p('Equipment and liability insurance (12mo)'), p('R33,600')],
        [p('Platform infrastructure (12mo)'), p('R14,400')],
        [p('Uniforms + misc setup costs'), p('R18,900')],
        [p('Sales commission buffer (months 1\u20133)'), p('R15,000')],
        [p('Contingency reserve'), p('R216,918')],
        [pb('Total'), pb('R1,450,000')],
    ]
    col_w9 = [W * 0.68, W * 0.32]
    fund_tbl = Table(fund_data, colWidths=col_w9)
    fund_tbl.setStyle(std_table_style())
    fund_tbl.setStyle(TableStyle([
        ('FONTNAME', (0, -1), (-1, -1), 'Times-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), LIGHT_GREY),
        ('LINEABOVE', (0, -1), (-1, -1), 0.6, BLACK),
    ]))
    story.append(fund_tbl)

    # ══════════════════════════════════════════════════════════════════════════
    # 11. 5-Year Outlook
    # ══════════════════════════════════════════════════════════════════════════
    section('11. Five-Year Outlook')
    story.append(Paragraph(
        'GymGaze is designed to scale. Phase 1 (Year 1) establishes the network, proves the model and generates '
        'strong returns at even conservative sell-through rates. Phase 2 (Year 2) leverages Edge Fitness\'s own '
        'expansion to grow the network to 23 venues without additional capital. Phase 3 (Years 3\u20135) adds '
        'independent chain partnerships at minimal incremental cost, building toward a 300+ screen national network.',
        body_style
    ))
    story.append(Spacer(1, 4))

    outlook_data = [
        [ph('Year'), ph('Venues'), ph('Screens'), ph('Est. Net Profit (Conservative)')],
        [p('Year 1'), p('14'), p('102'), p('R2.6M')],
        [p('Year 2'), p('23'), p('165'), p('R5.7M')],
        [p('Year 3'), p('35'), p('240'), p('R9.2M (est.)')],
        [p('Year 4'), p('47'), p('310'), p('R13.5M (est.)')],
        [p('Year 5'), p('60+'), p('400+'), p('R18M+ (est.)')],
    ]
    col_w10 = [W * 0.18, W * 0.18, W * 0.18, W * 0.46]
    outlook_tbl = Table(outlook_data, colWidths=col_w10)
    outlook_tbl.setStyle(std_table_style())
    story.append(outlook_tbl)
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        '<i>At 500+ screens, GymGaze becomes a Series A candidate or acquisition target for established '
        'OOH media groups. Target exit valuation: R20M\u2013R25M.</i>',
        note_style
    ))

    # ══════════════════════════════════════════════════════════════════════════
    # 12. Disclaimer
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width='100%', thickness=0.4, color=MID_GREY, spaceAfter=4))
    story.append(Paragraph(
        'This document contains forward-looking projections prepared for investor discussion purposes. '
        'Projections are based on industry benchmarks and contracted venue data. Actual results may differ '
        'materially. Prepared by GymGaze (Pty) Ltd. October 2026. Confidential \u2014 not for distribution.',
        small_style
    ))

    # ── Build ──
    doc.build(story, canvasmaker=HeaderFooterCanvas)
    print(f'[OK] PDF written to: {OUTPUT_PATH}')
    size_kb = os.path.getsize(OUTPUT_PATH) // 1024
    print(f'[OK] File size: {size_kb} KB')


if __name__ == '__main__':
    build()
