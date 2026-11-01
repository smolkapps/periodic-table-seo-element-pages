/**
 * Canonical 118-element dataset from Elementa origin/main (800162f741c30c34afcd2ad9a7d70794671f151c)
 * + curated highlights from src/lib/article.ts
 * + deterministic ground-state shell/subshell parser from NIST/IUPAC electronConfig
 * + documented reference trend datasets (Pauling electronegativity, NIST 1st ionization energy, covalent radius)
 *   with explicit null handling for noble gases / superheavy elements where values are not experimentally established.
 */

export const CATEGORY_META = {
  "alkali metal": { label: "Alkali metal", cssVar: "--cat-alkali", hex: "#ff6b6b", reactivity: "Highly reactive s-block metals with a single valence electron (ns¹) that readily form +1 cations." },
  "alkaline earth metal": { label: "Alkaline earth metal", cssVar: "--cat-alkaline", hex: "#ffa94d", reactivity: "Reactive s-block metals with two valence electrons (ns²), typically forming +2 cations in minerals and biological systems." },
  "transition metal": { label: "Transition metal", cssVar: "--cat-transition", hex: "#ffd43b", reactivity: "d-block metals characterized by partially filled d subshells, multiple oxidation states, catalytic activity, and high conductivity." },
  "post-transition metal": { label: "Post-transition metal", cssVar: "--cat-post-transition", hex: "#69db7c", reactivity: "p-block metals located right of the d-block; generally softer and lower-melting than transition metals with filled d subshells." },
  metalloid: { label: "Metalloid", cssVar: "--cat-metalloid", hex: "#38d9a9", reactivity: "p-block elements along the metal–nonmetal dividing line exhibiting intermediate electrical conductivity and semiconductor behavior." },
  nonmetal: { label: "Reactive nonmetal", cssVar: "--cat-nonmetal", hex: "#4dabf7", reactivity: "High-electronegativity elements that form covalent networks and molecular compounds essential to organic chemistry and life." },
  halogen: { label: "Halogen", cssVar: "--cat-halogen", hex: "#748ffc", reactivity: "Group 17 p-block nonmetals (ns² np⁵) one electron short of a full octet, making them strong oxidizing agents that form halide salts." },
  "noble gas": { label: "Noble gas", cssVar: "--cat-noble", hex: "#da77f2", reactivity: "Group 18 elements with closed valence electron shells, resulting in very high ionization energies and near-complete chemical inertness." },
  lanthanide: { label: "Lanthanide", cssVar: "--cat-lanthanide", hex: "#f783ac", reactivity: "4f-block rare-earth metals exhibiting the lanthanide contraction, predominantly +3 oxidation states, and strong magnetic/optical properties." },
  actinide: { label: "Actinide", cssVar: "--cat-actinide", hex: "#e599f7", reactivity: "5f-block heavy radioactive elements; all isotopes are unstable, with early actinides showing variable oxidation states." },
};

