/**
 * Canonical dataset for all 118 elements.
 *
 * Fields are kept deliberately compact in the source tuple and expanded into a
 * rich `Element` object by `buildElements()` (see ./element-build.ts). Data is
 * drawn from standard references (IUPAC standard atomic weights 2021, NIST).
 * Grid positions (xpos 1-18, ypos 1-10) place the lanthanides/actinides in the
 * two detached rows so the table renders correctly — this is exactly the layout
 * bug ("Oganesson/Actinium tiny") described in the original app's notes.
 */

export type Category =
  | "alkali metal"
  | "alkaline earth metal"
  | "transition metal"
  | "post-transition metal"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble gas"
  | "lanthanide"
  | "actinide";

export type Phase = "solid" | "liquid" | "gas";

/**
 * Raw tuple per element. Order:
 * [number, symbol, name, atomicMass, category, xpos, ypos, electronConfig, phase, discoveredYear|null, discoveredBy|null]
 */
export type ElementTuple = [
  number,
  string,
  string,
  number,
  Category,
  number,
  number,
  string,
  Phase,
  number | null,
  string | null,
];

// Standard atomic weights: bracketed (synthetic / no stable isotope) values use
// the mass number of the most stable / common isotope.
export const ELEMENT_TUPLES: ElementTuple[] = [
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
