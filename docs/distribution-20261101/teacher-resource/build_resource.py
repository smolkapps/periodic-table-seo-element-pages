#!/usr/bin/env python3
"""Build the editable HTML and two-page PDF from the same worksheet copy."""
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle

ROOT = Path(__file__).resolve().parent
PDF = ROOT / "oxygen-and-sulfur-worksheet.pdf"
HTML = ROOT / "oxygen-and-sulfur-worksheet.html"
INK = colors.HexColor("#172a30")
TEAL = colors.HexColor("#196370")
GRAY = colors.HexColor("#526066")
RULE = colors.HexColor("#a8b7ba")
PALE = colors.HexColor("#eef4f4")
FONT = "Helvetica"
TITLE = "Oxygen and sulfur"
SUBTITLE = "Compare electrons, shells, and periodic-table positions"
CREATOR = "2025 Smolk Apps | Created by Michael Smolkin, Elementa developer"
SOURCE_O = "https://periodic-table.rsc.org/element/8/oxygen"
SOURCE_S = "https://periodic-table.rsc.org/element/16/sulfur"

DATA_NOTE = (
    "Use neutral atoms in their ground state. Atomic number <b>Z</b> counts protons; "
    "a neutral atom has the same number of electrons as protons. "
    "<b>[He]</b> means 1s<sup>2</sup> (2 electrons); <b>[Ne]</b> means "
    "1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>6</sup> (10 electrons). "
    "A leading number, such as 3, identifies the shell <i>n</i>; a superscript "
    "counts electrons in a subshell. For these atoms, the period number equals "
    "the number of occupied shells."
)
MODEL_NOTE = (
    "<b>Model reminder:</b> Simplified Bohr-style rings help count electrons by shell. "
    "They aren't literal electron paths and don't show orbital shapes or "
    "electron probability distributions."
)
QUESTIONS = [
    ("Particle counts", "Complete the counts for each neutral atom.", "counts"),
    ("Read the configurations", "Show the electron total for each atom, including its noble-gas core.", "sums"),
    ("Count by shell", "Write each atom's electron counts from its innermost shell outward.", "atoms"),
    ("Find the periods", "Give each element's period. Explain how occupied shells support your answer.", "plain"),
    ("Compare the outer shells", "Both elements are in group 16. How many outer-shell electrons does each have? Which subshells supply them?", "plain"),
    ("Correct a claim", 'A classmate says, "Sulfur has eight more outer-shell electrons because its Z is eight larger." Correct the claim.', "plain"),
    ("Check a shell sketch", "A sulfur sketch labels its shells 2, 6, 8, from inside outward. Is it correct for the neutral ground-state atom? Correct it and explain.", "plain"),
    ("Use a model carefully", "Name one feature a shell diagram helps you compare and one feature it cannot show accurately.", "plain"),
]
ANSWERS = [
    "<b>Particle counts.</b> Oxygen: 8 protons, 8 electrons. Sulfur: 16 protons, 16 electrons. Equal positive and negative charges make each atom neutral.",
    "<b>Configurations.</b> Oxygen: 2 + 2 + 4 = 8. Sulfur: 10 + 2 + 4 = 16. The noble-gas core must be included in the total.",
    "<b>Shell counts.</b> Oxygen: 2, 6. Sulfur: 2, 8, 6. Expanded sulfur configuration: 1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>6</sup> 3s<sup>2</sup> 3p<sup>4</sup>.",
    "<b>Periods.</b> Oxygen is in period 2, with two occupied shells; sulfur is in period 3, with three occupied shells.",
    "<b>Outer shells.</b> Each has 6 outer-shell electrons. Oxygen has 2s<sup>2</sup> + 2p<sup>4</sup>; sulfur has 3s<sup>2</sup> + 3p<sup>4</sup>. Both are in group 16.",
    "<b>Claim correction.</b> Sulfur has 8 more electrons in total, while both outer shells contain 6. Sulfur has an additional occupied shell; its inner-shell counts are 2 and 8.",
    "<b>Sketch correction.</b> Use 2, 8, 6. The proposed 2, 6, 8 totals 16 but places the electrons in the wrong shells for ground-state sulfur. A correct total alone is not enough.",
    "<b>Model limits.</b> Accept comparisons of shell counts, occupied shells, or outer-shell counts. For a limit, accept that rings are not literal paths, or that the sketch does not show orbital shapes or electron probability distributions. Accept equivalent accurate wording.",
]