/** @type {Array<[number, string, string, number, string, number, number, string, string, number | null, string]>} */
export const ELEMENT_TUPLES = [
  [1, "H", "Hydrogen", 1.008, "nonmetal", 1, 1, "1s1", "gas", 1766, "Henry Cavendish"],
  [2, "He", "Helium", 4.0026, "noble gas", 18, 1, "1s2", "gas", 1868, "Pierre Janssen, Norman Lockyer"],
  [3, "Li", "Lithium", 6.94, "alkali metal", 1, 2, "[He] 2s1", "solid", 1817, "Johan August Arfwedson"],
  [4, "Be", "Beryllium", 9.0122, "alkaline earth metal", 2, 2, "[He] 2s2", "solid", 1798, "Louis Nicolas Vauquelin"],
  [5, "B", "Boron", 10.81, "metalloid", 13, 2, "[He] 2s2 2p1", "solid", 1808, "Joseph Louis Gay-Lussac, Louis Jacques Thénard"],
  [6, "C", "Carbon", 12.011, "nonmetal", 14, 2, "[He] 2s2 2p2", "solid", null, "Ancient"],
  [7, "N", "Nitrogen", 14.007, "nonmetal", 15, 2, "[He] 2s2 2p3", "gas", 1772, "Daniel Rutherford"],
  [8, "O", "Oxygen", 15.999, "nonmetal", 16, 2, "[He] 2s2 2p4", "gas", 1774, "Carl Wilhelm Scheele, Joseph Priestley"],
  [9, "F", "Fluorine", 18.998, "halogen", 17, 2, "[He] 2s2 2p5", "gas", 1886, "Henri Moissan"],
  [10, "Ne", "Neon", 20.18, "noble gas", 18, 2, "[He] 2s2 2p6", "gas", 1898, "William Ramsay, Morris Travers"],
  [11, "Na", "Sodium", 22.99, "alkali metal", 1, 3, "[Ne] 3s1", "solid", 1807, "Humphry Davy"],
  [12, "Mg", "Magnesium", 24.305, "alkaline earth metal", 2, 3, "[Ne] 3s2", "solid", 1755, "Joseph Black"],
  [13, "Al", "Aluminium", 26.982, "post-transition metal", 13, 3, "[Ne] 3s2 3p1", "solid", 1825, "Hans Christian Ørsted"],
  [14, "Si", "Silicon", 28.085, "metalloid", 14, 3, "[Ne] 3s2 3p2", "solid", 1854, "Jöns Jacob Berzelius"],
  [15, "P", "Phosphorus", 30.974, "nonmetal", 15, 3, "[Ne] 3s2 3p3", "solid", 1669, "Hennig Brand"],
  [16, "S", "Sulfur", 32.06, "nonmetal", 16, 3, "[Ne] 3s2 3p4", "solid", null, "Ancient"],
  [17, "Cl", "Chlorine", 35.45, "halogen", 17, 3, "[Ne] 3s2 3p5", "gas", 1774, "Carl Wilhelm Scheele"],
  [18, "Ar", "Argon", 39.95, "noble gas", 18, 3, "[Ne] 3s2 3p6", "gas", 1894, "Lord Rayleigh, William Ramsay"],
  [19, "K", "Potassium", 39.098, "alkali metal", 1, 4, "[Ar] 4s1", "solid", 1807, "Humphry Davy"],
  [20, "Ca", "Calcium", 40.078, "alkaline earth metal", 2, 4, "[Ar] 4s2", "solid", 1808, "Humphry Davy"],
  [21, "Sc", "Scandium", 44.956, "transition metal", 3, 4, "[Ar] 3d1 4s2", "solid", 1879, "Lars Fredrik Nilson"],
  [22, "Ti", "Titanium", 47.867, "transition metal", 4, 4, "[Ar] 3d2 4s2", "solid", 1791, "William Gregor"],
  [23, "V", "Vanadium", 50.942, "transition metal", 5, 4, "[Ar] 3d3 4s2", "solid", 1801, "Andrés Manuel del Río"],
  [24, "Cr", "Chromium", 51.996, "transition metal", 6, 4, "[Ar] 3d5 4s1", "solid", 1797, "Louis Nicolas Vauquelin"],
  [25, "Mn", "Manganese", 54.938, "transition metal", 7, 4, "[Ar] 3d5 4s2", "solid", 1774, "Johan Gottlieb Gahn"],
  [26, "Fe", "Iron", 55.845, "transition metal", 8, 4, "[Ar] 3d6 4s2", "solid", null, "Ancient"],
  [27, "Co", "Cobalt", 58.933, "transition metal", 9, 4, "[Ar] 3d7 4s2", "solid", 1735, "Georg Brandt"],
  [28, "Ni", "Nickel", 58.693, "transition metal", 10, 4, "[Ar] 3d8 4s2", "solid", 1751, "Axel Fredrik Cronstedt"],
  [29, "Cu", "Copper", 63.546, "transition metal", 11, 4, "[Ar] 3d10 4s1", "solid", null, "Ancient"],
  [30, "Zn", "Zinc", 65.38, "transition metal", 12, 4, "[Ar] 3d10 4s2", "solid", 1746, "Andreas Sigismund Marggraf"],
  [31, "Ga", "Gallium", 69.723, "post-transition metal", 13, 4, "[Ar] 3d10 4s2 4p1", "solid", 1875, "Lecoq de Boisbaudran"],
  [32, "Ge", "Germanium", 72.63, "metalloid", 14, 4, "[Ar] 3d10 4s2 4p2", "solid", 1886, "Clemens Winkler"],
  [33, "As", "Arsenic", 74.922, "metalloid", 15, 4, "[Ar] 3d10 4s2 4p3", "solid", null, "Ancient"],
  [34, "Se", "Selenium", 78.971, "nonmetal", 16, 4, "[Ar] 3d10 4s2 4p4", "solid", 1817, "Jöns Jacob Berzelius"],
  [35, "Br", "Bromine", 79.904, "halogen", 17, 4, "[Ar] 3d10 4s2 4p5", "liquid", 1826, "Antoine Jérôme Balard"],
  [36, "Kr", "Krypton", 83.798, "noble gas", 18, 4, "[Ar] 3d10 4s2 4p6", "gas", 1898, "William Ramsay, Morris Travers"],
  [37, "Rb", "Rubidium", 85.468, "alkali metal", 1, 5, "[Kr] 5s1", "solid", 1861, "Robert Bunsen, Gustav Kirchhoff"],
  [38, "Sr", "Strontium", 87.62, "alkaline earth metal", 2, 5, "[Kr] 5s2", "solid", 1790, "William Cruickshank"],
  [39, "Y", "Yttrium", 88.906, "transition metal", 3, 5, "[Kr] 4d1 5s2", "solid", 1794, "Johan Gadolin"],
  [40, "Zr", "Zirconium", 91.224, "transition metal", 4, 5, "[Kr] 4d2 5s2", "solid", 1789, "Martin Heinrich Klaproth"],
  [41, "Nb", "Niobium", 92.906, "transition metal", 5, 5, "[Kr] 4d4 5s1", "solid", 1801, "Charles Hatchett"],
  [42, "Mo", "Molybdenum", 95.95, "transition metal", 6, 5, "[Kr] 4d5 5s1", "solid", 1781, "Peter Jacob Hjelm"],
  [43, "Tc", "Technetium", 98, "transition metal", 7, 5, "[Kr] 4d5 5s2", "solid", 1937, "Emilio Segrè, Carlo Perrier"],
  [44, "Ru", "Ruthenium", 101.07, "transition metal", 8, 5, "[Kr] 4d7 5s1", "solid", 1844, "Karl Ernst Claus"],
  [45, "Rh", "Rhodium", 102.91, "transition metal", 9, 5, "[Kr] 4d8 5s1", "solid", 1803, "William Hyde Wollaston"],
  [46, "Pd", "Palladium", 106.42, "transition metal", 10, 5, "[Kr] 4d10", "solid", 1803, "William Hyde Wollaston"],
  [47, "Ag", "Silver", 107.87, "transition metal", 11, 5, "[Kr] 4d10 5s1", "solid", null, "Ancient"],
  [48, "Cd", "Cadmium", 112.41, "transition metal", 12, 5, "[Kr] 4d10 5s2", "solid", 1817, "Karl Samuel Leberecht Hermann, Friedrich Stromeyer"],
  [49, "In", "Indium", 114.82, "post-transition metal", 13, 5, "[Kr] 4d10 5s2 5p1", "solid", 1863, "Ferdinand Reich, Hieronymous Theodor Richter"],
  [50, "Sn", "Tin", 118.71, "post-transition metal", 14, 5, "[Kr] 4d10 5s2 5p2", "solid", null, "Ancient"],
  [51, "Sb", "Antimony", 121.76, "metalloid", 15, 5, "[Kr] 4d10 5s2 5p3", "solid", null, "Ancient"],
  [52, "Te", "Tellurium", 127.6, "metalloid", 16, 5, "[Kr] 4d10 5s2 5p4", "solid", 1782, "Franz-Joseph Müller von Reichenstein"],
  [53, "I", "Iodine", 126.9, "halogen", 17, 5, "[Kr] 4d10 5s2 5p5", "solid", 1811, "Bernard Courtois"],
  [54, "Xe", "Xenon", 131.29, "noble gas", 18, 5, "[Kr] 4d10 5s2 5p6", "gas", 1898, "William Ramsay, Morris Travers"],
  [55, "Cs", "Caesium", 132.91, "alkali metal", 1, 6, "[Xe] 6s1", "solid", 1860, "Robert Bunsen, Gustav Kirchhoff"],
  [56, "Ba", "Barium", 137.33, "alkaline earth metal", 2, 6, "[Xe] 6s2", "solid", 1808, "Humphry Davy"],
  [57, "La", "Lanthanum", 138.91, "lanthanide", 3, 9, "[Xe] 5d1 6s2", "solid", 1839, "Carl Gustaf Mosander"],
  [58, "Ce", "Cerium", 140.12, "lanthanide", 4, 9, "[Xe] 4f1 5d1 6s2", "solid", 1803, "Martin Heinrich Klaproth, Jöns Jacob Berzelius"],
  [59, "Pr", "Praseodymium", 140.91, "lanthanide", 5, 9, "[Xe] 4f3 6s2", "solid", 1885, "Carl Auer von Welsbach"],
  [60, "Nd", "Neodymium", 144.24, "lanthanide", 6, 9, "[Xe] 4f4 6s2", "solid", 1885, "Carl Auer von Welsbach"],
  [61, "Pm", "Promethium", 145, "lanthanide", 7, 9, "[Xe] 4f5 6s2", "solid", 1945, "Charles Coryell, Jacob Marinsky, Lawrence Glendenin"],
  [62, "Sm", "Samarium", 150.36, "lanthanide", 8, 9, "[Xe] 4f6 6s2", "solid", 1879, "Lecoq de Boisbaudran"],
  [63, "Eu", "Europium", 151.96, "lanthanide", 9, 9, "[Xe] 4f7 6s2", "solid", 1901, "Eugène-Anatole Demarçay"],
  [64, "Gd", "Gadolinium", 157.25, "lanthanide", 10, 9, "[Xe] 4f7 5d1 6s2", "solid", 1880, "Jean Charles Galissard de Marignac"],
  [65, "Tb", "Terbium", 158.93, "lanthanide", 11, 9, "[Xe] 4f9 6s2", "solid", 1843, "Carl Gustaf Mosander"],
  [66, "Dy", "Dysprosium", 162.5, "lanthanide", 12, 9, "[Xe] 4f10 6s2", "solid", 1886, "Lecoq de Boisbaudran"],
  [67, "Ho", "Holmium", 164.93, "lanthanide", 13, 9, "[Xe] 4f11 6s2", "solid", 1878, "Marc Delafontaine, Jacques-Louis Soret"],
  [68, "Er", "Erbium", 167.26, "lanthanide", 14, 9, "[Xe] 4f12 6s2", "solid", 1843, "Carl Gustaf Mosander"],
  [69, "Tm", "Thulium", 168.93, "lanthanide", 15, 9, "[Xe] 4f13 6s2", "solid", 1879, "Per Teodor Cleve"],
  [70, "Yb", "Ytterbium", 173.05, "lanthanide", 16, 9, "[Xe] 4f14 6s2", "solid", 1878, "Jean Charles Galissard de Marignac"],
  [71, "Lu", "Lutetium", 174.97, "lanthanide", 17, 9, "[Xe] 4f14 5d1 6s2", "solid", 1907, "Georges Urbain, Carl Auer von Welsbach"],
  [72, "Hf", "Hafnium", 178.49, "transition metal", 4, 6, "[Xe] 4f14 5d2 6s2", "solid", 1923, "Dirk Coster, George de Hevesy"],
  [73, "Ta", "Tantalum", 180.95, "transition metal", 5, 6, "[Xe] 4f14 5d3 6s2", "solid", 1802, "Anders Gustaf Ekeberg"],
  [74, "W", "Tungsten", 183.84, "transition metal", 6, 6, "[Xe] 4f14 5d4 6s2", "solid", 1783, "Juan José Elhuyar, Fausto Elhuyar"],
  [75, "Re", "Rhenium", 186.21, "transition metal", 7, 6, "[Xe] 4f14 5d5 6s2", "solid", 1925, "Walter Noddack, Ida Tacke, Otto Berg"],
  [76, "Os", "Osmium", 190.23, "transition metal", 8, 6, "[Xe] 4f14 5d6 6s2", "solid", 1803, "Smithson Tennant"],
  [77, "Ir", "Iridium", 192.22, "transition metal", 9, 6, "[Xe] 4f14 5d7 6s2", "solid", 1803, "Smithson Tennant"],
  [78, "Pt", "Platinum", 195.08, "transition metal", 10, 6, "[Xe] 4f14 5d9 6s1", "solid", 1735, "Antonio de Ulloa"],
  [79, "Au", "Gold", 196.97, "transition metal", 11, 6, "[Xe] 4f14 5d10 6s1", "solid", null, "Ancient"],
  [80, "Hg", "Mercury", 200.59, "transition metal", 12, 6, "[Xe] 4f14 5d10 6s2", "liquid", null, "Ancient"],
  [81, "Tl", "Thallium", 204.38, "post-transition metal", 13, 6, "[Xe] 4f14 5d10 6s2 6p1", "solid", 1861, "William Crookes"],
  [82, "Pb", "Lead", 207.2, "post-transition metal", 14, 6, "[Xe] 4f14 5d10 6s2 6p2", "solid", null, "Ancient"],
  [83, "Bi", "Bismuth", 208.98, "post-transition metal", 15, 6, "[Xe] 4f14 5d10 6s2 6p3", "solid", null, "Ancient"],
  [84, "Po", "Polonium", 209, "post-transition metal", 16, 6, "[Xe] 4f14 5d10 6s2 6p4", "solid", 1898, "Marie Curie, Pierre Curie"],
  [85, "At", "Astatine", 210, "halogen", 17, 6, "[Xe] 4f14 5d10 6s2 6p5", "solid", 1940, "Dale Corson, Kenneth MacKenzie, Emilio Segrè"],
  [86, "Rn", "Radon", 222, "noble gas", 18, 6, "[Xe] 4f14 5d10 6s2 6p6", "gas", 1899, "Ernest Rutherford, Robert B. Owens"],
  [87, "Fr", "Francium", 223, "alkali metal", 1, 7, "[Rn] 7s1", "solid", 1939, "Marguerite Perey"],
  [88, "Ra", "Radium", 226, "alkaline earth metal", 2, 7, "[Rn] 7s2", "solid", 1898, "Marie Curie, Pierre Curie"],
  [89, "Ac", "Actinium", 227, "actinide", 3, 10, "[Rn] 6d1 7s2", "solid", 1899, "André-Louis Debierne"],
  [90, "Th", "Thorium", 232.04, "actinide", 4, 10, "[Rn] 6d2 7s2", "solid", 1829, "Jöns Jacob Berzelius"],
  [91, "Pa", "Protactinium", 231.04, "actinide", 5, 10, "[Rn] 5f2 6d1 7s2", "solid", 1913, "Kasimir Fajans, Oswald Helmuth Göhring"],
  [92, "U", "Uranium", 238.03, "actinide", 6, 10, "[Rn] 5f3 6d1 7s2", "solid", 1789, "Martin Heinrich Klaproth"],
  [93, "Np", "Neptunium", 237, "actinide", 7, 10, "[Rn] 5f4 6d1 7s2", "solid", 1940, "Edwin McMillan, Philip H. Abelson"],
  [94, "Pu", "Plutonium", 244, "actinide", 8, 10, "[Rn] 5f6 7s2", "solid", 1940, "Glenn T. Seaborg et al."],
  [95, "Am", "Americium", 243, "actinide", 9, 10, "[Rn] 5f7 7s2", "solid", 1944, "Glenn T. Seaborg et al."],
  [96, "Cm", "Curium", 247, "actinide", 10, 10, "[Rn] 5f7 6d1 7s2", "solid", 1944, "Glenn T. Seaborg et al."],
  [97, "Bk", "Berkelium", 247, "actinide", 11, 10, "[Rn] 5f9 7s2", "solid", 1949, "Glenn T. Seaborg et al."],
  [98, "Cf", "Californium", 251, "actinide", 12, 10, "[Rn] 5f10 7s2", "solid", 1950, "Glenn T. Seaborg et al."],
  [99, "Es", "Einsteinium", 252, "actinide", 13, 10, "[Rn] 5f11 7s2", "solid", 1952, "Lawrence Berkeley National Laboratory"],
  [100, "Fm", "Fermium", 257, "actinide", 14, 10, "[Rn] 5f12 7s2", "solid", 1952, "Lawrence Berkeley National Laboratory"],
  [101, "Md", "Mendelevium", 258, "actinide", 15, 10, "[Rn] 5f13 7s2", "solid", 1955, "Lawrence Berkeley National Laboratory"],
  [102, "No", "Nobelium", 259, "actinide", 16, 10, "[Rn] 5f14 7s2", "solid", 1966, "Joint Institute for Nuclear Research"],
  [103, "Lr", "Lawrencium", 266, "actinide", 17, 10, "[Rn] 5f14 7s2 7p1", "solid", 1961, "Lawrence Berkeley National Laboratory"],
  [104, "Rf", "Rutherfordium", 267, "transition metal", 4, 7, "[Rn] 5f14 6d2 7s2", "solid", 1964, "Joint Institute for Nuclear Research"],
  [105, "Db", "Dubnium", 268, "transition metal", 5, 7, "[Rn] 5f14 6d3 7s2", "solid", 1967, "Joint Institute for Nuclear Research"],
  [106, "Sg", "Seaborgium", 269, "transition metal", 6, 7, "[Rn] 5f14 6d4 7s2", "solid", 1974, "Lawrence Berkeley National Laboratory"],
  [107, "Bh", "Bohrium", 270, "transition metal", 7, 7, "[Rn] 5f14 6d5 7s2", "solid", 1981, "Gesellschaft für Schwerionenforschung"],
  [108, "Hs", "Hassium", 269, "transition metal", 8, 7, "[Rn] 5f14 6d6 7s2", "solid", 1984, "Gesellschaft für Schwerionenforschung"],
  [109, "Mt", "Meitnerium", 278, "transition metal", 9, 7, "[Rn] 5f14 6d7 7s2", "solid", 1982, "Gesellschaft für Schwerionenforschung"],
  [110, "Ds", "Darmstadtium", 281, "transition metal", 10, 7, "[Rn] 5f14 6d8 7s2", "solid", 1994, "Gesellschaft für Schwerionenforschung"],
  [111, "Rg", "Roentgenium", 282, "transition metal", 11, 7, "[Rn] 5f14 6d9 7s2", "solid", 1994, "Gesellschaft für Schwerionenforschung"],
  [112, "Cn", "Copernicium", 285, "transition metal", 12, 7, "[Rn] 5f14 6d10 7s2", "solid", 1996, "Gesellschaft für Schwerionenforschung"],
  [113, "Nh", "Nihonium", 286, "post-transition metal", 13, 7, "[Rn] 5f14 6d10 7s2 7p1", "solid", 2004, "RIKEN"],
  [114, "Fl", "Flerovium", 289, "post-transition metal", 14, 7, "[Rn] 5f14 6d10 7s2 7p2", "solid", 1999, "Joint Institute for Nuclear Research"],
  [115, "Mc", "Moscovium", 290, "post-transition metal", 15, 7, "[Rn] 5f14 6d10 7s2 7p3", "solid", 2003, "Joint Institute for Nuclear Research, LLNL"],
  [116, "Lv", "Livermorium", 293, "post-transition metal", 16, 7, "[Rn] 5f14 6d10 7s2 7p4", "solid", 2000, "Joint Institute for Nuclear Research, LLNL"],
  [117, "Ts", "Tennessine", 294, "halogen", 17, 7, "[Rn] 5f14 6d10 7s2 7p5", "solid", 2010, "Joint Institute for Nuclear Research, ORNL"],
  [118, "Og", "Oganesson", 294, "noble gas", 18, 7, "[Rn] 5f14 6d10 7s2 7p6", "solid", 2002, "Joint Institute for Nuclear Research, LLNL"],
];

