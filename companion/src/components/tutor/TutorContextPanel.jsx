import React from "react";
import { Link } from "react-router-dom";
import AtomVisualizer from "@/components/AtomVisualizer";
import { CATEGORY_META, categoryLabel, formatMass } from "@/data/elementsData";
import { buildModelCaveat, getAllowedCitations } from "@/lib/tutorEngine";
import { ExternalLink, ShieldAlert, ArrowLeftRight, BrainCircuit, Sparkles } from "lucide-react";

export default function TutorContextPanel({
  activeElement,
  visualizerElement,
  visualizerMode,
  compareElements = [],
  modelCaveat,
  citations = [],
  onSelectElementSlug,
}) {
  const displayEl = visualizerElement || activeElement;
  const accent = CATEGORY_META[displayEl.category]?.hex || "#4f9dff";
  const effectiveCaveat =
    displayEl.slug === activeElement.slug && modelCaveat ? modelCaveat : buildModelCaveat(displayEl);
  const effectiveCitations =
    displayEl.slug === activeElement.slug && citations.length > 0 ? citations : getAllowedCitations([displayEl]);

  return (
    <aside className="space-y-4" aria-label="Element visual model and reference facts">
      {/* Element Header & Switcher */}
      <div className="rounded-xl bg-[#131822] border border-[#242c38] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-xl bg-[#1c232d] border border-[#2a323d] border-l-4 flex flex-col items-center justify-center shrink-0"
              style={{ borderLeftColor: accent }}
            >
              <span className="text-[10px] font-mono text-[#8b98a9] leading-none">{displayEl.number}</span>
              <span className="text-xl font-extrabold text-white leading-tight">{displayEl.symbol}</span>
              <span className="text-[9px] font-mono text-[#aeb8c4] leading-none">{formatMass(displayEl)}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{
                    color: accent,
                    borderColor: `${accent}55`,
                    backgroundColor: `${accent}18`,
                  }}
                >
                  {categoryLabel(displayEl.category)}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1c232d] text-[#aeb8c4] border border-[#2a323d]">
                  Period {displayEl.period} · {displayEl.block}-block
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {displayEl.name} ({displayEl.symbol})
              </h2>
              <p className="text-xs font-mono text-[#aeb8c4]">
                Config: <strong className="text-white">{displayEl.electronConfig}</strong> · Shells:{" "}
                {displayEl.shells.join("·")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0">
            <Link
              to={`/element/${displayEl.slug}`}
              className="px-2.5 py-1 rounded-lg bg-[#1c232d] border border-[#2a323d] hover:border-[#4f9dff] text-[11px] font-medium text-[#7bb6ff] no-underline text-center"
            >
              Full Profile →
            </Link>
            <Link
              to={`/practice?element=${displayEl.slug}`}
              className="px-2.5 py-1 rounded-lg bg-[#1c232d] border border-[#2a323d] hover:border-[#69db7c] text-[11px] font-medium text-[#69db7c] no-underline flex items-center justify-center gap-1"
            >
              <BrainCircuit className="w-3 h-3" />
              <span>Quiz {displayEl.symbol}</span>
            </Link>
          </div>
        </div>

        {/* Quick element switcher when comparing or exploring Oxygen + Iron */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#242c38]">
          <span className="text-[11px] font-mono text-[#8b98a9] flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-[#4f9dff]" /> Inspect model:
          </span>
          {(compareElements.length >= 2
            ? compareElements
            : [
                activeElement,
                displayEl.slug !== activeElement.slug ? displayEl : null,
              ].filter(Boolean)
          ).map((el) => (
            <button
              key={el.slug}
              type="button"
              onClick={() => onSelectElementSlug(el.slug)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${
                displayEl.slug === el.slug
                  ? "bg-[#4f9dff]/20 border-[#4f9dff] text-white font-semibold"
                  : "bg-[#161c26] border-[#2a323d] text-[#aeb8c4] hover:text-white"
              }`}
            >
              {el.symbol} (Z={el.number})
            </button>
          ))}
          {displayEl.slug !== "oxygen" && (
            <button
              type="button"
              onClick={() => onSelectElementSlug("oxygen")}
              className="px-2 py-1 rounded-md text-[11px] font-mono bg-[#161c26] border border-[#2a323d] text-[#aeb8c4] hover:text-white"
            >
              O (2p⁴)
            </button>
          )}
          {displayEl.slug !== "iron" && (
            <button
              type="button"
              onClick={() => onSelectElementSlug("iron")}
              className="px-2 py-1 rounded-md text-[11px] font-mono bg-[#161c26] border border-[#2a323d] text-[#aeb8c4] hover:text-white"
            >
              Fe (3d⁶ 4s²)
            </button>
          )}
        </div>
      </div>

      {/* Connected Simplified Atom & Subshell Visualizer */}
      <AtomVisualizer element={displayEl} compact={true} initialViewMode={visualizerMode} />

      {/* Precision on Simplified Models & Scientific Uncertainty */}
      <div className="rounded-xl bg-[#131822] border border-[#242c38] p-4 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#ffd43b] flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Simplified Model &amp; Uncertainty Boundaries</span>
        </h3>
        <p className="text-xs text-[#aeb8c4] leading-relaxed">{effectiveCaveat}</p>
        <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-[#0e121a] border border-[#242c38]">
            <span className="text-[#7a8694] block">Electronegativity</span>
            <span className="text-white font-bold">
              {displayEl.electronegativity !== null ? `${displayEl.electronegativity} Pauling` : "Not established"}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[#0e121a] border border-[#242c38]">
            <span className="text-[#7a8694] block">1st Ionization</span>
            <span className="text-white font-bold">
              {displayEl.ionizationEnergy !== null ? `${displayEl.ionizationEnergy} kJ/mol` : "Not established"}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[#0e121a] border border-[#242c38]">
            <span className="text-[#7a8694] block">Covalent Radius</span>
            <span className="text-white font-bold">
              {displayEl.atomicRadius !== null ? `${displayEl.atomicRadius} pm` : "Not established"}
            </span>
          </div>
        </div>
      </div>

      {/* Canonical Reference Sources from Dataset */}
      <div className="rounded-xl bg-[#131822] border border-[#242c38] p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b98a9]">
            Dataset Reference Links ({displayEl.symbol})
          </h3>
          <Link
            to={`/compare?ids=${displayEl.slug},oxygen,iron`}
            className="text-[11px] text-[#7bb6ff] hover:underline flex items-center gap-1"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>Compare</span>
          </Link>
        </div>
        <div className="space-y-1.5">
          {effectiveCitations.map((cit) => (
            <a
              key={`${cit.source}-${cit.url}`}
              href={cit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-[#0e121a] border border-[#242c38] hover:border-[#4f9dff] flex items-start justify-between gap-2 text-xs no-underline group"
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
    </aside>
  );
}