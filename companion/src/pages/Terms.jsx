import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const SECTIONS = [
  {
    title: "Educational use",
    paragraphs: [
      "Elementa is a study aid for learning the periodic table. It is provided free for personal, classroom, and non-commercial educational use.",
      "The app is not a substitute for a textbook, a lab manual, a teacher, or official exam materials. Always confirm values that matter for an assignment, experiment, or safety decision against a primary reference.",
    ],
  },
  {
    title: "About the chemistry data",
    paragraphs: [
      "Element records compile publicly published reference values: standard atomic weights from IUPAC CIAAW, ionization energies and ground-state configurations consistent with NIST compilations, and physical properties cross-checked against PubChem and the Royal Society of Chemistry periodic table.",
      "Values are provided as reference data, not as certified measurements. Where a property is not experimentally established (for example electronegativity of the lighter noble gases, or the radius of a very short-lived synthetic element) the app shows “not established” rather than an invented number.",
      "Bohr shell diagrams and subshell box diagrams are simplified teaching models. They are not scale-accurate depictions of quantum-mechanical electron behavior.",
    ],
  },
  {
    title: "Your progress and backups",
    paragraphs: [
      "Study progress is stored only in this browser on this device. You are responsible for keeping backups: use Export JSON on the Saved page before clearing browser data or changing devices.",
      "Because progress is device-local, Smolk Apps cannot recover progress that was cleared from your browser or lost when you reset a device.",
    ],
  },
  {
    title: "Acceptable use",
    paragraphs: [
      "Do not present Elementa as an official source, misrepresent its data as certified measurements, or redistribute modified copies in a way that implies endorsement by IUPAC, NIST, PubChem, the Royal Society of Chemistry, or Smolk Apps.",
      "Bulk automated scraping, resale of the app, and attempts to disrupt the service are not permitted.",
    ],
  },
  {
    title: "No warranty",
    paragraphs: [
      "Elementa is provided “as is”, without warranties of any kind, express or implied, including fitness for a particular purpose or freedom from errors. To the extent permitted by law, Smolk Apps is not liable for any loss arising from use of the app, including lost study progress.",
    ],
  },
  {
    title: "Changes",
    paragraphs: [
      "This page may be updated as the app changes. The date below reflects the current version. Continued use after an update means you accept the revised terms.",
    ],
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="space-y-2 border-b border-[#242c38] pb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Terms of Use</h1>
          <p className="text-sm text-[#aeb8c4]">
            The terms that apply when you use Elementa. Last updated November 2025.
          </p>
        </header>

        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <section key={section.title} className="rounded-xl bg-[#131822] border border-[#242c38] p-5 space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-white">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-xs sm:text-sm text-[#aeb8c4] leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <section className="rounded-xl bg-[#131822] border border-[#242c38] p-5 space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-white">Contact</h2>
          <p className="text-xs sm:text-sm text-[#aeb8c4] leading-relaxed">
            Reach Smolk Apps through{" "}
            <a
              href="https://www.smolkin.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7bb6ff] hover:underline"
            >
              smolkin.org
            </a>
            . See also the{" "}
            <Link to="/privacy" className="text-[#7bb6ff] hover:underline">
              Privacy Policy
            </Link>
            . © 2025 Smolk Apps.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}