import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Atom, BookOpen, ShieldCheck, GraduationCap, ExternalLink } from "lucide-react";

const DATA_SOURCES = [
  {
    name: "IUPAC CIAAW",
    description: "Standard atomic weights and terrestrial isotopic abundances for naturally occurring elements.",
    url: "https://ciaaw.org/atomic-weights.htm",
  },
  {
    name: "NIST Atomic Spectra Database (ASD)",
    description: "Ground-state electron configurations, principal shell occupancies, and first ionization energies.",
    url: "https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html",
  },
  {
    name: "PubChem (NCBI / NIH)",
    description: "Cross-checked physical properties, covalent radii, and element summaries across all 118 elements.",
    url: "https://pubchem.ncbi.nlm.nih.gov/periodic-table/",
  },
  {
    name: "Royal Society of Chemistry",
    description: "Historical discovery records, practical applications, and chemical family classifications.",
    url: "https://periodic-table.rsc.org/",
  },
];

export default function About() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "About Elementa — Interactive Periodic Table & Chemistry Study Lab";
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="space-y-2 border-b border-[#242c38] pb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">About Elementa</h1>
          <p className="text-sm text-[#aeb8c4] leading-relaxed">
            Elementa is a fast, classroom-ready periodic table and chemistry study companion built for high-school,
            AP/IB, A-Level, and introductory college chemistry students and teachers.
          </p>
        </header>

        <section className="rounded-xl bg-[#131822] border border-[#242c38] p-5 space-y-2.5">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#4f9dff] shrink-0" />
            <span>Built for classrooms and independent study</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#aeb8c4] leading-relaxed">
            Every element page connects visual Bohr shell and orbital box diagrams (<em>s, p, d, f</em>) with periodic
            trends, side-by-side comparisons, and leveled practice quizzes. Teachers can assign quick 5-question bell
            ringers, 10-question review sets, or 20-question test-prep rounds across Easy (symbols and names), Standard
            (periodic trends and families), and Hard (electron configurations and Aufbau exceptions such as Cr and Cu)
            levels, or print a worksheet with an answer key.
          </p>
        </section>

        <section className="rounded-xl bg-[#131822] border border-[#242c38] p-5 space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#69db7c] shrink-0" />
            <span>Scientific accuracy and reference data</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#aeb8c4] leading-relaxed">
            Elementa compiles published reference values and distinguishes between dimensionless
            IUPAC standard atomic weights, primordial radioelements (Bi, Th, U), radiogenic decay-chain elements (Pa),
            and bracketed reference radioisotope mass numbers <code>[A]</code> for synthetic elements. Where a property
            is not experimentally established, the app reports “Not established” rather than an invented figure.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {DATA_SOURCES.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-[#0e121a] border border-[#242c38] hover:border-[#4f9dff] flex items-start justify-between gap-2 text-xs no-underline group"
              >
                <div>
                  <span className="font-semibold text-white group-hover:text-[#7bb6ff] block">{source.name}</span>
                  <span className="text-[11px] text-[#8b98a9] leading-snug block mt-0.5">{source.description}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#7a8694] shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-[#131822] border border-[#242c38] p-5 space-y-2.5">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#ffd43b] shrink-0" />
            <span>Private by design — no accounts, works offline</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#aeb8c4] leading-relaxed">
            Students never need to sign up, log in, or share personal data. Study decks, mastery progress, personal
            notes, and quiz history stay in the student&apos;s own browser via local storage and can be exported or
            imported as a JSON backup at any time. See our{" "}
            <Link to="/privacy" className="text-[#7bb6ff] hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link to="/terms" className="text-[#7bb6ff] hover:underline">
              Terms of Use
            </Link>{" "}
            for full details.
          </p>
        </section>

        <section className="rounded-xl bg-[#131822] border border-[#242c38] p-5 space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Atom className="w-4 h-4 text-[#da77f2] shrink-0" />
            <span>Creator &amp; contact</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#aeb8c4] leading-relaxed">
            Elementa is created by{" "}
            <a
              href="https://www.smolkin.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7bb6ff] hover:underline"
            >
              Michael Smolkin
            </a>{" "}
            (Smolk Apps). Classroom feedback, bug reports, and curriculum suggestions are always welcome via{" "}
            <a
              href="https://www.smolkin.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7bb6ff] hover:underline"
            >
              smolkin.org
            </a>
            . © 2025 Smolk Apps.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}