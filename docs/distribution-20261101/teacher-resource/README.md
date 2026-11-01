# Oxygen and sulfur worksheet

Prepared November 1, 2026 for teacher and editorial review. This is a complete paper activity, with no website, account or external download needed to answer the questions.

- `oxygen-and-sulfur-worksheet.pdf`: two US Letter pages. Print page 1 for students; page 2 contains teacher directions and the answer key.
- `oxygen-and-sulfur-worksheet.html`: editable, self-contained HTML with two-page Letter print styles. Open it in a browser and print at 100% with browser headers/footers off. It loads no scripts, fonts or images from the internet.
- `build_resource.py`: shared question/answer copy and PDF/HTML generator. Run it with Python and ReportLab installed. The Codex bundled Python used here was `/Users/michael/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`.
- `qa/`: full-size PDF renders, thumbnail renders, HTML print renders and verification receipts. These are review evidence, not additional student pages.

Suggested use is introductory chemistry, grades 9-12; that placement is an editorial suggestion. The eight questions address neutral atoms, electron totals, shorthand configurations, shell counts, periods, group 16, outer-shell electrons and the limits of simplified Bohr-style diagrams. Both pages credit 2025 Smolk Apps and identify Michael Smolkin as Elementa's developer. The only resource links are two RSC references on the teacher page.

Checked the configurations, atomic numbers, groups and periods against the Royal Society of Chemistry's current [oxygen](https://periodic-table.rsc.org/element/8/oxygen) and [sulfur](https://periodic-table.rsc.org/element/16/sulfur) pages. Shell counts and neutral electron counts follow from those configurations and atomic numbers. The answer key distinguishes total electrons from outer-shell electrons, and explains why the incorrect sulfur arrangement 2, 6, 8 cannot be accepted merely because it totals 16.

The PDF is printable, not a fillable or tagged document. No classroom testing, accessibility certification or curricular alignment is claimed. No experiments are included. This preparation doesn't authorize selling the resource, opening a TPT store, or submitting it anywhere.

## Worklog

- Read the PDF and humanizer skills; used existing bundled ReportLab, pypdf, pdfplumber and Pillow, system Poppler, and a fresh task-owned headless Chromium for the local HTML print check. Installed no dependencies and used no authenticated browser session.
- Generated both formats from shared question and answer strings. Verified exactly two PDF pages, 612 x 792 points, eight questions and eight key entries. Checked text bounds, RSC links and electron-count arithmetic.
- Rendered both PDF pages at 144 dpi and at a 360-pixel thumbnail size; inspected every page. Added writing room to the last questions. Rendered the HTML print output, found answer lines intruding into later questions, then reduced the earlier answer-line counts and adjusted cell heights. The final HTML check reports zero response or footer overlaps, zero browser errors, and two Letter pages. Inspected the corrected HTML print pages as well.
- Saved final hashes and actual checks in `qa/verification.json`. The temporary HTML-generated PDF was removed after its page count and visual checks; its PNG review renders remain.
- Wrote only this `teacher-resource/` folder. No commit, account, payment, message, submission or publication. Parent owns any subsequent copy changes and distribution decisions.
