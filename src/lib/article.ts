/**
 * Deterministic per-element article generation.
 *
 * The SEO goal is that every one of the 118 element pages ships substantive,
 * unique, indexable prose in the static HTML. Rather than hand-writing 118
 * articles, we synthesise a real article from each element's structured data
 * plus a small set of curated, human-written highlights. The output is the SAME
 * content rendered on the dedicated /element/<slug> page and embedded in the
 * main table's "more info" panel — single source of truth, no drift.
 */

import {
  type Element,
  categoryLabel,
  getElementBySymbol,
  getElementByNumber,
} from "./elements";

/** Curated one-line highlight per element (uses/notability). Keyed by symbol. */
const HIGHLIGHTS: Record<string, string> = {
  H: "the lightest and most abundant element in the universe, the fuel of stars and the basis of water",
  He: "an inert noble gas used to cool superconducting magnets and to lift balloons",
  Li: "a soft alkali metal at the heart of rechargeable lithium-ion batteries and mood-stabilising medicine",
  Be: "a light, stiff metal prized for X-ray windows and aerospace alloys, but highly toxic",
  B: "a metalloid essential to borosilicate glass, detergents, and neutron-absorbing control rods",
  C: "the backbone of all known life, appearing as graphite, diamond, and graphene",
  N: "the gas that makes up 78% of Earth's atmosphere and a key building block of proteins and fertiliser",
  O: "the reactive gas animals breathe and the most abundant element in the Earth's crust",
  F: "the most reactive and electronegative of all elements, used in toothpaste and Teflon",
  Ne: "a noble gas famous for the orange-red glow of advertising signs",
  Na: "a soft, highly reactive metal whose ion is half of common table salt",
  Mg: "a light structural metal and the central atom of chlorophyll",
  Al: "the most abundant metal in the crust, lightweight and endlessly recyclable",
  Si: "the metalloid that underpins the entire semiconductor industry and most of the sand on Earth",
  P: "a reactive nonmetal vital to DNA, ATP, and bone, and a key fertiliser nutrient",
  S: "a yellow nonmetal used to make sulfuric acid, the most-produced industrial chemical",
  Cl: "a greenish toxic gas used to disinfect water and the other half of table salt",
  Ar: "the most common noble gas on Earth, used as an inert shielding atmosphere in welding",
  K: "a reactive alkali metal essential to nerve function and a major fertiliser nutrient",
  Ca: "the metal whose compounds build bones, teeth, shells, and limestone",
  Sc: "a light transition metal used in high-performance aluminium-scandium alloys",
  Ti: "a strong, corrosion-resistant metal used in jet engines, implants, and white pigment",
  V: "a transition metal that hardens steel and powers grid-scale flow batteries",
  Cr: "the metal that gives stainless steel its shine and corrosion resistance",
  Mn: "an essential steel-making additive and a component of dry-cell batteries",
  Fe: "the most-used metal on Earth, the core of steel and of our own blood",
  Co: "a magnetic metal used in jet-engine superalloys and lithium-ion battery cathodes",
  Ni: "a corrosion-resistant metal used in stainless steel, coins, and rechargeable batteries",
  Cu: "an excellent conductor used in wiring, plumbing, and bronze since antiquity",
  Zn: "the metal used to galvanise steel against rust and an essential dietary mineral",
  Ga: "a metal that melts in your hand, used in LEDs and high-speed electronics",
  Ge: "a metalloid central to early transistors and modern fibre-optic and infrared optics",
  As: "a notoriously toxic metalloid used in semiconductors and, historically, poisons",
  Se: "a nonmetal essential in trace amounts, used in photocells and glassmaking",
  Br: "one of only two elements liquid at room temperature, used in flame retardants",
  Kr: "a noble gas used in high-performance lighting and once to define the metre",
  Rb: "a soft alkali metal used in atomic clocks and specialty glass",
  Sr: "an alkaline earth metal that gives fireworks their brilliant red colour",
  Y: "a transition metal used in LED phosphors, lasers, and superconductors",
  Zr: "a corrosion-resistant metal used to clad nuclear fuel rods",
  Nb: "a metal that forms powerful superconducting magnets for MRI machines",
  Mo: "a refractory metal that strengthens steel and catalyses petroleum refining",
  Tc: "the lightest element with no stable isotope, vital to medical imaging",
  Ru: "a hard platinum-group metal used in electronics and catalysis",
  Rh: "a rare, reflective metal central to catalytic converters",
  Pd: "a platinum-group metal used in catalytic converters and hydrogen purification",
  Ag: "the best electrical conductor of all metals, long used in coinage and photography",
  Cd: "a toxic metal used in pigments and rechargeable NiCd batteries",
  In: "a soft metal used in the transparent conductor of touchscreens and solar cells",
  Sn: "a soft metal used in solder, tin cans, and bronze",
  Sb: "a metalloid used in flame retardants and lead-acid battery alloys",
  Te: "a brittle metalloid used in thin-film solar panels and alloys",
  I: "a halogen essential to the thyroid gland and used as an antiseptic",
  Xe: "a heavy noble gas used in high-intensity lamps and ion thrusters",
  Cs: "the most reactive metal and the basis of the atomic-clock definition of the second",
  Ba: "an alkaline earth metal whose sulfate is swallowed for X-ray contrast imaging",
  La: "the first lanthanide, used in camera lenses and hybrid-car batteries",
  Ce: "the most abundant rare-earth metal, used in catalytic converters and polishing powders",
  Pr: "a rare-earth metal used in powerful magnets and to colour glass yellow-green",
  Nd: "the metal behind the strongest permanent magnets, in motors and headphones",
  Pm: "the only radioactive lanthanide, once used in luminous paint",
  Sm: "a rare-earth metal used in high-temperature permanent magnets",
  Eu: "a rare-earth metal that provides the red and blue phosphors in displays",
  Gd: "a rare-earth metal used as an MRI contrast agent and in neutron shielding",
  Tb: "a rare-earth metal used in green phosphors and magnetostrictive alloys",
  Dy: "a rare-earth metal added to magnets to keep them strong at high temperature",
  Ho: "a rare-earth metal with the highest magnetic strength of any element",
  Er: "a rare-earth metal used to amplify signals in fibre-optic cables",
  Tm: "the rarest stable rare-earth metal, used in portable X-ray sources",
  Yb: "a rare-earth metal used in atomic clocks and as a doping agent in lasers",
  Lu: "the heaviest and hardest rare-earth metal, used in PET-scan detectors",
  Hf: "a metal with an enormous neutron-capture cross-section, used in reactor control rods",
  Ta: "a corrosion-proof metal used in compact capacitors and surgical implants",
  W: "the metal with the highest melting point, used in light-bulb filaments and drill bits",
  Re: "one of the rarest metals, used in jet-engine superalloys",
  Os: "the densest naturally occurring element, used in hard, wear-resistant tips",
  Ir: "the most corrosion-resistant metal and the marker of the dinosaur-killing asteroid",
  Pt: "a precious catalytic metal used in converters, jewellery, and cancer drugs",
  Au: "the prototypical precious metal, unreactive, conductive, and endlessly malleable",
  Hg: "the only metal liquid at room temperature, long used in thermometers despite its toxicity",
  Tl: "a soft, highly toxic metal once used in rat poison and now in electronics",
  Pb: "a dense, soft metal long used in pipes and paint before its toxicity was understood",
  Bi: "a brittle metal used in stomach medicine and low-melting-point alloys",
  Po: "an intensely radioactive metalloid, infamous as a poison",
  At: "the rarest naturally occurring element on Earth, studied for cancer therapy",
  Rn: "a radioactive noble gas that seeps from rock and is a leading cause of lung cancer",
  Fr: "the second-rarest naturally occurring element, intensely radioactive",
  Ra: "a luminous radioactive metal once used in glow-in-the-dark paint",
  Ac: "the radioactive element that gives the actinide series its name",
  Th: "a weakly radioactive metal explored as a nuclear fuel",
  Pa: "a rare, dense radioactive actinide with few practical uses",
  U: "the heaviest naturally abundant element, the primary fuel of nuclear reactors and weapons",
  Np: "the first transuranium element, a by-product of nuclear reactors",
  Pu: "a synthetic actinide central to nuclear weapons and spacecraft power sources",
  Am: "a synthetic actinide used in household smoke detectors",
  Cm: "a synthetic actinide used as a power source in space probes",
  Bk: "a synthetic actinide produced only in tiny amounts for research",
  Cf: "a synthetic actinide used as a portable neutron source",
  Es: "a synthetic actinide first found in the debris of a hydrogen-bomb test",
  Fm: "a synthetic actinide, the heaviest element that can be made by neutron bombardment",
  Md: "a synthetic actinide named after Dmitri Mendeleev",
  No: "a synthetic actinide named after Alfred Nobel",
  Lr: "the final actinide, a synthetic element produced atom by atom",
  Rf: "the first transactinide, a synthetic superheavy transition metal",
  Db: "a synthetic superheavy element named after the Dubna research city",
  Sg: "a synthetic superheavy element named after Glenn Seaborg",
  Bh: "a synthetic superheavy element named after Niels Bohr",
  Hs: "a synthetic superheavy element named after the German state of Hesse",
  Mt: "a synthetic superheavy element named after Lise Meitner",
  Ds: "a synthetic superheavy element named after the city of Darmstadt",
  Rg: "a synthetic superheavy element named after Wilhelm Röntgen",
  Cn: "a synthetic superheavy element named after Nicolaus Copernicus",
  Nh: "the first element discovered in Asia, named after Japan",
  Fl: "a synthetic superheavy element named after the Flerov Laboratory",
  Mc: "a synthetic superheavy element named after the Moscow region",
  Lv: "a synthetic superheavy element named after the Lawrence Livermore lab",
  Ts: "the second-heaviest element, a synthetic halogen named after Tennessee",
  Og: "the heaviest known element, a synthetic noble gas named after Yuri Oganessian",
};

