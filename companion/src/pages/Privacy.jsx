import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HardDrive, ShieldCheck, Trash2, Download } from "lucide-react";

const SECTIONS = [
  {
    icon: HardDrive,
    title: "What Elementa stores on your device",
    body: [
      "Your study deck (elements you saved), mastery marks, personal study notes, and quiz history are saved as four entries in this browser's local storage. They stay on this device and this browser only.",
      "A new install or a cleared browser starts with genuinely empty progress: no sample quizzes, notes, or mastered elements are created for you.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "What Elementa does not collect",
    body: [
      "Elementa has no accounts, no sign-up, no login, and no cloud profile. It does not send your study data to a server, and it does not read a shared learner record on any service.",
      "There are no analytics, advertising, tracking pixels, or third-party scripts in the study experience. The app works offline once loaded.",
      "Science reference links (IUPAC, NIST, PubChem, Royal Society of Chemistry) open in a new tab; those sites have their own privacy policies once you visit them.",
    ],
  },
  {
    icon: Download,
    title: "Export and import are yours to control",
    body: [
      "The Saved page can export your progress to a JSON file on your device, and import it back. Use it to move progress between devices or as a backup. Imported files are validated before they replace local progress.",
    ],
  },
  {
    icon: Trash2,
    title: "How to delete your data",
    body: [
      "Remove individual elements, notes, or mastery marks inside the app, or clear this site's data in your browser settings (Settings → Privacy → Site data). Clearing site data removes all Elementa progress on that device.",
      "Because nothing is stored on a server, there is no account to delete and no remote copy to request.",
    ],
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="space-y-2 border-b border-[#242c38] pb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Privacy Policy</h1>
          <p className="text-sm text-[#aeb8c4]">
            Elementa is a device-local chemistry study tool. This page explains exactly what is stored and what is
            not. Last updated November 2025.
          </p>
        </header>

        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <section key={section.title} className="rounded-xl bg-[#131822] border border-[#242c38] p-5 space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <section.icon className="w-4 h-4 text-[#4f9dff] shrink-0" />
                <span>{section.title}</span>
              </h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-xs sm:text-sm text-[#aeb8c4] leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <section className="rounded-xl bg-[#131822] border border-[#242c38] p-5 space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-white">Classroom and child safety</h2>
          <p className="text-xs sm:text-sm text-[#aeb8c4] leading-relaxed">
            Elementa does not ask for a name, email address, birth date, or school, and it collects no personal
            information from students. A teacher can use it in class without creating accounts or collecting student
            data. Progress stays in each student's own browser.
          </p>
        </section>

        <section className="rounded-xl bg-[#131822] border border-[#242c38] p-5 space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-white">Contact</h2>
          <p className="text-xs sm:text-sm text-[#aeb8c4] leading-relaxed">
            Questions about this policy can be sent through{" "}
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