import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Atom, ArrowLeftRight, BrainCircuit, BookmarkCheck, Layers, Sparkles } from "lucide-react";
import { useStudyProgress } from "@/lib/studyStore";
import StorageNotice from "@/components/StorageNotice";

export default function Navbar() {
  const location = useLocation();
  const { savedSlugs, masteryMap } = useStudyProgress();
  const masteredCount = Object.values(masteryMap).filter((m) => m?.mastered).length;

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#242c38] bg-[#0e121a]/95 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-2.5 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group no-underline focus:outline-none shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#161c26] border-2 border-[#4f9dff] flex flex-col items-center justify-center shadow-[0_0_15px_rgba(79,157,255,0.2)] group-hover:border-[#7bb6ff] transition-colors">
              <span className="text-[7px] sm:text-[8px] font-mono text-[#7a8694] leading-none">118</span>
              <span className="text-xs sm:text-sm font-extrabold text-[#e9edf2] leading-tight">El</span>
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                Elementa
                <span className="hidden lg:inline-block text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#4f9dff]/15 text-[#7bb6ff] border border-[#4f9dff]/30">
                  {masteredCount}/118 Mastered
                </span>
              </span>
              <span className="block text-[11px] text-[#8b98a9] hidden xl:block">
                Interactive Periodic Table &amp; Chemistry Study Lab
              </span>
            </div>
          </Link>

          <span className="sm:hidden text-[11px] font-mono text-[#7bb6ff] bg-[#4f9dff]/10 border border-[#4f9dff]/30 px-2 py-0.5 rounded">
            {masteredCount}/118 Mastered
          </span>
        </div>

        <nav
          aria-label="Primary"
          className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto"
        >
          <Link
            to="/"
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-1.5 no-underline transition-all whitespace-nowrap ${
              isActive("/")
                ? "bg-[#4f9dff] text-[#07121f] font-semibold shadow-sm"
                : "text-[#aeb8c4] hover:text-white hover:bg-[#1c232d]"
            }`}
          >
            <Atom className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Table</span>
          </Link>
          <Link
            to="/elements"
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-1.5 no-underline transition-all whitespace-nowrap ${
              isActive("/elements")
                ? "bg-[#4f9dff] text-[#07121f] font-semibold shadow-sm"
                : "text-[#aeb8c4] hover:text-white hover:bg-[#1c232d]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>All 118</span>
          </Link>
          <Link
            to="/compare"
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-1.5 no-underline transition-all whitespace-nowrap ${
              isActive("/compare")
                ? "bg-[#4f9dff] text-[#07121f] font-semibold shadow-sm"
                : "text-[#aeb8c4] hover:text-white hover:bg-[#1c232d]"
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Compare</span>
          </Link>
          <Link
            to="/practice"
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-1.5 no-underline transition-all whitespace-nowrap ${
              isActive("/practice")
                ? "bg-[#4f9dff] text-[#07121f] font-semibold shadow-sm"
                : "text-[#aeb8c4] hover:text-white hover:bg-[#1c232d]"
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Practice</span>
          </Link>
          <Link
            to="/tutor"
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-1.5 no-underline transition-all whitespace-nowrap ${
              isActive("/tutor")
                ? "bg-[#4f9dff] text-[#07121f] font-semibold shadow-sm"
                : "text-[#aeb8c4] hover:text-white hover:bg-[#1c232d]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Tutor</span>
          </Link>
          <Link
            to="/saved"
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-1.5 no-underline transition-all whitespace-nowrap ${
              isActive("/saved")
                ? "bg-[#4f9dff] text-[#07121f] font-semibold shadow-sm"
                : "text-[#aeb8c4] hover:text-white hover:bg-[#1c232d]"
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Saved ({savedSlugs.length})</span>
          </Link>
        </nav>
      </div>
      <StorageNotice />
    </header>
  );
}