import React, { useState, useMemo } from "react";
import { ELEMENTS, CATEGORY_META } from "@/data/elementsData";
import { TrendingUp } from "lucide-react";

const METRICS = [
  {
    key: "electronegativity",
    label: "Pauling Electronegativity",
    unit: "",
    why: "Increases across a period as nuclear charge (Z) rises while valence electrons enter the same principal shell (minimal shielding). Decreases down a group as outer electrons sit farther from the nucleus.",
  },
  {
    key: "ionizationEnergy",
    label: "1st Ionization Energy",
    unit: "kJ/mol",
    why: "Energy needed to remove one mole of valence electrons (NIST). Generally rises across a period (peaking at closed-shell Noble Gases) with small dips at group 13 (np¹ penetration) and group 16 (np⁴ spin-pair repulsion).",
  },
  {
    key: "atomicRadius",
    label: "Empirical Covalent Radius",
    unit: "pm",
    why: "Contracts left-to-right across a period because higher effective nuclear charge (Z_eff) pulls the electron cloud inward. Expands down a group as new principal quantum shells (n) are added.",
  },
];

export default function TrendExplorerCard({ element, onSelectElement }) {
  const [metricKey, setMetricKey] = useState("electronegativity");
  const [axisMode, setAxisMode] = useState("period"); // 'period' | 'group'

  const activeMetric = METRICS.find((m) => m.key === metricKey) || METRICS[0];

  const peerElements = useMemo(() => {
    if (axisMode === "period") {
      if (element.ypos > 7) {
        return ELEMENTS.filter((e) => e.category === element.category).sort((a, b) => a.number - b.number);
      }
      return ELEMENTS.filter((e) => e.period === element.period && e.ypos <= 7).sort((a, b) => a.number - b.number);
    }
    if (element.group !== null) {
      return ELEMENTS.filter((e) => e.group === element.group).sort((a, b) => a.period - b.period);
    }
    // f-block series compared against Period main-body peers + current element
    return ELEMENTS.filter((e) => e.period === element.period && (e.ypos <= 7 || e.slug === element.slug)).sort(
      (a, b) => a.number - b.number
    );
  }, [element, axisMode]);

  const maxVal = useMemo(() => {
    const vals = peerElements.map((e) => e[metricKey]).filter((v) => v !== null && Number.isFinite(v));
    return vals.length > 0 ? Math.max(...vals) : 1;
  }, [peerElements, metricKey]);

  return (
    <div className="rounded-xl bg-[#0e121a] border border-[#242c38] p-4 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#ffa94d]" />
          <h3 className="text-xs sm:text-sm font-bold text-white">
            Periodic Trend Comparison
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <div
            role="group"
            aria-label="Periodic comparison axis"
            className="flex items-center gap-1 bg-[#161c26] p-1 rounded-lg border border-[#242c38] w-full sm:w-auto"
          >
            <button
              type="button"
              aria-pressed={axisMode === "period"}
              onClick={() => setAxisMode("period")}
              className={`flex-1 sm:flex-initial min-h-[40px] sm:min-h-[36px] px-3 py-1.5 rounded text-xs font-medium ${
                axisMode === "period" ? "bg-[#4f9dff] text-[#07121f] font-semibold" : "text-[#aeb8c4] hover:text-white"
              }`}
            >
              {element.ypos > 7 ? `Across ${element.category}s` : `Across Period ${element.period}`}
            </button>
            <button
              type="button"
              aria-pressed={axisMode === "group"}
              onClick={() => setAxisMode("group")}
              className={`flex-1 sm:flex-initial min-h-[40px] sm:min-h-[36px] px-3 py-1.5 rounded text-xs font-medium ${
                axisMode === "group" ? "bg-[#4f9dff] text-[#07121f] font-semibold" : "text-[#aeb8c4] hover:text-white"
              }`}
            >
              {element.group !== null ? `Down Group ${element.group}` : `Period ${element.period} + ${element.symbol}`}
            </button>
          </div>
        </div>
      </div>

      {/* Metric Tabs */}
      <div role="group" aria-label="Periodic trend metric" className="flex flex-wrap gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            aria-pressed={metricKey === m.key}
            onClick={() => setMetricKey(m.key)}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              metricKey === m.key
                ? "bg-[#4f9dff]/20 border-[#4f9dff] text-white"
                : "bg-[#141a24] border-[#242c38] text-[#aeb8c4] hover:text-white"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Bar chart comparison across Period or Group */}
      <div className="pt-2 pb-1 overflow-x-auto">
        <div className="flex items-end gap-2 min-h-[130px] pt-6 px-1">
          {peerElements.map((peer) => {
            const val = peer[metricKey];
            const isCurrent = peer.slug === element.slug;
            const heightPct = val !== null ? Math.max(12, Math.round((val / maxVal) * 84)) : 8;
            const color = CATEGORY_META[peer.category]?.hex || "#4f9dff";
            const metricValueText = val !== null ? `${val}${activeMetric.unit ? ` ${activeMetric.unit}` : ""}` : "Not established";

            return (
              <button
                key={peer.slug}
                type="button"
                aria-label={`Inspect ${peer.name} (${peer.symbol}), ${activeMetric.label}: ${metricValueText}`}
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => onSelectElement && onSelectElement(peer.slug)}
                title={`${peer.name} (${peer.symbol}): ${metricValueText}`}
                className={`flex flex-col items-center flex-1 min-w-[44px] py-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f9dff] rounded ${
                  isCurrent ? "scale-105" : "opacity-80 hover:opacity-100"
                }`}
              >
                <span className="text-[10px] font-mono text-[#aeb8c4] mb-1">
                  {val !== null ? val : "—"}
                </span>
                <div className="w-full h-24 bg-[#141a24] rounded-t flex items-end p-0.5 border border-[#242c38]">
                  <div
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: val !== null ? color : "#2a323d",
                    }}
                    className={`w-full rounded-t transition-all ${
                      isCurrent ? "ring-2 ring-white" : ""
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-mono mt-1 px-1.5 py-0.5 rounded ${
                    isCurrent ? "bg-[#4f9dff] text-[#07121f] font-bold" : "text-white group-hover:text-[#7bb6ff]"
                  }`}
                >
                  {peer.symbol}
                </span>
                <span className="text-[9px] font-mono text-[#7a8694]">Z={peer.number}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-[#aeb8c4] bg-[#141a24] p-2.5 rounded-lg border border-[#242c38] leading-relaxed">
        <strong className="text-white">Physical Chemistry Principle:</strong> {activeMetric.why}
      </p>
    </div>
  );
}