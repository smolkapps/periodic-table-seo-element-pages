import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AtomVisualizer from "@/components/AtomVisualizer";
import {
  ELEMENTS,
  CATEGORY_META,
  categoryLabel,
  formatMass,
  buildArticle,
  adjacentElements,
  buildElementShareUrl,
  isNavKey,
  nextCellIndex,
  firstVisibleIndex,
  } from "@/data/elementsData";
import { useStudyProgress } from "@/lib/studyStore";
import {
  Search,
  ArrowLeftRight,
  BrainCircuit,
  BookmarkCheck,
  Share2,
  X,
  ExternalLink,
  Flame,
  Info,
  RotateCcw,
} from "lucide-react";

const TREND_MODES = [
  { id: "category", label: "Category Standard", unit: "", desc: "10-family chemical classification." },
  {
    id: "electronegativity",
    label: "Electronegativity",
    unit: "Pauling",
    min: 0.7,
    max: 3.98,
    desc: "Increases left-to-right across a period (stronger effective nuclear charge Z_eff) and decreases down a group. Fluorine (3.98) is highest; light noble gases have no standard Pauling value.",
  },
  {
    id: "ionizationEnergy",
    label: "1st Ionization Energy",
    unit: "kJ/mol",
    min: 375,
    max: 2373,
    desc: "Energy required to remove the outermost electron (values follow the NIST Atomic Spectra Database compilation). Peaks at closed-shell noble gases (He 2372 kJ/mol) and troughs at alkali metals (Cs 375.7 kJ/mol).",
  },
  {
    id: "atomicRadius",
    label: "Covalent Radius",
    unit: "pm",
    min: 28,
    max: 260,
    desc: "Empirical covalent radius (pm). Shrinks across a period as nuclear charge pulls shells inward, and expands down a group as principal quantum number n increases.",
  },
];