/** Format the atomic mass, bracketing it for synthetic/unstable elements. */
export function formatMass(element: Element): string {
  return element.synthetic ? `[${Math.round(element.atomicMass)}]` : String(element.atomicMass);
}

/** Human phrase for discovery, e.g. "discovered in 1869 by Mendeleev" or "known since antiquity". */
export function discoveryPhrase(element: Element): string {
  if (element.discoveredBy === "Ancient" || element.discoveredYear === null) {
    return "has been known since antiquity";
  }
  return `was discovered in ${element.discoveredYear} by ${element.discoveredBy}`;
}

export interface ArticleSection {
  heading: string;
  body: string;
}

export interface Article {
  /** Short summary used for meta description + card text + panel intro. */
  summary: string;
  /** Ordered prose sections rendered on the page and in the panel. */
  sections: ArticleSection[];
  /** Key/value facts rendered as a table. */
  facts: { label: string; value: string }[];
}

/** The highlight clause for an element (curated, or a safe generic fallback). */
export function highlightFor(element: Element): string {
  return (
    HIGHLIGHTS[element.symbol] ??
    `a ${categoryLabel(element.category).toLowerCase()} with atomic number ${element.number}`
  );
}

/**
 * Build the full article for an element. Deterministic: same input → same
 * output, so the page and the panel always agree, and tests can assert exact
 * content.
 */
