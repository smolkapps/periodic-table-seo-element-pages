import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ELEMENTS,
  CATEGORY_META,
  DEFAULT_COMPARE_SLUGS,
  MIN_COMPARE,
  MAX_COMPARE,
  buildComparison,
  buildElementContrastSummary,
  buildComparisonShareUrl,
  resolveComparisonSlugs,
} from "@/data/elementsData";
import { Share2, BrainCircuit, Sparkles, Check } from "lucide-react";

const CURATED_PRESETS = [
  { label: "Default Trio (Fe, Au, O)", slugs: ["iron", "gold", "oxygen"], tag: "Featured" },
  { label: "Coinage Metals (Cu, Ag, Au)", slugs: ["copper", "silver", "gold"], tag: "Group 11" },
  { label: "Battery Alkali (Li, Na, K)", slugs: ["lithium", "sodium", "potassium"], tag: "Group 1" },
  { label: "Halogens (F, Cl, Br)", slugs: ["fluorine", "chlorine", "bromine"], tag: "Group 17" },
  { label: "Semiconductors (Si, Ge, Ga)", slugs: ["silicon", "germanium", "gallium"], tag: "Electronics" },
  { label: "Life Core (C, N, O)", slugs: ["carbon", "nitrogen", "oxygen"], tag: "Period 2" },
];

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedUrl, setCopiedUrl] = useState("");

  const readIdsFromLocation = () => {
    const routerIds = searchParams.get("ids");
    if (routerIds) return routerIds;
    if (typeof window !== "undefined" && window.location.search) {
      return new URLSearchParams(window.location.search).get("ids");
    }
    return null;
  };

  const computeSlotsFromParam = (idsParam) => {
    if (!idsParam) return [...DEFAULT_COMPARE_SLUGS];
    const resolved = resolveComparisonSlugs(idsParam.split(","));
    if (resolved.length < MIN_COMPARE) {
      return [...DEFAULT_COMPARE_SLUGS];
    }
    return Array.from({ length: MAX_COMPARE }, (_, i) => (i < resolved.length ? resolved[i].slug : ""));
  };

  const [slots, setSlots] = useState(() => computeSlotsFromParam(readIdsFromLocation()));

  // Sync slots when ?ids= query param changes via navigation
  const urlIdsParam = searchParams.get("ids");
  useEffect(() => {
    if (urlIdsParam !== null) {
      setSlots(computeSlotsFromParam(urlIdsParam));
    }
  }, [urlIdsParam]);

  const chosenSlugs = useMemo(() => slots.filter((s) => s && s.length > 0), [slots]);
  const distinctChosenCount = useMemo(() => new Set(chosenSlugs.map((s) => s.toLowerCase())).size, [chosenSlugs]);

  const resolvedElements = useMemo(() => {
    if (chosenSlugs.length < MIN_COMPARE || distinctChosenCount < MIN_COMPARE) {
      return [];
    }
    return resolveComparisonSlugs(chosenSlugs);
  }, [chosenSlugs, distinctChosenCount]);

  const syncUrlToSelection = (nextSlots) => {
    const valid = resolveComparisonSlugs(nextSlots.filter(Boolean));
    if (valid.length >= MIN_COMPARE) {
      const ids = valid.map((e) => e.slug).join(",");
      setSearchParams({ ids }, { replace: true });
    }
  };

  const comparison = useMemo(
    () => (resolvedElements.length >= MIN_COMPARE ? buildComparison(resolvedElements) : null),
    [resolvedElements]
  );

  const shareUrl = useMemo(
    () =>
      buildComparisonShareUrl(
        resolvedElements.length >= MIN_COMPARE ? resolvedElements : DEFAULT_COMPARE_SLUGS
      ),
    [resolvedElements]
  );

  const hintMessage = useMemo(() => {
    if (resolvedElements.length >= MIN_COMPARE) return "";
    return chosenSlugs.length >= MIN_COMPARE && distinctChosenCount < MIN_COMPARE
      ? "Pick two different elements to compare."
      : "Pick at least two elements to compare.";
  }, [chosenSlugs, distinctChosenCount, resolvedElements]);

  const handleCopyShareUrl = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // Clipboard may be restricted in headless/unprivileged contexts; still surface the canonical URL.
    }
    setCopiedUrl(shareUrl);
    setTimeout(() => setCopiedUrl(""), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Compare Elements Side by Side</h1>
            <p className="text-sm text-[#aeb8c4]">
              Align any two or three of the 118 elements across atomic mass, category, group/period, electron
              configuration, periodic trends, and discovery. Greatest values in numeric rows are highlighted.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:flex items-stretch sm:items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              data-share-url={shareUrl}
              aria-label="Copy shareable comparison link"
              onClick={handleCopyShareUrl}
              className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#161b22] border border-[#2a323d] hover:border-[#4f9dff] text-xs font-semibold text-white flex items-center justify-center gap-1.5"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#69db7c] shrink-0" /> : <Share2 className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{copiedUrl ? `Copied ${copiedUrl}` : "Copy Shareable URL"}</span>
            </button>
            {resolvedElements.length >= MIN_COMPARE && (
              <>
                <Link
                  to={`/tutor?ids=${resolvedElements.map((e) => e.slug).join(",")}`}
                  aria-label={`Ask the tutor to compare ${resolvedElements.map((e) => e.name).join(", ")}`}
                  className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#161b22] border border-[#ffd43b]/50 hover:border-[#ffd43b] text-xs font-semibold text-[#ffd43b] flex items-center justify-center gap-1.5 no-underline"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Ask Tutor to Compare</span>
                </Link>
                <Link
                  to={`/practice?ids=${resolvedElements.map((e) => e.slug).join(",")}`}
                  aria-label={`Start quiz comparing ${resolvedElements.map((e) => e.name).join(", ")}`}
                  className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#4f9dff] text-[#07121f] hover:bg-[#7bb6ff] text-xs font-semibold flex items-center justify-center gap-1.5 no-underline"
                >
                  <BrainCircuit className="w-3.5 h-3.5 shrink-0" />
                  <span>Quiz This Comparison</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* One-Click Chemistry Comparison Presets */}
        <div role="group" aria-label="Comparison presets" className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-[#7a8694] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#ffd43b]" /> Presets:
          </span>
          {CURATED_PRESETS.map((preset) => {
            const isPresetActive =
              preset.slugs.length === resolvedElements.length &&
              preset.slugs.every((slug, i) => resolvedElements[i]?.slug === slug);
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={isPresetActive}
                onClick={() => {
                  const next = [preset.slugs[0], preset.slugs[1], preset.slugs[2] || ""];
                  setSlots(next);
                  syncUrlToSelection(next);
                }}
                className={`min-h-[40px] px-3 py-2 rounded-lg border text-xs transition-colors ${
                  isPresetActive
                    ? "bg-[#4f9dff]/20 border-[#4f9dff] text-white font-semibold"
                    : "bg-[#131822] border-[#242c38] hover:border-[#4f9dff] text-[#aeb8c4] hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* 3 Element Pickers */}
        <form
          aria-label="Choose elements to compare"
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#131822] border border-[#242c38] rounded-xl p-4"
        >
          {slots.map((selectedSlug, idx) => (
            <label key={idx} className="flex flex-col gap-1.5">
              <span className="text-xs font-mono text-[#8b98a9]">
                Element {idx + 1}
                {idx >= 2 ? " (optional)" : ""}
              </span>
              <select
                name={`el${idx + 1}`}
                aria-label={`Element ${idx + 1}${idx >= 2 ? " (optional)" : ""}`}
                value={selectedSlug}
                onChange={(e) => {
                  const val = e.target.value;
                  const next = slots.map((item, i) => (i === idx ? val : item));
                  setSlots(next);
                  syncUrlToSelection(next);
                }}
                className="js-compare-select min-h-[44px] px-3 py-2.5 rounded-lg bg-[#1c232d] border border-[#2a323d] text-sm text-white focus:outline-none focus:border-[#4f9dff]"
              >
                {idx >= 2 && <option value="">None</option>}
                {ELEMENTS.map((el) => (
                  <option key={el.slug} value={el.slug}>
                    {el.number} · {el.symbol} — {el.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </form>

        {/* Comparison Table or Hint */}
        <div className="js-compare-result cmp-result" aria-live="polite">
          {!comparison ? (
            <div className="rounded-xl bg-[#131822] border border-[#ffd43b]/40 p-6 text-center space-y-3">
              <p className="cmp-hint text-sm font-semibold text-[#ffd43b]">{hintMessage}</p>
              <button
                type="button"
                onClick={() => {
                  const next = [...DEFAULT_COMPARE_SLUGS];
                  setSlots(next);
                  syncUrlToSelection(next);
                }}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[#1c232d] border border-[#2a323d] hover:border-[#4f9dff] text-xs font-semibold text-white"
              >
                Reset to Default Trio (Fe, Au, O)
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl bg-[#131822] border border-[#242c38] overflow-x-auto shadow-lg">
                <div className="sm:hidden px-4 py-1.5 bg-[#161c27] border-b border-[#242c38] text-[11px] text-[#8b98a9]">
                  Swipe table horizontally to compare all columns →
                </div>
                <table className="cmp-table w-full text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#161c27] border-b border-[#242c38]">
                      <th
                        scope="col"
                        className="sticky left-0 z-10 bg-[#161c27] py-3.5 px-3 sm:px-4 text-left text-xs font-mono uppercase text-[#7a8694] w-36 sm:w-48"
                      >
                        Property
                      </th>
                      {comparison.elements.map((el) => {
                        const accent = CATEGORY_META[el.category]?.hex || "#4f9dff";
                        return (
                          <th key={el.slug} scope="col" className="py-3.5 px-3 sm:px-4 text-left min-w-[140px]">
                            <Link
                              to={`/element/${el.slug}`}
                              className="min-h-[40px] inline-flex items-center gap-2 text-white hover:text-[#7bb6ff] no-underline font-bold text-sm sm:text-base"
                            >
                              <span
                                className="cmp-sym px-2 py-0.5 rounded bg-[#1c232d] font-mono text-xs sm:text-sm border-l-[3px]"
                                style={{ borderLeftColor: accent }}
                              >
                                {el.symbol}
                              </span>
                              <span>{el.name}</span>
                            </Link>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242c38]">
                    {comparison.rows.map((row) => (
                      <tr key={row.label} className="hover:bg-[#18202c]/60">
                        <th
                          scope="row"
                          className="sticky left-0 z-10 bg-[#131822] py-3 px-3 sm:px-4 text-left font-medium text-[#8b98a9] whitespace-nowrap border-r border-[#242c38]/60"
                        >
                          {row.label}
                        </th>
                        {row.values.map((val, i) => {
                          const isMax = row.maxIndex === i;
                          return (
                            <td
                              key={i}
                              className={`py-3 px-4 font-mono ${
                                isMax ? "cmp-max text-[#7bb6ff] font-bold bg-[#4f9dff]/10" : "text-[#e9edf2]"
                              }`}
                            >
                              {val}
                              {isMax && (
                                <span className="ml-2 text-[10px] font-sans uppercase px-1.5 py-0.5 rounded bg-[#4f9dff]/20 text-[#7bb6ff]">
                                  Highest
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-4 py-3 text-xs text-[#aeb8c4]">
                  Atomic weights are dimensionless. Bracketed [A] values are reference isotope mass numbers, not measured atomic masses.
                </p>
              </div>

              {/* Visual Synthesis of Key Contrasts */}
              <div className="rounded-xl bg-[#131822] border border-[#242c38] p-5 space-y-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#4f9dff]" />
                  <span>Why These Elements Behave Differently</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {comparison.elements.map((el) => {
                    const meta = CATEGORY_META[el.category];
                    return (
                      <div
                        key={el.slug}
                        className="p-3.5 rounded-lg bg-[#0e121a] border border-[#242c38] space-y-1.5"
                        style={{ borderTop: `3px solid ${meta.hex}` }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">
                            {el.name} ({el.symbol})
                          </span>
                          <span className="text-[11px] font-mono text-[#8b98a9]">
                            {el.outerShellElectrons} outer e⁻ ({el.block}-block)
                          </span>
                        </div>
                        <p className="text-xs text-[#aeb8c4] leading-relaxed">
                          {buildElementContrastSummary(el, comparison.elements)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/"
            className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#161b22] border border-[#2a323d] text-xs font-medium text-[#aeb8c4] hover:text-white inline-flex items-center no-underline"
          >
            ← Back to the table
          </Link>
          <Link
            to="/elements"
            className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#161b22] border border-[#2a323d] text-xs font-medium text-[#aeb8c4] hover:text-white inline-flex items-center no-underline"
          >
            Browse all 118 elements
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}