export const HIGHLIGHTS = {
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
  Bi: "a dense post-transition metal with a primordially long-lived radioisotope (²⁰⁹Bi), used in stomach medicine and low-melting fusible alloys",
  Po: "an intensely radioactive post-transition chalcogen metal discovered by Marie and Pierre Curie, used in antistatic devices and alpha-particle sources",
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

// Standard Pauling electronegativity (CRC / IUPAC reference; null where not experimentally established)
const ELECTRONEGATIVITY_BY_Z = {
  1: 2.20, 3: 0.98, 4: 1.57, 5: 2.04, 6: 2.55, 7: 3.04, 8: 3.44, 9: 3.98,
  11: 0.93, 12: 1.31, 13: 1.61, 14: 1.90, 15: 2.19, 16: 2.58, 17: 3.16,
  19: 0.82, 20: 1.00, 21: 1.36, 22: 1.54, 23: 1.63, 24: 1.66, 25: 1.55, 26: 1.83, 27: 1.88, 28: 1.91, 29: 1.90, 30: 1.65, 31: 1.81, 32: 2.01, 33: 2.18, 34: 2.55, 35: 2.96, 36: 3.00,
  37: 0.82, 38: 0.95, 39: 1.22, 40: 1.33, 41: 1.60, 42: 2.16, 43: 1.90, 44: 2.20, 45: 2.28, 46: 2.20, 47: 1.93, 48: 1.69, 49: 1.78, 50: 1.96, 51: 2.05, 52: 2.10, 53: 2.66, 54: 2.60,
  55: 0.79, 56: 0.89, 57: 1.10, 58: 1.12, 59: 1.13, 60: 1.14, 61: 1.13, 62: 1.17, 63: 1.20, 64: 1.20, 65: 1.20, 66: 1.22, 67: 1.23, 68: 1.24, 69: 1.25, 70: 1.10, 71: 1.27,
  72: 1.30, 73: 1.50, 74: 2.36, 75: 1.90, 76: 2.20, 77: 2.20, 78: 2.28, 79: 2.54, 80: 2.00, 81: 1.62, 82: 2.33, 83: 2.02, 84: 2.00, 85: 2.20, 86: 2.20,
  87: 0.70, 88: 0.90, 89: 1.10, 90: 1.30, 91: 1.50, 92: 1.38, 93: 1.36, 94: 1.28, 95: 1.30, 96: 1.30, 97: 1.30, 98: 1.30, 99: 1.30, 100: 1.30, 101: 1.30, 102: 1.30, 103: 1.30,
};

// First Ionization Energy in kJ/mol (NIST Atomic Spectra Database reference)
const IONIZATION_ENERGY_BY_Z = {
  1: 1312.0, 2: 2372.3, 3: 520.2, 4: 899.5, 5: 800.6, 6: 1086.5, 7: 1402.3, 8: 1313.9, 9: 1681.0, 10: 2080.7,
  11: 495.8, 12: 737.7, 13: 577.5, 14: 786.5, 15: 1011.8, 16: 999.6, 17: 1251.2, 18: 1520.6,
  19: 418.8, 20: 589.8, 21: 633.1, 22: 658.8, 23: 650.9, 24: 652.9, 25: 717.3, 26: 762.5, 27: 760.4, 28: 737.1, 29: 745.5, 30: 906.4, 31: 578.8, 32: 762.0, 33: 947.0, 34: 941.0, 35: 1139.9, 36: 1350.8,
  37: 403.0, 38: 549.5, 39: 600.0, 40: 640.1, 41: 652.1, 42: 684.3, 43: 702.0, 44: 710.2, 45: 719.7, 46: 804.4, 47: 731.0, 48: 867.8, 49: 558.3, 50: 708.6, 51: 834.0, 52: 869.3, 53: 1008.4, 54: 1170.4,
  55: 375.7, 56: 502.9, 57: 538.1, 58: 534.4, 59: 527.0, 60: 533.1, 61: 540.0, 62: 544.5, 63: 547.1, 64: 593.4, 65: 565.8, 66: 573.0, 67: 581.0, 68: 589.3, 69: 596.7, 70: 603.4, 71: 523.5,
  72: 658.5, 73: 761.0, 74: 770.0, 75: 760.0, 76: 840.0, 77: 880.0, 78: 870.0, 79: 890.1, 80: 1007.1, 81: 589.4, 82: 715.6, 83: 703.0, 84: 812.1, 85: 899.0, 86: 1037.0,
  87: 380.0, 88: 509.3, 89: 499.0, 90: 587.0, 91: 568.0, 92: 597.6, 93: 604.5, 94: 584.7, 95: 578.0, 96: 581.0, 97: 601.0, 98: 608.0, 99: 619.0, 100: 627.0, 101: 635.0, 102: 642.0, 103: 470.0,
};

// Covalent atomic radius in pm (Cordero et al. / Cambridge Structural Database reference)
const ATOMIC_RADIUS_BY_Z = {
  1: 31, 2: 28, 3: 128, 4: 96, 5: 84, 6: 76, 7: 71, 8: 66, 9: 57, 10: 58,
  11: 166, 12: 141, 13: 121, 14: 111, 15: 107, 16: 105, 17: 102, 18: 106,
  19: 203, 20: 176, 21: 170, 22: 160, 23: 153, 24: 139, 25: 139, 26: 132, 27: 126, 28: 124, 29: 132, 30: 122, 31: 122, 32: 120, 33: 119, 34: 120, 35: 120, 36: 116,
  37: 220, 38: 195, 39: 190, 40: 175, 41: 164, 42: 154, 43: 147, 44: 146, 45: 142, 46: 139, 47: 145, 48: 144, 49: 142, 50: 139, 51: 139, 52: 138, 53: 139, 54: 140,
  55: 244, 56: 215, 57: 207, 58: 204, 59: 203, 60: 201, 61: 199, 62: 198, 63: 198, 64: 196, 65: 194, 66: 192, 67: 192, 68: 189, 69: 190, 70: 187, 71: 187,
  72: 175, 73: 170, 74: 162, 75: 151, 76: 144, 77: 141, 78: 136, 79: 136, 80: 132, 81: 145, 82: 146, 83: 148, 84: 140, 85: 150, 86: 150,
  87: 260, 88: 221, 89: 215, 90: 206, 91: 200, 92: 196, 93: 190, 94: 187, 95: 180, 96: 169,
};

// 34 elements lacking a CIAAW standard atomic weight (displayed as bracketed mass number [A] of longest-lived/reference radioisotope).
// Note: Bi (83), Th (90), Pa (91), and U (92) have no stable isotopes but occur naturally in terrestrial ores with CIAAW standard atomic weights.
const SYNTHETIC_NUMBERS = new Set([
  43, 61, 84, 85, 86, 87, 88, 89, 93, 94, 95, 96, 97, 98, 99, 100,
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115,
  116, 117, 118,
]);

// Primordial radioelements whose long-lived isotopes (209Bi, 232Th, 238U/235U) have survived since Earth's formation.
// Protactinium (Z=91) has a CIAAW standard atomic weight (231.04 u) from radiogenic 231Pa in 235U decay chains, not surviving primordial Pa.
const PRIMORDIAL_RADIOACTIVE_NUMBERS = new Set([83, 90, 92]);

// All 38 elements with zero stable isotopes (Tc, Pm, and all elements with Z >= 83: primordial Bi, Th, U; decay-chain Pa; and 34 elements without a CIAAW standard atomic weight).
const RADIOACTIVE_NUMBERS = new Set([43, 61, 83, 90, 91, 92, ...SYNTHETIC_NUMBERS]);

// 19 stable mononuclidic elements whose standard atomic weight derives from a single naturally occurring stable nuclide.
const MONONUCLIDIC_STABLE_NUMBERS = new Set([
  4, 9, 11, 13, 15, 21, 25, 27, 33, 39, 41, 45, 53, 55, 59, 65, 67, 69, 79,
]);

const NOBLE_CORE_EXPANSIONS = {
  "[He]": "1s2",
  "[Ne]": "1s2 2s2 2p6",
  "[Ar]": "1s2 2s2 2p6 3s2 3p6",
  "[Kr]": "1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6",
  "[Xe]": "1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6",
  "[Rn]": "1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6 4f14 5d10 6s2 6p6",
};

export function expandElectronConfig(config) {
  let expanded = config.trim();
  for (const [core, full] of Object.entries(NOBLE_CORE_EXPANSIONS)) {
    if (expanded.startsWith(core)) {
      expanded = expanded.replace(core, full).trim();
      break;
    }
  }
  return expanded;
}

// Known Aufbau exceptions in ground-state transition and inner-transition elements (NIST Atomic Spectra Database)
export const AUFBAU_NOTES = {
  Cr: "Aufbau exception: [Ar] 3d⁵ 4s¹ achieves extra exchange stabilization from a half-filled 3d⁵ subshell.",
  Cu: "Aufbau exception: [Ar] 3d¹⁰ 4s¹ achieves a completely filled, lower-energy 3d¹⁰ subshell.",
  Nb: "Aufbau exception: [Kr] 4d⁴ 5s¹ minimizes inter-electronic repulsion in the 4d orbitals.",
  Mo: "Aufbau exception: [Kr] 4d⁵ 5s¹ benefits from exchange energy in the half-filled 4d⁵ subshell.",
  Ru: "Aufbau exception: [Kr] 4d⁷ 5s¹ reflects close 4d and 5s orbital energies in Period 5.",
  Rh: "Aufbau exception: [Kr] 4d⁸ 5s¹ lowers electron-electron repulsion compared to 4d⁷ 5s².",
  Pd: "Unique Aufbau exception: [Kr] 4d¹⁰ 5s⁰ has a completely filled 4d¹⁰ shell and zero electrons in n=5.",
  Ag: "Aufbau exception: [Kr] 4d¹⁰ 5s¹ mirrors Copper with a filled d¹⁰ subshell and one s¹ valence electron.",
  La: "Aufbau exception: [Xe] 5d¹ 6s² places the differentiating electron in 5d¹ before 4f filling begins at Cerium.",
  Ce: "Aufbau exception: [Xe] 4f¹ 5d¹ 6s² reflects nearly degenerate 4f and 5d orbital energies at the start of the lanthanides.",
  Gd: "Aufbau exception: [Xe] 4f⁷ 5d¹ 6s² preserves a half-filled 4f⁷ subshell with strong exchange stabilization.",
  Pt: "Aufbau exception: [Xe] 4f¹⁴ 5d⁹ 6s¹ reflects relativistic contraction of the 6s orbital.",
  Au: "Aufbau exception: [Xe] 4f¹⁴ 5d¹⁰ 6s¹ combines a filled 5d¹⁰ subshell with relativistic 6s stabilization.",
  Ac: "Aufbau exception: [Rn] 6d¹ 7s² occupies 6d¹ before 5f orbitals begin filling in the actinide series.",
  Th: "Aufbau exception: [Rn] 6d² 7s² has an empty 5f subshell in the neutral ground state because 6d lies below 5f at Z=90.",
  Pa: "Aufbau exception: [Rn] 5f² 6d¹ 7s² reflects close 5f and 6d orbital energies in early actinides.",
  U: "Aufbau exception: [Rn] 5f³ 6d¹ 7s² retains one 6d¹ electron alongside three 5f³ electrons in the neutral ground state.",
  Np: "Aufbau exception: [Rn] 5f⁴ 6d¹ 7s² retains a 6d¹ electron due to overlapping 5f and 6d energy levels.",
  Cm: "Aufbau exception: [Rn] 5f⁷ 6d¹ 7s² stabilizes a half-filled 5f⁷ subshell by placing the next electron in 6d¹.",
  Lr: "Relativistic exception: [Rn] 5f¹⁴ 7s² 7p¹ places the final electron in the relativistically stabilized 7p₁/₂ orbital rather than 6d¹ (Sato et al., Nature 2015; NIST ASD).",
};

export function getShellRoleLabel(element, shellIdx) {
  const n = shellIdx + 1;
  const maxN = element.shells.length;
  if (element.symbol === "Pd" && n === 4) {
    return "Valence (4d¹⁰)";
  }
  if (element.block === "s" || element.block === "p") {
    return n === maxN ? "Valence" : "Core";
  }
  if (element.block === "d") {
    if (n === maxN) return `Outer (${n}s)`;
    if (n === maxN - 1) return `Inner + ${n}d`;
    return "Core";
  }
  if (n === maxN) return `Outer (${n}s/${n}p)`;
  if (n === maxN - 1) {
    const hasD = element.subshells.some((s) => s.n === n && s.l === "d");
    return hasD ? `Inner + ${n}d` : "Inner shell";
  }
  if (n === maxN - 2) {
    const hasF = element.subshells.some((s) => s.n === n && s.l === "f");
    return hasF ? `Inner + ${n}f` : "Core";
  }
  return "Core";
}

export function isValenceSubshell(element, sub) {
  return (
    sub.n === element.period ||
    (element.symbol === "Pd" && sub.n === 4 && sub.l === "d") ||
    (sub.l === "d" && sub.n === element.period - 1 && sub.count < 10) ||
    (sub.l === "f" && sub.n === element.period - 2 && sub.count < 14)
  );
}

export function parseShellsAndSubshells(electronConfig) {
  const expanded = expandElectronConfig(electronConfig);
  const tokens = expanded.split(/\s+/).filter(Boolean);
  const shellTotals = [0, 0, 0, 0, 0, 0, 0];
  const subshells = [];

  for (const token of tokens) {
    const match = token.match(/^([1-7])([spdf])(\d+)$/);
    if (match) {
      const n = Number(match[1]);
      const l = match[2];
      const count = Number(match[3]);
      shellTotals[n - 1] += count;
      subshells.push({ n, l, label: `${n}${l}`, count, maxCapacity: l === "s" ? 2 : l === "p" ? 6 : l === "d" ? 10 : 14 });
    }
  }

  while (shellTotals.length > 1 && shellTotals[shellTotals.length - 1] === 0) {
    shellTotals.pop();
  }

  return {
    shells: shellTotals,
    subshells,
    outerShellElectrons: shellTotals[shellTotals.length - 1] || 0,
  };
}

export function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function groupForElement(xpos, ypos) {
  if (ypos === 9 || ypos === 10) return null;
  return xpos;
}

export function periodForElement(ypos) {
  if (ypos === 9) return 6;
  if (ypos === 10) return 7;
  return ypos;
}

export function blockForElement(number, xpos, ypos) {
  if (ypos === 9 || ypos === 10) return "f";
  if (xpos <= 2 || number === 2) return "s";
  if (xpos >= 3 && xpos <= 12) return "d";
  return "p";
}

export const ELEMENTS = Object.freeze(
  ELEMENT_TUPLES.map((t) => {
    const [number, symbol, name, atomicMass, category, xpos, ypos, electronConfig, phase, discoveredYear, discoveredBy] = t;
    const { shells, subshells, outerShellElectrons } = parseShellsAndSubshells(electronConfig);
    return {
      number,
      symbol,
      name,
      atomicMass,
      category,
      xpos,
      ypos,
      electronConfig,
      phase,
      discoveredYear,
      discoveredBy,
      group: groupForElement(xpos, ypos),
      period: periodForElement(ypos),
      block: blockForElement(number, xpos, ypos),
      slug: slugify(name),
      synthetic: SYNTHETIC_NUMBERS.has(number),
      radioactive: RADIOACTIVE_NUMBERS.has(number),
      primordialRadioactive: PRIMORDIAL_RADIOACTIVE_NUMBERS.has(number),
      mononuclidic: MONONUCLIDIC_STABLE_NUMBERS.has(number),
      shells,
      subshells,
      outerShellElectrons,
      electronegativity: ELECTRONEGATIVITY_BY_Z[number] ?? null,
      ionizationEnergy: IONIZATION_ENERGY_BY_Z[number] ?? null,
      atomicRadius: ATOMIC_RADIUS_BY_Z[number] ?? null,
      highlight: HIGHLIGHTS[symbol] || `a ${CATEGORY_META[category].label.toLowerCase()} with atomic number ${number}`,
    };
  })
);

const BY_SLUG = new Map(ELEMENTS.map((e) => [e.slug, e]));
const BY_SYMBOL = new Map(ELEMENTS.map((e) => [e.symbol.toLowerCase(), e]));
const BY_NUMBER = new Map(ELEMENTS.map((e) => [e.number, e]));

export function getElementBySlug(slug) {
  if (!slug) return undefined;
  return BY_SLUG.get(String(slug).trim().toLowerCase());
}

export function getElementBySymbol(symbol) {
  if (!symbol) return undefined;
  return BY_SYMBOL.get(String(symbol).trim().toLowerCase());
}

export function getElementByNumber(n) {
  return BY_NUMBER.get(Number(n));
}

export function categoryLabel(category) {
  return CATEGORY_META[category]?.label || category;
}

export function formatMass(element) {
  return element.synthetic ? `[${Math.round(element.atomicMass)}]` : String(element.atomicMass);
}

export function getRadioactiveBadgeLabel(element) {
  if (!element?.radioactive) return null;
  if (element.number >= 95) return "Synthetic Radioelement";
  if (element.primordialRadioactive) return "Primordial Radioelement";
  if (element.number === 91) return "Radioactive decay-chain element";
  return "Radioactive (No Stable Isotopes)";
}

export function discoveryPhrase(element) {
  if (element.discoveredBy === "Ancient" || element.discoveredYear === null) {
    return "has been known and utilized since antiquity";
  }
  return `was first isolated or identified in ${element.discoveredYear} by ${element.discoveredBy}`;
}

export function adjacentElements(n) {
  return {
    prev: getElementByNumber(n - 1),
    next: getElementByNumber(n + 1),
  };
}

/**
 * Improved non-repetitive, high-value educational article generator.
 * Fixes the canonical repo's repetitive summary/overview/structure prose
 * and attaches authoritative IUPAC, NIST, PubChem, and RSC citations.
 */
export function buildArticle(element) {
  const mass = formatMass(element);
  const catMeta = CATEGORY_META[element.category];
  const catLower = catMeta.label.toLowerCase();
  const groupText =
    element.group !== null
      ? `Group ${element.group}`
      : element.category === "lanthanide"
      ? "the lanthanide f-block series"
      : "the actinide f-block series";

  const weightClause = element.synthetic
    ? `reference isotope mass number ${mass} (no CIAAW standard atomic weight)`
    : `standard atomic weight ${mass}`;

  const summary = `${element.name} (${element.symbol}, Z = ${element.number}) is ${element.highlight}. Located in ${groupText}, Period ${element.period} (${element.block}-block), it is a ${catLower} with ${weightClause}.`;

  const shellString = element.shells.map((c, idx) => `${["K", "L", "M", "N", "O", "P", "Q"][idx]}=${c}`).join(", ");
  const trendNotes = [
    element.electronegativity !== null
      ? `a Pauling electronegativity of ${element.electronegativity}`
      : "no established Pauling electronegativity under standard conditions",
    element.ionizationEnergy !== null
      ? `a first ionization energy of ${element.ionizationEnergy} kJ/mol`
      : "unmeasured experimental first ionization energy",
    element.atomicRadius !== null
      ? `an empirical covalent radius of ${element.atomicRadius} pm`
      : "an unestablished empirical covalent radius due to short half-life",
  ].join(", ");

  const applicationsAndBehavior =
    element.number >= 104
      ? `In nuclear and heavy-element research, ${element.name} is notable as ${element.highlight}. Because superheavy elements (Z ≥ 104) are produced only a few short-lived atoms at a time in heavy-ion accelerators, bulk STP phase (${element.phase}) is predicted rather than measured macroscopically; by periodic placement in ${groupText}, it is classified with ${catLower}s: ${catMeta.reactivity}`
      : `In practical chemistry and materials science, ${element.name} is notable as ${element.highlight}. As a ${catLower} at standard temperature and pressure (${element.phase} phase), its chemical behavior reflects its family: ${catMeta.reactivity}`;

  const electronicAndTrends = `A neutral ${element.name} atom contains ${element.number} proton${element.number === 1 ? "" : "s"} and ${element.number} electron${element.number === 1 ? "" : "s"} with ground-state configuration ${element.electronConfig} (shell distribution: ${shellString}; ${element.outerShellElectrons} outer-shell electron${element.outerShellElectrons === 1 ? "" : "s"}). Across Period ${element.period}, it exhibits ${trendNotes}.`;

  const { prev, next } = adjacentElements(element.number);
  const neighbourClause =
    prev && next
      ? `In atomic-number sequence, it bridges ${prev.name} (${prev.symbol}, Z=${prev.number}) and ${next.name} (${next.symbol}, Z=${next.number}).`
      : next
      ? `It opens the periodic table at Z=1, immediately preceding ${next.name} (${next.symbol}).`
      : prev
      ? `Following ${prev.name} (${prev.symbol}), it closes Period 7 as the heaviest confirmed element to date.`
      : "";

  let isotopeClause;
  if (element.synthetic && element.number >= 95) {
    isotopeClause = `${element.name} is a synthetic transplutonium element with no stable or naturally occurring isotopes; CIAAW assigns no standard atomic weight, and ${mass} denotes a reference radioisotope mass number (A).`;
  } else if (element.synthetic) {
    isotopeClause = `Because all isotopes of ${element.name} are radioactive (occurring in nature only in trace decay or fission quantities), CIAAW assigns no standard atomic weight; its bracketed value ${mass} denotes a reference radioisotope mass number (A).`;
  } else if (element.radioactive) {
    if (element.number === 83) {
      isotopeClause = `Although ${element.name} has no stable isotopes, primordial ²⁰⁹Bi (alpha decay half-life ~2.01 × 10¹⁹ years) occurs naturally in Earth's crust, allowing IUPAC CIAAW to assign a standard atomic weight of ${mass}.`;
    } else if (element.number === 90) {
      isotopeClause = `Although ${element.name} has no stable isotopes, primordial ²³²Th (half-life ~1.40 × 10¹⁰ years) occurs naturally in Earth's crust, allowing IUPAC CIAAW to assign a standard atomic weight of ${mass}.`;
    } else if (element.number === 91) {
      isotopeClause = `Although ${element.name} has no stable isotopes and primordial protactinium has long decayed away, natural ²³¹Pa in ²³⁵U decay chains occurs in Earth's crust, allowing IUPAC CIAAW to assign a standard atomic weight of ${mass}.`;
    } else {
      isotopeClause = `Although ${element.name} has no stable isotopes, primordial ²³⁸U and ²³⁵U (along with radiogenic ²³⁴U maintained through ²³⁸U decay) occur naturally in Earth's crust, allowing IUPAC CIAAW to assign a standard atomic weight of ${mass}.`;
    }
  } else if (element.mononuclidic) {
    isotopeClause = `Its CIAAW standard atomic weight of ${mass} is determined by its single naturally occurring stable isotope (${element.symbol}-${Math.round(element.atomicMass)}).`;
  } else {
    isotopeClause = `Its CIAAW standard atomic weight of ${mass} reflects the terrestrial isotopic composition across its naturally occurring isotopes.`;
  }

  const discoveryAndContext = `${element.name} ${discoveryPhrase(element)}. ${isotopeClause} ${neighbourClause}`;

  const sections = [
    { heading: "Applications & Chemical Behavior", body: applicationsAndBehavior },
    { heading: "Electronic Architecture & Periodic Trends", body: electronicAndTrends },
    { heading: "Discovery, Isotopes & Periodic Context", body: discoveryAndContext },
  ];

  const facts = [
    { label: "Atomic number (Z)", value: String(element.number) },
    { label: "Symbol", value: element.symbol },
    {
      label: "Standard atomic weight",
      value: element.synthetic ? `${mass} (reference mass number A; no CIAAW weight)` : mass,
    },
    { label: "Chemical category", value: catMeta.label },
    { label: "Group / Period / Block", value: `${element.group !== null ? `Group ${element.group}` : "f-block"} · Period ${element.period} · ${element.block}-block` },
    { label: "Ground-state configuration", value: element.electronConfig },
    { label: "Bohr shell occupancy", value: element.shells.join(" · ") },
    { label: "Phase at STP", value: element.phase.charAt(0).toUpperCase() + element.phase.slice(1) },
    { label: "Pauling electronegativity", value: element.electronegativity !== null ? String(element.electronegativity) : "Not established" },
    { label: "1st Ionization energy", value: element.ionizationEnergy !== null ? `${element.ionizationEnergy} kJ/mol` : "Not established" },
    { label: "Covalent radius", value: element.atomicRadius !== null ? `${element.atomicRadius} pm` : "Not established" },
    {
      label: "Discovery",
      value: element.discoveredYear !== null ? `${element.discoveredYear} (${element.discoveredBy})` : "Known since antiquity",
    },
  ];

  const citations = [
    {
      source: "PubChem (NCBI / NIH)",
      title: `${element.name} — Atomic & Physical Properties`,
      url: `https://pubchem.ncbi.nlm.nih.gov/element/${element.number}`,
    },
    {
      source: "Royal Society of Chemistry",
      title: `${element.name} (${element.symbol}) Visual Elements Reference`,
      url: `https://periodic-table.rsc.org/element/${element.number}`,
    },
    {
      source: "NIST Physical Measurement Laboratory",
      title: "Ground Levels and Ionization Energies for the Neutral Atoms",
      url: "https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html",
    },
    {
      source: "IUPAC CIAAW",
      title: "Standard Atomic Weights of the Elements",
      url: "https://ciaaw.org/atomic-weights.htm",
    },
  ];

  return { summary, sections, facts, citations };
}

export const PUBLIC_SITE_ORIGIN = "https://elementalearn.com";
export const DEFAULT_COMPARE_SLUGS = ["iron", "gold", "oxygen"];
export const MIN_COMPARE = 2;
export const MAX_COMPARE = 3;

export function buildElementShareUrl(slugOrElement) {
  const slug = typeof slugOrElement === "object" && slugOrElement !== null ? slugOrElement.slug : slugOrElement;
  const resolved = getElementBySlug(slug);
  if (!resolved) return `${PUBLIC_SITE_ORIGIN}/`;
  return `${PUBLIC_SITE_ORIGIN}/element/${resolved.slug}`;
}

export function buildComparisonShareUrl(slugsOrElements) {
  const rawSlugs = (slugsOrElements || []).map((item) =>
    typeof item === "object" && item !== null ? item.slug : item
  );
  const resolved = resolveComparisonSlugs(rawSlugs);
  const ids = resolved.map((el) => el.slug).join(",");
  return `${PUBLIC_SITE_ORIGIN}/compare?ids=${ids}`;
}

function argMax(nums) {
  const validIndices = nums.map((n, i) => (Number.isFinite(n) ? i : -1)).filter((i) => i !== -1);
  if (validIndices.length < 2) return null;
  let best = validIndices[0];
  let ties = 0;
  for (let k = 1; k < validIndices.length; k++) {
    const idx = validIndices[k];
    if (nums[idx] > nums[best]) {
      best = idx;
      ties = 0;
    } else if (nums[idx] === nums[best]) {
      ties++;
    }
  }
  return ties > 0 ? null : best;
}

export function buildComparison(elements) {
  const rowSpecs = [
    { label: "Atomic number (Z)", value: (e) => String(e.number), numeric: (e) => e.number },
    { label: "Symbol", value: (e) => e.symbol, numeric: null },
    { label: "Atomic weight / isotope mass number", value: (e) => formatMass(e), numeric: null },
    { label: "Category", value: (e) => categoryLabel(e.category), numeric: null },
    { label: "Group", value: (e) => (e.group !== null ? String(e.group) : "— (f-block)"), numeric: null },
    { label: "Period & Block", value: (e) => `Period ${e.period} (${e.block}-block)`, numeric: null },
    { label: "Phase at STP", value: (e) => e.phase.charAt(0).toUpperCase() + e.phase.slice(1), numeric: null },
    { label: "Electron configuration", value: (e) => e.electronConfig, numeric: null },
    { label: "Shell occupancy (K..Q)", value: (e) => e.shells.join(" · "), numeric: null },
    { label: "Electronegativity (Pauling)", value: (e) => (e.electronegativity !== null ? String(e.electronegativity) : "—"), numeric: (e) => (e.electronegativity !== null ? e.electronegativity : -Infinity) },
    { label: "1st Ionization energy", value: (e) => (e.ionizationEnergy !== null ? `${e.ionizationEnergy} kJ/mol` : "—"), numeric: (e) => (e.ionizationEnergy !== null ? e.ionizationEnergy : -Infinity) },
    { label: "Covalent radius", value: (e) => (e.atomicRadius !== null ? `${e.atomicRadius} pm` : "—"), numeric: (e) => (e.atomicRadius !== null ? e.atomicRadius : -Infinity) },
    { label: "Discovered", value: (e) => (e.discoveredYear !== null ? String(e.discoveredYear) : "Antiquity"), numeric: null },
    { label: "Key applications & notability", value: (e) => e.highlight.charAt(0).toUpperCase() + e.highlight.slice(1) + ".", numeric: null },
  ];

  const rows = rowSpecs.map((spec) => {
    const values = elements.map(spec.value);
    const maxIndex = spec.numeric && elements.length > 1 ? argMax(elements.map(spec.numeric)) : null;
    return { label: spec.label, values, maxIndex };
  });

  return { elements, rows };
}

export function buildElementContrastSummary(element, peerElements = []) {
  const peers = peerElements.filter((p) => p && p.slug !== element.slug);
  const meta = CATEGORY_META[element.category];
  const shellSummary = `${element.shells.length} occupied shell${element.shells.length === 1 ? "" : "s"} (${element.shells.join("·")}) with ground-state ${element.electronConfig}`;
  const trendParts = [
    element.electronegativity !== null ? `EN ${element.electronegativity}` : "EN not established",
    element.ionizationEnergy !== null ? `IE₁ ${element.ionizationEnergy} kJ/mol` : "IE₁ not established",
    element.atomicRadius !== null ? `r_cov ${element.atomicRadius} pm` : "r_cov not established",
  ].join(", ");

  if (peers.length > 0 && peers.every((p) => p.category === element.category)) {
    return `Within the ${meta.label.toLowerCase()} family, ${element.name} sits in Period ${element.period} (Z = ${element.number}) with ${shellSummary}. Its periodic metrics (${trendParts}) distinguish its atomic size and electron-attracting strength from ${peers.map((p) => `${p.symbol} (Period ${p.period})`).join(" and ")}; in practice it is ${element.highlight}.`;
  }

  return `In Period ${element.period} (${element.group !== null ? `Group ${element.group}` : "f-block"}, ${element.block}-block), ${element.name} has ${shellSummary} (${trendParts}). ${meta.reactivity} In practice, it is ${element.highlight}.`;
}

export function resolveComparisonSlugs(slugs) {
  const seen = new Set();
  const out = [];
  for (const raw of slugs || []) {
    if (!raw) continue;
    const el = getElementBySlug(String(raw).trim());
    if (!el || seen.has(el.slug)) continue;
    seen.add(el.slug);
    out.push(el);
    if (out.length >= MAX_COMPARE) break;
  }
  if (out.length === 0) {
    return DEFAULT_COMPARE_SLUGS.map((s) => getElementBySlug(s)).filter(Boolean);
  }
  return out;
}

function rotateQuizOptions(arr, shift) {
  const k = shift % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

export function buildDeterministicQuiz(pool, count = 5, mode = "all") {
  if (!Array.isArray(pool) || pool.length === 0) return [];

  // Preserve the learner-selected target pool strictly without padding unrelated elements.
  const uniqueTargets = [];
  const seenSlugs = new Set();
  for (const el of pool) {
    if (el && el.slug && !seenSlugs.has(el.slug)) {
      seenSlugs.add(el.slug);
      uniqueTargets.push(el);
    }
  }
  if (uniqueTargets.length === 0) return [];

  const conceptOrder = mode === "trends" ? [1, 0, 3, 2] : [0, 1, 2, 3];
  const conceptCount = conceptOrder.length;
  const requestedCount = Math.max(0, Number(count) || 0);
  const totalQuestions = Math.min(requestedCount, uniqueTargets.length * conceptCount);
  const questions = [];

  for (let i = 0; i < totalQuestions; i++) {
    const targetIndex = i % uniqueTargets.length;
    const pass = Math.floor(i / uniqueTargets.length);
    const target = uniqueTargets[targetIndex];
    const distractors = ELEMENTS.filter(
      (e) => e.slug !== target.slug && (e.period === target.period || e.category !== target.category)
    ).slice((i * 7) % 50, (i * 7) % 50 + 3);

    const qType =
      mode === "trends" && uniqueTargets.length >= 5 && pass === 0
        ? [1, 0, 3, 1, 2][i % 5]
        : conceptOrder[(targetIndex + pass) % conceptCount];

    if (qType === 0) {
      const options = [target, ...distractors].map((el) => ({
        slug: el.slug,
        label: `${el.electronConfig} (${el.shells.join("·")} shells)`,
      }));
      const aufbauNote = AUFBAU_NOTES[target.symbol] ? ` ${AUFBAU_NOTES[target.symbol]}` : "";
      questions.push({
        id: `q-${i}-${target.slug}-c${qType}`,
        concept: qType,
        target,
        prompt: `Which ground-state electron configuration and principal shell occupancy belongs to ${target.name} (${target.symbol}, Z = ${target.number})?`,
        options: rotateQuizOptions(options, i),
        correctSlug: target.slug,
        explanation: `${target.name} has Z = ${target.number} protons and electrons, filling orbitals to ${target.electronConfig} across ${target.shells.length} occupied principal shell(s) (${target.shells.join("·")}).${aufbauNote}`,
      });
    } else if (qType === 1) {
      const hasTrendData =
        target.electronegativity !== null || target.ionizationEnergy !== null || target.atomicRadius !== null;
      const trendDistractors = hasTrendData
        ? ELEMENTS.filter(
            (e) =>
              e.slug !== target.slug &&
              (e.electronegativity !== target.electronegativity || e.ionizationEnergy !== target.ionizationEnergy)
          ).slice((i * 11) % 60, (i * 11) % 60 + 3)
        : distractors;

      const options = [target, ...trendDistractors].map((el) => ({
        slug: el.slug,
        label: `${el.name} (${el.symbol}) — ${categoryLabel(el.category)}, Z = ${el.number}`,
      }));

      const prompt =
        target.electronegativity !== null
          ? `Which Period ${target.period} element (${target.group !== null ? `Group ${target.group}` : "f-block"}) has a Pauling electronegativity of ${target.electronegativity} and first ionization energy of ${target.ionizationEnergy !== null ? `${target.ionizationEnergy} kJ/mol` : "unestablished"}?`
          : target.ionizationEnergy !== null
          ? `Which Period ${target.period} element (${target.group !== null ? `Group ${target.group}` : "f-block"}) has a first ionization energy of ${target.ionizationEnergy} kJ/mol (NIST ASD) and covalent radius of ${target.atomicRadius !== null ? `${target.atomicRadius} pm` : "unestablished"}?`
          : `Which superheavy Period ${target.period} (${target.block}-block) element is ${target.highlight}?`;

      const explanation = hasTrendData
        ? `${target.name} (${target.symbol}, Z = ${target.number}) in Period ${target.period}, ${target.group !== null ? `Group ${target.group}` : "f-block"} has ${target.electronegativity !== null ? `Pauling electronegativity ${target.electronegativity}` : "no established Pauling electronegativity"}, first ionization energy ${target.ionizationEnergy !== null ? `${target.ionizationEnergy} kJ/mol (NIST ASD)` : "not established"}, and covalent radius ${target.atomicRadius !== null ? `${target.atomicRadius} pm` : "not established"}.`
        : `${target.name} (${target.symbol}, Z = ${target.number}) sits in Period ${target.period}, ${target.group !== null ? `Group ${target.group}` : "f-block"}; due to its short half-life, its Pauling electronegativity, ionization energy, and covalent radius are not experimentally established.`;

      questions.push({
        id: `q-${i}-${target.slug}-c${qType}`,
        concept: qType,
        target,
        prompt,
        options: rotateQuizOptions(options, i),
        correctSlug: target.slug,
        explanation,
      });
    } else if (qType === 2) {
      const options = [target, ...distractors].map((el) => ({
        slug: el.slug,
        label: `${el.symbol} — ${el.name} (Z = ${el.number})`,
      }));
      questions.push({
        id: `q-${i}-${target.slug}-c${qType}`,
        concept: qType,
        target,
        prompt: `Which element is ${target.highlight}?`,
        options: rotateQuizOptions(options, i),
        correctSlug: target.slug,
        explanation: `${target.name} (${target.symbol}, atomic number ${target.number}) is ${target.highlight}.`,
      });
    } else {
      const options = [target, ...distractors].map((el) => ({
        slug: el.slug,
        label: `${el.name} (${el.symbol}) — ${categoryLabel(el.category)}, ${el.outerShellElectrons} outer-shell e⁻ (${el.block}-block)`,
      }));
      const valenceDetail =
        target.block === "d" || target.block === "f"
          ? `with ${target.outerShellElectrons} electron(s) in its outermost principal shell (n=${target.shells.length}) and ground-state configuration ${target.electronConfig} (where inner ${target.block}-subshell electrons also participate in valence bonding)`
          : `with ${target.outerShellElectrons} valence electron(s) in its outermost principal shell (n=${target.shells.length}, ${target.electronConfig})`;

      questions.push({
        id: `q-${i}-${target.slug}-c${qType}`,
        concept: qType,
        target,
        prompt: `Select the correct chemical family and outermost principal-shell electron count for atomic number Z = ${target.number}:`,
        options: rotateQuizOptions(options, i),
        correctSlug: target.slug,
        explanation: `Element #${target.number} is ${target.name} (${target.symbol}), a ${categoryLabel(target.category).toLowerCase()} in the ${target.block}-block ${valenceDetail}.`,
      });
    }
  }

  return questions;
}

export const NAV_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

export function isNavKey(key) {
  return NAV_KEYS.includes(key);
}

export function firstVisibleIndex(cells) {
  const i = cells.findIndex((c) => !c.hidden);
  return i === -1 ? null : i;
}

export function nextCellIndex(cells, current, key) {
  if (current < 0 || current >= cells.length) return firstVisibleIndex(cells);
  switch (key) {
    case "ArrowLeft": {
      for (let i = current - 1; i >= 0; i--) if (!cells[i].hidden) return i;
      return null;
    }
    case "ArrowRight": {
      for (let i = current + 1; i < cells.length; i++) if (!cells[i].hidden) return i;
      return null;
    }
    case "ArrowUp":
    case "ArrowDown": {
      const dir = key === "ArrowDown" ? 1 : -1;
      const { x, y } = cells[current];
      let best = null;
      let bestDist = Infinity;
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        if (c.hidden || c.x !== x) continue;
        const dist = (c.y - y) * dir;
        if (dist > 0 && dist < bestDist) {
          best = i;
          bestDist = dist;
        }
      }
      return best;
    }
    case "Home":
      return firstVisibleIndex(cells);
    case "End": {
      for (let i = cells.length - 1; i >= 0; i--) if (!cells[i].hidden) return i;
      return null;
    }
    default:
      return null;
  }
}