export function buildArticle(element: Element): Article {
  const mass = formatMass(element);
  const cat = categoryLabel(element.category).toLowerCase();
  const highlight = highlightFor(element);
  const groupText =
    element.group !== null
      ? `group ${element.group}`
      : element.category === "lanthanide"
        ? "the lanthanide series (f-block)"
        : "the actinide series (f-block)";

  const summary = `${element.name} (symbol ${element.symbol}, atomic number ${element.number}) is ${highlight}. It is classified as a ${cat} and sits in ${groupText}, period ${element.period} of the periodic table.`;

  const overview = `${element.name} is the chemical element with atomic number ${element.number} and the symbol ${element.symbol}. With a standard atomic weight of ${mass}, it is a ${cat}. In the periodic table it occupies ${groupText} and period ${element.period}, and under standard conditions it is normally a ${element.phase}. ${capitalize(element.name)} ${highlight.startsWith("the") || highlight.startsWith("a ") || highlight.startsWith("an ") || highlight.startsWith("one") ? "is " + highlight : highlight}.`;

  const structure = `An atom of ${element.name} has ${element.number} proton${element.number === 1 ? "" : "s"} in its nucleus and, when neutral, ${element.number} electron${element.number === 1 ? "" : "s"} arranged in the configuration ${element.electronConfig}. ${element.synthetic ? `${capitalize(element.name)} has no stable isotope; the value ${mass} refers to the mass number of its most stable or most commonly produced isotope.` : `Its standard atomic weight of ${mass} reflects the natural mix of its stable isotopes.`}`;

  const discovery = `${capitalize(element.name)} ${discoveryPhrase(element)}. ${neighbourSentence(element)}`;

  const sections: ArticleSection[] = [
    { heading: "Overview", body: overview },
    { heading: "Atomic structure", body: structure },
    { heading: "Discovery and place in the table", body: discovery },
  ];

  const facts: { label: string; value: string }[] = [
    { label: "Atomic number", value: String(element.number) },
    { label: "Symbol", value: element.symbol },
    { label: "Atomic mass", value: mass },
    { label: "Category", value: categoryLabel(element.category) },
    { label: "Group", value: element.group !== null ? String(element.group) : "—" },
    { label: "Period", value: String(element.period) },
    { label: "Electron configuration", value: element.electronConfig },
    { label: "Phase at STP", value: capitalize(element.phase) },
    {
      label: "Discovered",
      value:
        element.discoveredYear !== null
          ? `${element.discoveredYear} (${element.discoveredBy})`
          : "Antiquity",
    },
  ];

  return { summary, sections, facts };
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

/** Sentence relating the element to its periodic-table neighbours by symbol. */
function neighbourSentence(element: Element): string {
  const prev = getElementBySymbol(prevSymbol(element));
  const next = getElementBySymbol(nextSymbol(element));
  if (prev && next) {
    return `It follows ${prev.name} (${prev.symbol}) and precedes ${next.name} (${next.symbol}) in order of atomic number.`;
  }
  if (next) {
    return `It is the first element, immediately followed by ${next.name} (${next.symbol}).`;
  }
  if (prev) {
    return `It follows ${prev.name} (${prev.symbol}) and is, so far, the heaviest element ever produced.`;
  }
  return "";
}

// These two helpers avoid importing the whole list again; they reconstruct the
// neighbour symbol via atomic number through the public lookup.
function prevSymbol(element: Element): string {
  const p = getNumberSymbol(element.number - 1);
  return p ?? "";
}
function nextSymbol(element: Element): string {
  const n = getNumberSymbol(element.number + 1);
  return n ?? "";
}

function getNumberSymbol(n: number): string | undefined {
  return getElementByNumber(n)?.symbol;
}