def para(text, size=10.2, leading=13.8, color=INK, bold=False):
    return Paragraph(text.replace("<sup>", "<super>").replace("</sup>", "</super>"), ParagraphStyle(
        "body", fontName="Helvetica-Bold" if bold else FONT, fontSize=size,
        leading=leading, textColor=color, alignment=TA_LEFT, spaceAfter=0,
    ))


def draw_p(c, text, x, top, width, size=10.2, leading=13.8, color=INK, bold=False):
    p = para(text, size, leading, color, bold)
    _, height = p.wrap(width, 1000)
    p.drawOn(c, x, top-height)
    return top-height


def table(c, rows, x, top, widths, heights=None, header=True):
    values = [[para(str(v), 9.8, 12.5) for v in row] for row in rows]
    t = Table(values, colWidths=widths, rowHeights=heights)
    commands = [
        ("GRID", (0, 0), (-1, -1), .45, RULE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        commands.append(("BACKGROUND", (0, 0), (-1, 0), PALE))
    t.setStyle(TableStyle(commands))
    _, height = t.wrap(sum(widths), 1000)
    t.drawOn(c, x, top-height)
    return top-height


def footer(c, page, label):
    c.setStrokeColor(RULE)
    c.setLineWidth(.5)
    c.line(42, 40, 570, 40)
    draw_p(c, CREATOR, 42, 31, 450, 8, 10, GRAY)
    c.setFillColor(GRAY)
    c.setFont(FONT, 8)
    c.drawRightString(570, 21, f"{label} | {page} of 2")


def heading(c, label):
    draw_p(c, label.upper(), 42, 754, 528, 9, 11, TEAL, True)
    draw_p(c, TITLE, 42, 733, 528, 27, 31, INK, True)
    return draw_p(c, SUBTITLE, 42, 697, 528, 11, 14, GRAY)


def build_pdf():
    c = canvas.Canvas(str(PDF), pagesize=(612, 792), pageCompression=1)
    c.setTitle("Oxygen and Sulfur: Comparison Worksheet and Answer Key")
    c.setAuthor("Michael Smolkin, Smolk Apps")
    c.setSubject("Standalone introductory chemistry worksheet for neutral ground-state oxygen and sulfur")
    heading(c, "Student worksheet")
    draw_p(c, "Name: ______________________________   Date: ________________", 42, 669, 528, 10, 13)
    top = table(c, [
        ["<b>Element</b>", "<b>Atomic number Z</b>", "<b>Ground-state electron configuration</b>"],
        ["Oxygen (O)", "8", "[He] 2s<sup>2</sup> 2p<sup>4</sup>"],
        ["Sulfur (S)", "16", "[Ne] 3s<sup>2</sup> 3p<sup>4</sup>"],
    ], 42, 644, [111, 115, 302], [25, 25, 25])
    top = draw_p(c, DATA_NOTE, 42, top-10, 528, 9.4, 12.4)
    top = draw_p(c, MODEL_NOTE, 42, top-8, 528, 9.4, 12.4)
    grid_top = top-17
    col_width = 254
    row_height = 101
    gap = 20
    for i, (title, prompt, kind) in enumerate(QUESTIONS):
        row, col = divmod(i, 2)
        x = 42 + col*(col_width+gap)
        y = grid_top-row*row_height
        y = draw_p(c, f"{i+1}. {title}", x, y, col_width, 10.5, 13, TEAL, True)-4
        y = draw_p(c, escape(prompt), x, y, col_width, 9.8, 12.6)-7
        bottom = grid_top-(row+1)*row_height+12-(20 if row == 3 else 0)
        if kind == "counts":
            end = table(c, [["", "Protons", "Electrons"], ["Oxygen", "", ""], ["Sulfur", "", ""]],
                        x, y, [80, 87, 87], [17, 18, 18])
            assert end >= bottom-3, (i, end, bottom)
        else:
            c.setStrokeColor(RULE)
            c.setLineWidth(.4)
            line_y = y-10
            if kind in ("sums", "atoms"):
                for atom in ("O:", "S:"):
                    c.setFillColor(INK)
                    c.setFont(FONT, 9.8)
                    c.drawString(x, line_y+2, atom)
                    c.line(x+18, line_y, x+col_width, line_y)
                    line_y -= 20
            else:
                while line_y >= bottom:
                    c.line(x, line_y, x+col_width, line_y)
                    line_y -= 18
            assert y >= bottom+10, (i, y, bottom)
    assert grid_top-4*row_height+12-20 >= 52, grid_top
    footer(c, 1, "Student")
    c.showPage()
    heading(c, "Teacher directions and answer key")
    top = draw_p(c, "<b>Suggested use:</b> Introductory chemistry, grades 9-12 (editorial suggestion).", 42, 666, 528, 10.1, 13.4)
    top = draw_p(c, "Give students page 1. They need only a pencil and the printed data, with no website or account. Ask them to show electron totals before comparing shells. Review why an atom's total electron count differs from its outer-shell count.", 42, top-7, 528, 10.1, 13.4)
    top = draw_p(c, "<b>Scope:</b> These questions describe neutral atoms in their ground state. Shell counts are a simplified representation; use the model reminder to discuss what the rings leave out.", 42, top-7, 528, 10.1, 13.4)
    top -= 20
    for i, answer in enumerate(ANSWERS):
        start = top
        top = draw_p(c, f"{i+1}.", 42, top, 20, 10.1, 13.4, TEAL, True)
        end = draw_p(c, answer, 65, start, 505, 10.1, 13.4)
        top = min(top, end)-10
    top = draw_p(c, "Reference data", 42, top-7, 528, 11, 14, TEAL, True)
    top = draw_p(c, f'Royal Society of Chemistry: <a href="{SOURCE_O}" color="#196370">Oxygen (Z 8)</a> - {SOURCE_O}', 42, top-7, 528, 8.8, 12)
    top = draw_p(c, f'Royal Society of Chemistry: <a href="{SOURCE_S}" color="#196370">Sulfur (Z 16)</a> - {SOURCE_S}', 42, top-5, 528, 8.8, 12)
    top = draw_p(c, "Element facts checked November 1, 2026. Shell counts are derived from the configurations above.", 42, top-6, 528, 8.8, 12, GRAY)
    assert top >= 52, top
    footer(c, 2, "Teacher")
    c.save()


def build_html():
    question_html = []
    for i, (title, prompt, kind) in enumerate(QUESTIONS):
        if kind == "counts":
            response = '<table class="counts"><thead><tr><th></th><th>Protons</th><th>Electrons</th></tr></thead><tbody><tr><th>Oxygen</th><td></td><td></td></tr><tr><th>Sulfur</th><td></td><td></td></tr></tbody></table>'
        elif kind in ("sums", "atoms"):
            response = '<div class="atom-line">O: <span></span></div><div class="atom-line">S: <span></span></div>'
        else:
            line_count = 3 if i >= 6 else 2
            response = '<div class="answer-lines">' + '<span></span>'*line_count + '</div>'
        question_html.append(f'<section class="question"><h2>{i+1}. {title}</h2><p>{escape(prompt)}</p>{response}</section>')
    answers_html = "\n".join(f"<li>{answer}</li>" for answer in ANSWERS)
    HTML.write_text(f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="author" content="Michael Smolkin, Smolk Apps">
<title>Oxygen and Sulfur: Comparison Worksheet and Answer Key</title>
<style>
  * {{ box-sizing: border-box; }}
  :root {{ color: #172a30; background: #e8edef; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; }}
  body {{ margin: 0; }}
  .page {{ width: 8.5in; height: 11in; margin: 20px auto; padding: .5in .583in .58in; background: white; position: relative; }}
  .eyebrow {{ color: #196370; font-size: 9pt; font-weight: bold; text-transform: uppercase; margin: 0 0 11px; }}
  h1 {{ font-size: 27pt; line-height: 1.12; margin: 0 0 8px; }}
  .subtitle {{ color: #526066; font-size: 11pt; margin: 0 0 15px; }}
  .identity {{ margin: 0 0 12px; }}
  table {{ border-collapse: collapse; width: 100%; font-size: 9.8pt; }}
  th, td {{ border: .5pt solid #a8b7ba; padding: 5pt 7pt; text-align: left; }}
  thead {{ background: #eef4f4; }}
  .data-note, .model-note {{ font-size: 9.4pt; line-height: 1.32; margin: 9px 0 0; }}
  .model-note {{ margin-top: 7px; }}
  .questions {{ display: grid; grid-template-columns: 1fr 1fr; gap: 9pt 20pt; margin-top: 17px; }}
  .question {{ height: 92pt; break-inside: avoid; }}
  .question:nth-last-child(-n+2) {{ height: 121pt; }}
  h2 {{ font-size: 10.5pt; color: #196370; margin: 0 0 4pt; line-height: 1.24; }}
  .question p {{ margin: 0 0 7pt; font-size: 9.8pt; line-height: 1.28; }}
  .counts {{ font-size: 9.8pt; }}
  .counts th, .counts td {{ padding: 3pt 5pt; height: 17pt; }}
  .counts tbody th {{ font-weight: normal; }}
  .counts th:first-child {{ width: 32%; }}
  .atom-line {{ display: flex; gap: 6pt; align-items: baseline; height: 20pt; font-size: 9.8pt; }}
  .atom-line span {{ flex: 1; border-bottom: .4pt solid #a8b7ba; height: 16pt; }}
  .answer-lines span {{ display: block; height: 18pt; border-bottom: .4pt solid #a8b7ba; }}
  .teacher p {{ font-size: 10.1pt; line-height: 1.32; margin: 0 0 7pt; }}
  .teacher .subtitle {{ font-size: 11pt; margin-bottom: 18px; }}
  .key {{ padding-left: 19pt; margin: 18pt 0; }}
  .key li {{ padding-left: 4pt; margin-bottom: 9pt; font-size: 10.1pt; line-height: 1.32; }}
  .key li::marker {{ color: #196370; font-weight: bold; }}
  .references h2 {{ font-size: 11pt; margin-bottom: 7pt; }}
  .references p {{ font-size: 8.8pt; line-height: 1.35; margin-bottom: 5pt; }}
  a {{ color: #196370; }}
  footer {{ position: absolute; left: .583in; right: .583in; bottom: .29in; padding-top: 6pt; border-top: .5pt solid #a8b7ba; font-size: 8pt; color: #526066; display: flex; justify-content: space-between; gap: 8pt; }}
  sup {{ font-size: .72em; }}
  @page {{ size: Letter; margin: 0; }}
  @media print {{
    :root {{ background: white; }}
    .page {{ margin: 0; break-after: page; }}
    .page:last-child {{ break-after: auto; }}
    * {{ print-color-adjust: exact; -webkit-print-color-adjust: exact; }}
  }}
</style>
</head>
<body>
<main>
<article class="page student" aria-label="Student worksheet, page 1 of 2">
<header><p class="eyebrow">Student worksheet</p><h1>{TITLE}</h1><p class="subtitle">{SUBTITLE}</p></header>
<p class="identity">Name: ______________________________ &nbsp; Date: ________________</p>
<table><thead><tr><th>Element</th><th>Atomic number Z</th><th>Ground-state electron configuration</th></tr></thead><tbody>
<tr><td>Oxygen (O)</td><td>8</td><td>[He] 2s<sup>2</sup> 2p<sup>4</sup></td></tr>
<tr><td>Sulfur (S)</td><td>16</td><td>[Ne] 3s<sup>2</sup> 3p<sup>4</sup></td></tr>
</tbody></table>
<p class="data-note">{DATA_NOTE}</p><p class="model-note">{MODEL_NOTE}</p>
<div class="questions">{''.join(question_html)}</div>
<footer><span>{CREATOR}</span><span>Student | 1 of 2</span></footer>
</article>
<article class="page teacher" aria-label="Teacher directions and answer key, page 2 of 2">
<header><p class="eyebrow">Teacher directions and answer key</p><h1>{TITLE}</h1><p class="subtitle">{SUBTITLE}</p></header>
<p><b>Suggested use:</b> Introductory chemistry, grades 9-12 (editorial suggestion).</p>
<p>Give students page 1. They need only a pencil and the printed data, with no website or account. Ask them to show electron totals before comparing shells. Review why an atom's total electron count differs from its outer-shell count.</p>
<p><b>Scope:</b> These questions describe neutral atoms in their ground state. Shell counts are a simplified representation; use the model reminder to discuss what the rings leave out.</p>
<ol class="key">{answers_html}</ol>
<section class="references"><h2>Reference data</h2>
<p>Royal Society of Chemistry: <a href="{SOURCE_O}">Oxygen (Z 8)</a> - {SOURCE_O}</p>
<p>Royal Society of Chemistry: <a href="{SOURCE_S}">Sulfur (Z 16)</a> - {SOURCE_S}</p>
<p>Element facts checked November 1, 2026. Shell counts are derived from the configurations above.</p>
</section>
<footer><span>{CREATOR}</span><span>Teacher | 2 of 2</span></footer>
</article>
</main>
</body>
</html>
''', encoding="utf-8")


if __name__ == "__main__":
    build_pdf()
    build_html()
    print("Created:", PDF.name, "and", HTML.name)
