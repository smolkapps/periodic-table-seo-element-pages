import React, { useState, useMemo } from "react";
import AtomVisualizer from "@/components/AtomVisualizer";
import { CATEGORY_META, buildPeriodicTrendInsight } from "@/data/elementsData";
import { Atom, TrendingUp, X } from "lucide-react";

const TREND_METRICS = [
  { key: "electronegativity", label: "Pauling Electronegativity", unit: "" },
  { key: "ionizationEnergy", label: "1st Ionization Energy", unit: "kJ/mol" },
  { key: "atomicRadius", label: "Covalent Radius", unit: "pm" },
];

/**
 * @param {{
 *   elements: any[]
 * }} props
 */
export default function ComparisonVisualLens({ elements = [] }) {
  /** @type {[string | null, import("react").Dispatch<import("react").SetStateAction<string | null>>]} */
  const [inspectedSlug, setInspectedSlug] = useState(null);

  const maxRadius = useMemo(() => {
    const radii = elements.map((el) => el.atomicRadius).filter((v) => v !== null && Number.isFinite(v));
    return radii.length > 0 ? Math.max(...radii) : 0;
  }, [elements]);

  const insight = useMemo(() => buildPeriodicTrendInsight(elements), [elements]);

  const inspectedElement = useMemo(
    () => (inspectedSlug ? elements.find((el) => el.slug === inspectedSlug) || null : null),
    [elements, inspectedSlug]
  );

  if (elements.length < 2) return null;

  return (
    <section
      aria-label="Visual Atomic Scale and Periodic Trend Comparison"
      className="rounded-xl bg-[#131822] border border-[#242c38] p-4 sm:p-5 space-y-5 shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Atom className="w-4 h-4 text-[#4f9dff] shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-white">
            Visual Atomic Scale &amp; Periodic Trend Lens
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-[#1c232d] text-[#aeb8c4] border border-[#2a323d]">
          Relative covalent radii (pm)
        </span>
      </div>

      <p className="text-xs text-[#aeb8c4] leading-relaxed">
        Outlines compare reference covalent radii; each chart scales to the largest known value in this selection.
        Inspect an element for its separate, simplified shell or orbital model.
      </p>

      {/* Scaled Covalent Radius Circles + Shell Inspector Triggers */}
      <div className={`grid grid-cols-1 ${elements.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-3.5`}>
        {elements.map((el) => {
          const accent = CATEGORY_META[el.category]?.hex || "#4f9dff";
          const hasRadius = el.atomicRadius !== null && maxRadius > 0;
          const outerR = hasRadius ? Number(((el.atomicRadius / maxRadius) * 44).toFixed(2)) : 28;
          const isInspecting = inspectedElement?.slug === el.slug;

          return (
            <div
              key={el.slug}
              className={`rounded-xl bg-[#0e121a] border p-3.5 flex flex-col items-center text-center gap-2 transition-colors motion-reduce:transition-none ${
                isInspecting ? "border-[#4f9dff] ring-1 ring-[#4f9dff]" : "border-[#242c38]"
              }`}
            >
              <svg
                viewBox="0 0 108 108"
                className="w-24 h-24 shrink-0"
                role="img"
                aria-label={
                  hasRadius
                    ? `Relative covalent radius diagram of ${el.name}: radius ${el.atomicRadius} picometers`
                    : `Covalent radius not established in this dataset for ${el.name}`
                }
              >
                {hasRadius ? (
                  <>
                    <circle
                      cx="54"
                      cy="54"
                      r={outerR}
                      data-scaled-radius={outerR}
                      fill={accent}
                      fillOpacity="0.18"
                      stroke={accent}
                      strokeWidth="2"
                    />
                  </>
                ) : (
                  <>
                    <circle
                      cx="54"
                      cy="54"
                      r="28"
                      fill="none"
                      stroke="#7a8694"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <text x="54" y="58" textAnchor="middle" fill="#8b98a9" fontSize="12" fontFamily="monospace">
                      ?
                    </text>
                  </>
                )}
              </svg>

              <div className="space-y-0.5 min-w-0 w-full">
                <div className="font-bold text-sm text-white">
                  {el.name} ({el.symbol}) <span className="text-xs font-mono text-[#8b98a9]">Z={el.number}</span>
                </div>
                <div className="text-xs font-mono text-[#7bb6ff]">
                  {el.atomicRadius !== null ? `${el.atomicRadius} pm` : "Radius not established"} · {el.shells.length}{" "}
                  {el.shells.length === 1 ? "shell" : "shells"} ({el.shells.join("·")})
                </div>
                <div className="text-[11px] font-mono text-[#8b98a9] truncate">{el.electronConfig}</div>
              </div>

              <button
                id={`compare-inspect-${el.slug}`}
                type="button"
                aria-expanded={isInspecting}
                aria-pressed={isInspecting}
                onClick={() => setInspectedSlug((prev) => (prev === el.slug ? null : el.slug))}
                className={`min-h-[44px] w-full mt-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors motion-reduce:transition-none ${
                  isInspecting
                    ? "bg-[#4f9dff] text-[#07121f] border-[#4f9dff]"
                    : "bg-[#161c26] text-[#aeb8c4] border-[#2a323d] hover:border-[#4f9dff] hover:text-white"
                }`}
              >
                {isInspecting ? `Hide ${el.symbol} Shells & Orbitals` : `Inspect ${el.symbol} Shells & Orbitals`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Inline AtomVisualizer Reuse for Side-by-Side Shell/Subshell Inspection */}
      {inspectedElement && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-mono text-[#7bb6ff]">
              Inspecting {inspectedElement.name} ({inspectedElement.symbol}) — toggle Bohr shells or Hund&apos;s rule
              orbital boxes below:
            </span>
            <button
              type="button"
              onClick={() => {
                setInspectedSlug(null);
                document.getElementById(`compare-inspect-${inspectedElement.slug}`)?.focus();
              }}
              aria-label={`Close ${inspectedElement.name} shell inspector`}
              className="min-h-[38px] px-2.5 py-1 rounded-lg bg-[#161c26] border border-[#2a323d] text-xs text-[#aeb8c4] hover:text-white inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
          <AtomVisualizer key={inspectedElement.slug} element={inspectedElement} compact={true} />
        </div>
      )}

      {/* Side-by-Side Quantitative Metric Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TREND_METRICS.map((metric) => {
          const finiteVals = elements
            .map((e) => e[metric.key])
            .filter((v) => v !== null && Number.isFinite(v));
          const maxMetric = finiteVals.length > 0 ? Math.max(...finiteVals) : 0;
          const maxCount = finiteVals.filter((v) => v === maxMetric).length;

          return (
            <div
              key={metric.key}
              className="rounded-lg bg-[#0e121a] border border-[#242c38] p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-white">{metric.label}</span>
                {metric.unit && <span className="text-[10px] font-mono text-[#7a8694]">{metric.unit}</span>}
              </div>
              <div className="space-y-1.5">
                {elements.map((el) => {
                  const val = el[metric.key];
                  const hasVal = val !== null && Number.isFinite(val);
                  const pct = hasVal && maxMetric > 0 ? (val / maxMetric) * 100 : 0;
                  const isUniqueMax = hasVal && finiteVals.length >= 2 && val === maxMetric && maxCount === 1;
                  const color = CATEGORY_META[el.category]?.hex || "#4f9dff";

                  return (
                    <div key={el.slug} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className={isUniqueMax ? "text-white font-bold" : "text-[#aeb8c4]"}>{el.symbol}</span>
                        <span className={isUniqueMax ? "text-[#7bb6ff] font-bold" : "text-[#8b98a9]"}>
                          {hasVal ? `${val}${metric.unit ? ` ${metric.unit}` : ""}` : "Not established"}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#161c26] overflow-hidden">
                        {hasVal && (
                          <div
                            style={{ width: `${pct}%`, backgroundColor: color }}
                            className="h-full rounded-full transition-all motion-reduce:transition-none"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mechanistic Periodic Trend Takeaway */}
      {insight && (
        <div
          className="rounded-lg bg-[#0e121a] border border-[#242c38] border-l-[3px] border-l-[#4f9dff] p-3.5 space-y-1"
          data-testid="periodic-trend-insight"
        >
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#ffa94d] shrink-0" />
            <span>{insight.headline}</span>
          </div>
          <p className="text-xs text-[#aeb8c4] leading-relaxed">{insight.body}</p>
          <a href="https://openstax.org/books/chemistry-2e/pages/6-5-periodic-variations-in-element-properties"
            target="_blank" rel="noopener noreferrer" className="text-xs text-[#7bb6ff] hover:underline inline-block">
            Read the periodic-trend explanation (OpenStax)
          </a>
        </div>
      )}
    </section>
  );
}
