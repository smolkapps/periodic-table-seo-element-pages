import React, { useState } from "react";
import { CATEGORY_META, AUFBAU_NOTES, getShellRoleLabel, isValenceSubshell } from "@/data/elementsData";
import { Atom, Info } from "lucide-react";

const SHELL_LABELS = ["K (n=1)", "L (n=2)", "M (n=3)", "N (n=4)", "O (n=5)", "P (n=6)", "Q (n=7)"];
const SHELL_MAX = [2, 8, 18, 32, 32, 18, 8];

export default function AtomVisualizer({ element, compact = false, initialViewMode = "bohr" }) {
  const [viewMode, setViewMode] = useState(initialViewMode); // 'bohr' | 'subshells'
  const [selectedShell, setSelectedShell] = useState(null);
  const [hoveredShell, setHoveredShell] = useState(null);
  const accent = CATEGORY_META[element.category]?.hex || "#4f9dff";

  const activeSelectedShell =
    selectedShell !== null && selectedShell < element.shells.length ? selectedShell : null;
  const activeHoveredShell =
    hoveredShell !== null && hoveredShell < element.shells.length ? hoveredShell : null;
  const highlightedShell = activeHoveredShell !== null ? activeHoveredShell : activeSelectedShell;

  return (
    <div className="rounded-xl bg-[#0e121a] border border-[#242c38] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Atom className="w-4 h-4 text-[#4f9dff]" />
          <h3 className="text-xs sm:text-sm font-bold text-white">
            Electron Shells &amp; Subshells
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c232d] text-[#aeb8c4] border border-[#2a323d]">
            Simplified Model
          </span>
        </div>

        <div
          role="group"
          aria-label="Atomic model view mode"
          className="flex items-center gap-1 bg-[#161c26] p-1 rounded-lg border border-[#242c38] w-full sm:w-auto"
        >
          <button
            type="button"
            aria-pressed={viewMode === "bohr"}
            onClick={() => setViewMode("bohr")}
            className={`flex-1 sm:flex-initial min-h-[40px] sm:min-h-[36px] px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === "bohr" ? "bg-[#4f9dff] text-[#07121f] font-semibold" : "text-[#aeb8c4] hover:text-white"
            }`}
          >
            Bohr Shells (n)
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "subshells"}
            onClick={() => setViewMode("subshells")}
            className={`flex-1 sm:flex-initial min-h-[40px] sm:min-h-[36px] px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === "subshells" ? "bg-[#4f9dff] text-[#07121f] font-semibold" : "text-[#aeb8c4] hover:text-white"
            }`}
          >
            Subshell Orbitals (s/p/d/f)
          </button>
        </div>
      </div>

      {viewMode === "bohr" ? (
        <div className={`flex flex-col ${compact ? "sm:flex-row" : "md:flex-row"} items-center gap-5`}>
          {/* Concentric SVG Diagram */}
          <div className="relative shrink-0">
            <svg
              viewBox="0 0 240 240"
              className={compact ? "w-44 h-44" : "w-56 h-56"}
              role="img"
              aria-label={`Simplified concentric Bohr shell diagram of ${element.name} showing ${element.shells.join(", ")} electrons per shell`}
            >
              {/* Nucleus */}
              <circle
                cx="120"
                cy="120"
                r="18"
                fill={accent}
                fillOpacity="0.22"
                stroke={accent}
                strokeWidth="2"
              />
              <text x="120" y="118" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">
                {element.symbol}
              </text>
              <text x="120" y="129" textAnchor="middle" fill="#aeb8c4" fontSize="8" fontFamily="monospace">
                Z={element.number}
              </text>

              {element.shells.map((count, sIdx) => {
                const radius = 32 + sIdx * 12;
                const isOuter = sIdx === element.shells.length - 1;
                const isHighlighted = highlightedShell === sIdx;
                const dots = [];
                for (let k = 0; k < count; k++) {
                  const angle = (2 * Math.PI * k) / count - Math.PI / 2;
                  const cx = 120 + radius * Math.cos(angle);
                  const cy = 120 + radius * Math.sin(angle);
                  dots.push(
                    <circle
                      key={k}
                      cx={cx}
                      cy={cy}
                      r={isHighlighted ? 3.5 : isOuter ? 3.0 : 2.2}
                      fill={isOuter ? accent : "#7bb6ff"}
                    />
                  );
                }
                return (
                  <g
                    key={sIdx}
                    onClick={() => setSelectedShell((prev) => (prev === sIdx ? null : sIdx))}
                    onMouseEnter={() => setHoveredShell(sIdx)}
                    onMouseLeave={() => setHoveredShell(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx="120"
                      cy="120"
                      r={radius}
                      fill="none"
                      stroke={isHighlighted ? "#ffffff" : isOuter ? accent : "#2a3546"}
                      strokeWidth={isHighlighted ? "2" : isOuter ? "1.5" : "1"}
                      strokeDasharray={isOuter ? "none" : "2 2"}
                    />
                    {dots}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Shell breakdown & explanation */}
          <div className="flex-1 space-y-3 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#141a24] p-2.5 rounded-lg border border-[#242c38]">
              <div>
                <span className="text-[11px] text-[#8b98a9] block">Ground-State Electron Configuration</span>
                <code className="font-mono text-sm sm:text-base font-bold text-white">{element.electronConfig}</code>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#8b98a9] block">Outer-Shell (n={element.shells.length})</span>
                <span className="font-mono text-sm font-bold" style={{ color: accent }}>
                  {element.outerShellElectrons} e⁻ ({element.block}-block)
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[#aeb8c4] block">
                Principal Quantum Shells (tap or hover a shell to highlight its ring):
              </span>
              <div className={`grid gap-1.5 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
                {element.shells.map((count, idx) => {
                  const isOuter = idx === element.shells.length - 1;
                  const isSelected = activeSelectedShell === idx;
                  const isHighlighted = highlightedShell === idx;
                  const roleLabel = getShellRoleLabel(element, idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Shell ${SHELL_LABELS[idx]}, ${roleLabel}: ${count} of ${SHELL_MAX[idx]} electrons`}
                      onClick={() => setSelectedShell((prev) => (prev === idx ? null : idx))}
                      onMouseEnter={() => setHoveredShell(idx)}
                      onMouseLeave={() => setHoveredShell(null)}
                      className={`min-h-[48px] p-2.5 rounded-lg border text-xs text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#222c3c] border-white ring-1 ring-white text-white"
                          : isHighlighted
                          ? "bg-[#1e2736] border-[#7bb6ff] text-white"
                          : isOuter
                          ? "bg-[#1a2232] border-[#4f9dff] text-white"
                          : "bg-[#141a24] border-[#242c38] text-[#aeb8c4]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-[#8b98a9]">
                        <span>{SHELL_LABELS[idx]}</span>
                        <span>{roleLabel}</span>
                      </div>
                      <div className="font-mono font-bold text-sm mt-0.5">
                        {count} <span className="text-[10px] font-normal text-[#7a8694]">/ {SHELL_MAX[idx]} e⁻</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {AUFBAU_NOTES[element.symbol] && (
              <div className="p-2.5 rounded-lg bg-[#ffd43b]/10 border border-[#ffd43b]/30 text-xs text-[#ffd43b]">
                <strong>Quantum Subshell Note:</strong> {AUFBAU_NOTES[element.symbol]}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Subshell Orbital Box Diagram (Hund's Rule view) */
        <div className="space-y-3">
          <p className="text-xs text-[#aeb8c4]">
            Each box represents one spatial orbital (max 2 electrons with opposite spins ↑↓ by the Pauli exclusion
            principle; degenerate orbitals fill singly ↑ first by Hund&apos;s rule):
          </p>
          <div className="flex flex-wrap gap-2.5">
            {element.subshells.map((sub) => {
              const boxCount = sub.l === "s" ? 1 : sub.l === "p" ? 3 : sub.l === "d" ? 5 : 7;
              const boxes = Array.from({ length: boxCount }, (_, bIdx) => {
                // Hund's rule: first boxCount electrons go spin-up (1 per box), remaining go spin-down
                const hasUp = sub.count > bIdx;
                const hasDown = sub.count > boxCount + bIdx;
                return { hasUp, hasDown };
              });
              const isValenceSub = isValenceSubshell(element, sub);

              return (
                <div
                  key={sub.label}
                  className={`p-2.5 rounded-lg border ${
                    isValenceSub ? "bg-[#1a2333] border-[#4f9dff]" : "bg-[#141a24] border-[#242c38]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-white">
                      {sub.label}
                      <sup>{sub.count}</sup>
                    </span>
                    <span className="text-[10px] font-mono text-[#7a8694]">
                      {sub.count}/{sub.maxCapacity}e⁻
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {boxes.map((bx, i) => (
                      <div
                        key={i}
                        className="w-6 h-7 rounded bg-[#0b0e14] border border-[#2a323d] flex items-center justify-center font-mono text-xs text-[#7bb6ff]"
                      >
                        {bx.hasUp && bx.hasDown ? "↑↓" : bx.hasUp ? "↑" : "·"}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 pt-2 border-t border-[#1e2634] text-[11px] text-[#7a8694]">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#4f9dff]" />
        <span>
          <strong>Scientific Model Note:</strong> Concentric Bohr shells and orbital boxes are simplified 2D teaching
          representations of principal quantum shells (<em>n</em>) and subshells (<em>s, p, d, f</em>). In quantum
          mechanics, electrons occupy 3D probability wavefunctions (<em>ψ²</em>) rather than fixed planar tracks.
        </span>
      </div>
    </div>
  );
}