function getTrendColor(mode, element) {
  if (mode === "category") {
    return CATEGORY_META[element.category]?.hex || "#4f9dff";
  }
  const val = element[mode];
  if (val === null || val === undefined) return "#2a323d";
  const spec = TREND_MODES.find((m) => m.id === mode);
  const ratio = Math.max(0, Math.min(1, (val - spec.min) / (spec.max - spec.min)));
  // Interpolate cyan (#38d9a9) -> blue (#4dabf7) -> amber/coral (#ff6b6b)
  const r = Math.round(45 + ratio * 210);
  const g = Math.round(190 - ratio * 95);
  const b = Math.round(245 - ratio * 140);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "explore";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPhase, setSelectedPhase] = useState("all");
  const [trendMode, setTrendMode] = useState("category");
  const [tabStopIndex, setTabStopIndex] = useState(0);
  const [drawerSlug, setDrawerSlug] = useState(searchParams.get("element") || null);
  const [toastMessage, setToastMessage] = useState("");

  const { savedSlugs, masteryMap, toggleSavedSlug } = useStudyProgress();

  const cellRefs = useRef([]);
  const searchInputRef = useRef(null);
  const tableScrollRef = useRef(null);
  const drawerDialogRef = useRef(null);
  const drawerCloseRef = useRef(null);
  const drawerTriggerRef = useRef(null);

  const openDrawer = (slug, triggerEl = null) => {
    drawerTriggerRef.current =
      triggerEl || (typeof document !== "undefined" ? document.activeElement : null);
    setDrawerSlug(slug);
  };

  const closeDrawer = () => {
    const previousSlug = drawerSlug;
    setDrawerSlug(null);
    requestAnimationFrame(() => {
      const trigger = drawerTriggerRef.current;
      if (trigger && typeof trigger.focus === "function" && trigger.isConnected) {
        trigger.focus();
        return;
      }
      if (previousSlug) {
        const idx = ELEMENTS.findIndex((e) => e.slug === previousSlug);
        if (idx !== -1 && cellRefs.current[idx]) {
          cellRefs.current[idx].focus();
        }
      }
    });
  };

  const scrollTableToGroup = (position) => {
    const container = tableScrollRef.current;
    if (!container) return;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const targetLeft = position === "start" ? 0 : position === "center" ? maxScroll * 0.45 : maxScroll;
    container.scrollTo({ left: targetLeft, behavior: "smooth" });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2800);
  };

  const toggleSaveElement = (slug) => {
    const added = toggleSavedSlug(slug);
    showToast(added ? `Saved ${slug} to study deck` : `Removed ${slug} from study deck`);
  };

  // Filter logic matching canonical table-ui.ts + category/phase filters
  const filteredFlags = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ELEMENTS.map((el) => {
      const catText = CATEGORY_META[el.category].label.toLowerCase();
      const hay = `${el.name} ${el.symbol} ${el.number} ${catText} ${el.electronConfig}`.toLowerCase();
      const matchesQuery = q.length === 0 || hay.includes(q);
      const matchesCat = selectedCategory === "all" || el.category === selectedCategory;
      const matchesPhase = selectedPhase === "all" || el.phase === selectedPhase;
      return !(matchesQuery && matchesCat && matchesPhase); // true = hidden
    });
  }, [searchQuery, selectedCategory, selectedPhase]);

  const visibleCount = useMemo(() => filteredFlags.filter((hidden) => !hidden).length, [filteredFlags]);
  const isFiltering = searchQuery.trim().length > 0 || selectedCategory !== "all" || selectedPhase !== "all";

  // Keep roving tabStop on a visible cell
  useEffect(() => {
    if (filteredFlags[tabStopIndex]) {
      const navCells = ELEMENTS.map((el, i) => ({ x: el.xpos, y: el.ypos, hidden: filteredFlags[i] }));
      const first = firstVisibleIndex(navCells);
      if (first !== null) setTabStopIndex(first);
    }
  }, [filteredFlags, tabStopIndex]);

  const handleGridKeyDown = (e, index) => {
    if (!isNavKey(e.key)) return;
    e.preventDefault();
    const navCells = ELEMENTS.map((el, i) => ({ x: el.xpos, y: el.ypos, hidden: filteredFlags[i] }));
    const nextIdx = nextCellIndex(navCells, index, e.key);
    if (nextIdx !== null) {
      setTabStopIndex(nextIdx);
      cellRefs.current[nextIdx]?.focus();
    }
  };

  const drawerElement = useMemo(
    () => (drawerSlug ? ELEMENTS.find((e) => e.slug === drawerSlug) || null : null),
    [drawerSlug]
  );

  const drawerArticle = useMemo(() => (drawerElement ? buildArticle(drawerElement) : null), [drawerElement]);

  useEffect(() => {
    if (!drawerSlug) return;
    const raf = requestAnimationFrame(() => {
      drawerCloseRef.current?.focus();
    });
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }
      if (e.key === "Tab" && drawerDialogRef.current) {
        const focusables = drawerDialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = /** @type {HTMLElement} */ (focusables[0]);
        const last = /** @type {HTMLElement} */ (focusables[focusables.length - 1]);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerSlug]);

  const handleShareElement = async (element) => {
    const url = buildElementShareUrl(element);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast(`Copied ${url}`);
      } else {
        showToast(`Share URL: ${url}`);
      }
    } catch {
      showToast(`Share URL: ${url}`);
    }
  };

  const setTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col selection:bg-[#4f9dff]/30">
      <Navbar />

      {/* Main Content */}
      <main id="main" className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero + Journey Ribbon */}
        <section className="rounded-xl bg-gradient-to-br from-[#141a24] via-[#11161f] to-[#0d1118] border border-[#242c38] p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Explore, Understand &amp; Master All 118 Chemical Elements
              </h1>
              <p className="text-sm text-[#aeb8c4] leading-relaxed">
                Select any element to inspect its atomic structure, electron shells, real-world uses, and reference
                sources. Color the table by periodic trends, compare elements side by side, and practice with quizzes.
              </p>
            </div>

            {/* 5-step user journey pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  openDrawer("oxygen", e.currentTarget);
                }}
                className="p-2.5 rounded-lg bg-[#1a2230] hover:bg-[#222c3d] border border-[#2c374b] text-left transition-all"
              >
                <span className="text-[10px] font-mono uppercase text-[#4dabf7] block">1. Understand</span>
                <span className="text-xs font-semibold text-white mt-0.5 block">Inspect Oxygen (O) →</span>
              </button>
              <Link
                to="/compare?ids=iron,gold,oxygen"
                className="p-2.5 rounded-lg bg-[#1a2230] hover:bg-[#222c3d] border border-[#2c374b] text-left transition-all"
              >
                <span className="text-[10px] font-mono uppercase text-[#ffd43b] block">2. Compare</span>
                <span className="text-xs font-semibold text-white mt-0.5 block">Fe vs Au vs O →</span>
              </Link>
              <Link
                to="/practice?focus=trends"
                className="p-2.5 rounded-lg bg-[#1a2230] hover:bg-[#222c3d] border border-[#2c374b] text-left transition-all"
              >
                <span className="text-[10px] font-mono uppercase text-[#69db7c] block">3. Practice</span>
                <span className="text-xs font-semibold text-white mt-0.5 block">Quick Quiz →</span>
              </Link>
              <Link
                to="/saved"
                className="p-2.5 rounded-lg bg-[#1a2230] hover:bg-[#222c3d] border border-[#2c374b] text-left transition-all"
              >
                <span className="text-[10px] font-mono uppercase text-[#da77f2] block">4. Retain</span>
                <span className="text-xs font-semibold text-white mt-0.5 block">Study Deck ({savedSlugs.length}) →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Controls Bar: Search + Phase + Trend Heatmap */}
        <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#131822] border border-[#242c38] rounded-xl p-3.5">
          {/* Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <label htmlFor="pt-search" className="sr-only">
                Filter elements
              </label>
              <Search className="w-4 h-4 text-[#7a8694] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                id="pt-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && searchQuery !== "") {
                    e.preventDefault();
                    setSearchQuery("");
                  }
                }}
                placeholder="Filter by name, symbol, atomic #, config, or category…"
                autoComplete="off"
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-[#1c232d] border border-[#2a323d] text-sm text-white placeholder-[#7a8694] focus:outline-none focus:border-[#4f9dff]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear filter"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7a8694] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Phase Filter */}
            <div className="flex items-center gap-1 bg-[#1c232d] p-1 rounded-lg border border-[#2a323d]">
              {["all", "solid", "liquid", "gas"].map((ph) => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => setSelectedPhase(ph)}
                  className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                    selectedPhase === ph ? "bg-[#4f9dff] text-[#07121f] font-semibold" : "text-[#aeb8c4] hover:text-white"
                  }`}
                >
                  {ph === "all" ? "All Phases" : ph}
                </button>
              ))}
            </div>

            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedPhase("all");
                }}
                className="text-xs text-[#7bb6ff] hover:underline flex items-center gap-1 px-2 py-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset filters
              </button>
            )}
          </div>

          {/* Periodic Trend Heatmap Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-[#7a8694] mr-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#ffa94d]" /> Color Mode:
            </span>
            {TREND_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setTrendMode(m.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  trendMode === m.id
                    ? "bg-[#4f9dff]/20 border-[#4f9dff] text-white shadow-sm"
                    : "bg-[#1c232d] border-[#2a323d] text-[#aeb8c4] hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </section>

        {/* Live Search Status & Trend Explanation Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <p className="text-xs font-mono text-[#aeb8c4] js-search-status" role="status" aria-live="polite">
            {isFiltering
              ? visibleCount === 0
                ? `No elements match “${searchQuery.trim()}”. Press Escape to clear.`
                : `${visibleCount} of ${ELEMENTS.length} elements shown`
              : `Showing all 118 elements • Use Arrow keys / Home / End to navigate cells`}
          </p>
          {trendMode !== "category" && (
            <div className="flex items-center gap-2 text-xs text-[#7bb6ff] bg-[#4f9dff]/10 border border-[#4f9dff]/25 rounded-lg px-3 py-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{TREND_MODES.find((m) => m.id === trendMode)?.desc}</span>
            </div>
          )}
        </div>

        {/* Mobile / Tablet Horizontal Scroll Helper for the 18-Column Grid */}
        <div className="flex lg:hidden items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#131822] border border-[#242c38] text-xs text-[#aeb8c4]">
          <span className="whitespace-nowrap">Swipe or jump:</span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => scrollTableToGroup("start")}
              className="px-2 py-1 rounded bg-[#1c232d] border border-[#2a323d] text-[11px] font-mono text-white hover:border-[#4f9dff]"
            >
              Grp 1–2
            </button>
            <button
              type="button"
              onClick={() => scrollTableToGroup("center")}
              className="px-2 py-1 rounded bg-[#1c232d] border border-[#2a323d] text-[11px] font-mono text-white hover:border-[#4f9dff]"
            >
              Grp 3–12
            </button>
            <button
              type="button"
              onClick={() => scrollTableToGroup("end")}
              className="px-2 py-1 rounded bg-[#1c232d] border border-[#2a323d] text-[11px] font-mono text-white hover:border-[#4f9dff]"
            >
              Grp 13–18
            </button>
          </div>
        </div>

        {/* 18-Column Crawlable + Keyboard-Navigable Periodic Table */}
        <div ref={tableScrollRef} className="overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div
            className={`grid gap-[4px] min-w-[920px] js-periodic-table ${isFiltering ? "filtering" : ""}`}
            style={{
              gridTemplateColumns: "repeat(18, minmax(46px, 1fr))",
              gridAutoRows: "minmax(52px, auto)",
            }}
            role="group"
            aria-label="Periodic table of the elements"
          >
            {ELEMENTS.map((element, idx) => {
              const hidden = filteredFlags[idx];
              if (hidden) return null;
              const accentColor = getTrendColor(trendMode, element);
              const isSaved = savedSlugs.includes(element.slug);
              const isSelected = drawerSlug === element.slug;
              const trendValue =
                trendMode === "electronegativity"
                  ? element.electronegativity ?? "—"
                  : trendMode === "ionizationEnergy"
                  ? element.ionizationEnergy
                    ? Math.round(element.ionizationEnergy)
                    : "—"
                  : trendMode === "atomicRadius"
                  ? element.atomicRadius
                    ? `${element.atomicRadius}pm`
                    : "—"
                  : null;

              return (
                <a
                  key={element.number}
                  ref={(el) => (cellRefs.current[idx] = el)}
                  href={`#/element/${element.slug}`}
                  tabIndex={idx === tabStopIndex ? 0 : -1}
                  data-slug={element.slug}
                  data-symbol={element.symbol}
                  data-number={element.number}
                  data-name={element.name}
                  data-x={element.xpos}
                  data-y={element.ypos}
                  onKeyDown={(e) => handleGridKeyDown(e, idx)}
                  onFocus={() => setTabStopIndex(idx)}
                  onClick={(event) => {
                    // Pending patch 5b0c592 + origin/main integration:
                    // Real crawlable link that opens the slide-in drawer on unmodified primary click
                    if (
                      event.button !== 0 ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey
                    ) {
                      return;
                    }
                    event.preventDefault();
                    openDrawer(element.slug, event.currentTarget);
                  }}
                  aria-label={`${element.name}, symbol ${element.symbol}, atomic number ${element.number}. Open details.`}
                  style={{
                    gridColumn: element.xpos,
                    gridRow: element.ypos,
                    borderLeftColor: accentColor,
                    backgroundColor:
                      trendMode !== "category" && element[trendMode] !== null
                        ? `${accentColor}1f`
                        : isSelected
                        ? "#253042"
                        : "#181f29",
                  }}
                  className={`pt-cell js-cell relative flex flex-col justify-between p-1.5 rounded-[5px] border border-[#2a323d] border-l-[4px] text-left no-underline transition-transform duration-100 hover:-translate-y-0.5 hover:border-[#4f9dff] hover:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4f9dff] ${
                    isSelected ? "ring-2 ring-[#4f9dff] z-10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between w-full leading-none">
                    <span className="text-[10px] font-mono text-[#8b98a9]">{element.number}</span>
                    {isSaved && <span className="w-1.5 h-1.5 rounded-full bg-[#4f9dff]" title="Saved in Study Deck" />}
                  </div>
                  <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#e9edf2] leading-tight">
                    {element.symbol}
                  </span>
                  <span className="text-[9px] text-[#aeb8c4] truncate w-full leading-none">
                    {trendValue !== null ? trendValue : element.name}
                  </span>
                </a>
              );
            })}

            {/* Detached f-block leader placeholders */}
            {!isFiltering && (
              <>
                <div
                  style={{ gridColumn: 3, gridRow: 6 }}
                  aria-hidden="true"
                  className="flex flex-col items-center justify-center border border-dashed border-[#2a323d] rounded-[5px] text-[10px] font-mono text-[#7a8694]"
                >
                  <span>57–71</span>
                  <span className="text-[8px] text-[#f783ac]">La–Lu</span>
                </div>
                <div
                  style={{ gridColumn: 3, gridRow: 7 }}
                  aria-hidden="true"
                  className="flex flex-col items-center justify-center border border-dashed border-[#2a323d] rounded-[5px] text-[10px] font-mono text-[#7a8694]"
                >
                  <span>89–103</span>
                  <span className="text-[8px] text-[#e599f7]">Ac–Lr</span>
                </div>
                <div style={{ gridColumn: "1 / -1", gridRow: 8, height: "10px" }} aria-hidden="true" />
              </>
            )}
          </div>
        </div>

        {/* Interactive Category Filter Legend */}
        <div className="flex flex-wrap items-center gap-2 pt-1" aria-label="Category filter legend">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
              selectedCategory === "all"
                ? "bg-white text-[#0e1116] border-white font-semibold"
                : "bg-[#161b22] text-[#aeb8c4] border-[#2a323d] hover:text-white"
            }`}
          >
            All Categories (118)
          </button>
          {Object.entries(CATEGORY_META).map(([cat, meta]) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(active ? "all" : cat)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all ${
                  active
                    ? "bg-[#222b38] text-white border-[#4f9dff] ring-1 ring-[#4f9dff]"
                    : "bg-[#161b22] text-[#aeb8c4] border-[#2a323d] hover:border-[#4f9dff]/50 hover:text-white"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: meta.hex }} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </main>

      {/* Slide-in Element Detail Drawer (Progressive Enhancement of /element/:slug) */}
      {drawerElement && drawerArticle && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => closeDrawer()}
          />
          <aside
            ref={drawerDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-title"
            className="relative z-10 w-full max-w-xl bg-[#131822] border-l border-[#2a323d] h-full flex flex-col shadow-2xl overflow-hidden"
            style={{ borderTop: `5px solid ${CATEGORY_META[drawerElement.category].hex}` }}
          >
            {/* Drawer Header — controls on the RIGHT per canonical spec */}
            <div className="p-4 sm:p-5 border-b border-[#242c38] flex items-start justify-between gap-3 bg-[#161c27]">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-14 h-14 rounded-lg bg-[#1c232d] border border-[#2a323d] border-l-4 flex flex-col items-center justify-center shrink-0"
                  style={{ borderLeftColor: CATEGORY_META[drawerElement.category].hex }}
                >
                  <span className="text-[10px] font-mono text-[#7a8694] leading-none">{drawerElement.number}</span>
                  <span className="text-2xl font-extrabold text-white leading-tight">{drawerElement.symbol}</span>
                  <span className="text-[9px] font-mono text-[#aeb8c4] leading-none">{formatMass(drawerElement)}</span>
                </div>
                <div>
                  <h2 id="panel-title" className="text-xl font-bold text-white">
                    {drawerElement.name} ({drawerElement.symbol})
                  </h2>
                  <p className="text-xs text-[#aeb8c4]">
                    Element {drawerElement.number} • {categoryLabel(drawerElement.category)} • Period{" "}
                    {drawerElement.period}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleSaveElement(drawerElement.slug)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
                    savedSlugs.includes(drawerElement.slug)
                      ? "bg-[#4f9dff]/20 border-[#4f9dff] text-[#7bb6ff]"
                      : "bg-[#1c232d] border-[#2a323d] text-[#e9edf2] hover:border-[#4f9dff]"
                  }`}
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>{savedSlugs.includes(drawerElement.slug) ? "Saved" : "Save"}</span>
                </button>
                <button
                  type="button"
                  data-share-url={buildElementShareUrl(drawerElement)}
                  onClick={() => handleShareElement(drawerElement)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#1c232d] border border-[#2a323d] text-[#e9edf2] hover:border-[#4f9dff] flex items-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <Link
                  to={`/element/${drawerElement.slug}`}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#4f9dff] text-[#07121f] hover:bg-[#7bb6ff] transition-colors flex items-center gap-1 no-underline"
                >
                  <span>Show more →</span>
                </Link>
                <button
                  ref={drawerCloseRef}
                  type="button"
                  onClick={() => closeDrawer()}
                  aria-label="Close panel"
                  className="p-1.5 rounded-lg bg-[#1c232d] border border-[#2a323d] text-[#aeb8c4] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/compare?ids=${[
                    adjacentElements(drawerElement.number).prev?.slug,
                    drawerElement.slug,
                    adjacentElements(drawerElement.number).next?.slug,
                  ]
                    .filter(Boolean)
                    .join(",")}`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#1c232d] border border-[#2a323d] text-[#7bb6ff] hover:border-[#4f9dff] flex items-center gap-1.5 no-underline"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Compare with neighbours</span>
                </Link>
                <Link
                  to={`/practice?element=${drawerElement.slug}`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#1c232d] border border-[#2a323d] text-[#69db7c] hover:border-[#69db7c] flex items-center gap-1.5 no-underline"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Quiz on {drawerElement.name}</span>
                </Link>
              </div>

              <AtomVisualizer element={drawerElement} compact={true} />

              {/* Non-repetitive Article Prose */}
              <div className="article space-y-4">
                <p className="text-base text-white font-serif leading-relaxed">{drawerArticle.summary}</p>
                {drawerArticle.sections.map((sec) => (
                  <section key={sec.heading} className="space-y-1">
                    <h3 className="text-sm font-bold text-white">{sec.heading}</h3>
                    <p className="text-sm text-[#aeb8c4] font-serif leading-relaxed">{sec.body}</p>
                  </section>
                ))}
              </div>

              {/* Facts Table */}
              <div className="rounded-xl border border-[#242c38] overflow-hidden">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-[#242c38]">
                    {drawerArticle.facts.map((f) => (
                      <tr key={f.label} className="bg-[#151b26]">
                        <th scope="row" className="py-2 px-3 text-left font-medium text-[#8b98a9] w-2/5">
                          {f.label}
                        </th>
                        <td className="py-2 px-3 font-mono text-[#e9edf2]">{f.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reference Sources */}
              <div className="space-y-2 pt-2 border-t border-[#242c38]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8b98a9]">
                  Reference Sources
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {drawerArticle.citations.map((cit) => (
                    <a
                      key={cit.source}
                      href={cit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg bg-[#161c26] border border-[#242c38] hover:border-[#4f9dff] flex items-start justify-between gap-2 text-xs no-underline group"
                    >
                      <div>
                        <span className="font-semibold text-white group-hover:text-[#7bb6ff] block">{cit.source}</span>
                        <span className="text-[11px] text-[#8b98a9]">{cit.title}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#7a8694] shrink-0 mt-0.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[#1c232d] border border-[#4f9dff] text-xs font-medium text-white shadow-xl"
        >
          {toastMessage}
        </div>
      )}

      <Footer />
    </div>
  );
}