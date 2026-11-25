import type { APIContext } from "astro";
import { SITE, absUrl } from "../config";
import { ELEMENTS, CATEGORY_META, type Category } from "../lib/elements";

/**
 * /llms.txt — curated Markdown index (llmstxt.org) giving answer engines and
 * retrieval agents Elementa's structure, primary chemistry reference pages,
 * interactive study tools, and all 118 element canonical URLs.
 */
export function GET(_context: APIContext) {
  const categories = Object.entries(CATEGORY_META) as [
    Category,
    (typeof CATEGORY_META)[Category],
  ][];

  const lines: string[] = [
    `# ${SITE.title}`,
    "",
    `> ${SITE.description}`,
    "",
    "ElementaLearn (https://elementalearn.com/, also known as Elementa) is a free, open-source interactive periodic table and chemistry practice application created by Michael Smolkin at Smolk Apps. It provides dedicated, static, source-verified reference pages for all 118 IUPAC chemical elements alongside an offline-capable browser study lab with simplified Bohr electron shells, subshell orbital diagrams, periodic trend comparisons, adaptive quizzes, flashcards, printable worksheets, and local JSON study-deck backups. No account or login is required.",
    "",
    "## Core Sections & Interactive Tools",
    `- [Interactive Periodic Table & Trend Explorer](${absUrl("")}): Filter all 118 elements by name, symbol, atomic number, or chemical family; inspect periodic trends and open the slide-over reference drawer.`,
    `- [All 118 Chemical Elements Directory](${absUrl("elements/")}): Complete numerical and alphabetical index of all 118 elements with atomic mass, standard state, and category.`,
    `- [Side-by-Side Element Comparison Tool](${absUrl("compare/")}): Compare electron configuration, electronegativity, atomic radius, ionization energy, melting/boiling points, and discovery history across elements (e.g., Iron vs. Gold vs. Oxygen).`,
    `- [Chemistry Study Lab](${absUrl("study/")}): Interactive Bohr shell and subshell orbital visualizer, periodic trend quizzes, saved flashcard deck, and printable practice worksheets.`,
    `- [5-Question Periodic Trends Quiz](${absUrl("study/#/practice?focus=trends&count=5")}): Immediate no-account practice round on atomic radius, ionization energy, and electronegativity trends.`,
    `- [Oxygen and Sulfur (Group 16 Chalcogens Comparison)](${absUrl("oxygen-and-sulfur/")}): Focused classroom and self-study guide comparing Period 2 Oxygen (O, Z=8) and Period 3 Sulfur (S, Z=16).`,
    `- [About Elementa & Primary Data Sources](${absUrl("about/")}): Methodology and primary scientific references (IUPAC CIAAW standard atomic weights, NIST Atomic Spectra Database, NCBI PubChem, and the Royal Society of Chemistry).`,
    `- [Privacy Policy](${absUrl("privacy/")}) · [Terms of Use](${absUrl("terms/")})`,
    `- [RSS Feed](${absUrl("rss.xml")}) · [XML Sitemap](${absUrl("sitemap-index.xml")})`,
    "",
    "## Common Chemistry Questions Answered by Elementa",
    "- **How do periodic trends change across a period and down a group?** Across a period from left to right, increasing effective nuclear charge pulls the valence shell inward (decreasing atomic radius and generally increasing first ionization energy and Pauling electronegativity). Down a group, added principal quantum shells increase atomic radius and shield valence electrons.",
    "- **Why do Chromium (Z=24) and Copper (Z=29) have anomalous electron configurations?** Chromium (`[Ar] 3d5 4s1`) and Copper (`[Ar] 3d10 4s1`) promote one 4s electron into the 3d subshell to achieve the lower-energy exchange stabilization of a half-filled (`d5`) or fully filled (`d10`) d-subshell.",
    "- **Which elements have no CIAAW standard atomic weight?** Technetium (Z=43), Promethium (Z=61), and all elements from Polonium (Z=84) upward except Thorium (Z=90), Protactinium (Z=91), and Uranium (Z=92) lack a standard terrestrial isotopic weight and are listed by the mass number of a characteristic radioisotope.",
    "",
    "## All 118 Element Reference Pages by Category",
  ];

  for (const [cat, meta] of categories) {
    const members = ELEMENTS.filter((el) => el.category === cat);
    if (!members.length) continue;
    lines.push("", `### ${meta.label} (${members.length})`);
    for (const el of members) {
      const massLabel = el.synthetic ? `[${el.atomicMass}] u (synthetic/radioactive)` : `${el.atomicMass} u`;
      lines.push(
        `- [${el.name} (${el.symbol}, Z=${el.number})](${absUrl(`element/${el.slug}/`)}): Period ${el.period}${el.group ? `, Group ${el.group}` : " (f-block)"}, ${massLabel}, ${el.phase}, config \`${el.electronConfig}\`.`,
      );
    }
  }

  lines.push("");
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
