import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_META } from "@/data/elementsData";
import {
  TREND_EXPLORER_METRICS,
  getTrendMetricValue,
  getTrendExplorerPeers,
  buildTrendExplorerAnalysis,
} from "@/data/trendReasoning";
import { TrendingUp, ArrowLeftRight } from "lucide-react";

/**
 * @param {{
 *   element: any,
 *   onSelectElement?: (slug: string) => void,
 *   initialMetricKey?: string
 * }} props
 */
export default function TrendExplorerCard({
  element,
  onSelectElement,
  initialMetricKey = "electronegativity",
}) {
  const [metricKey, setMetricKey] = useState(() =>
    TREND_EXPLORER_METRICS.some((m) => m.key === initialMetricKey) ? initialMetricKey : "electronegativity"
  );
  const [axisMode, setAxisMode] = useState("period"); // 'period' | 'group'

  const activeMetric = TREND_EXPLORER_METRICS.find((m) => m.key === metricKey) || TREND_EXPLORER_METRICS[0];

  const peerElements = useMemo(() => getTrendExplorerPeers(element, axisMode).peers, [element, axisMode]);

  const maxVal = useMemo(() => {
    const vals = peerElements
      .map((e) => getTrendMetricValue(e, activeMetric.key))
      .filter((v) => v !== null && Number.isFinite(v));
    return vals.length > 0 ? Math.max(.../** @type {number[]} */ (vals)) : 0;
  }, [peerElements, activeMetric.key]);

  const analysis = useMemo(
    () => buildTrendExplorerAnalysis(element, activeMetric.key, axisMode),
    [element, activeMetric.key, axisMode]
  );

  return (
    <div className="min-w-0 rounded-xl bg-[#0e121a] border border-[#242c38] p-4 space-y-3.5">
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
        {TREND_EXPLORER_METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            aria-pressed={metricKey === m.key}
            onClick={() => setMetricKey(m.key)}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors motion-reduce:transition-none ${
              metricKey === m.key
                ? "bg-[#4f9dff]/20 border-[#4f9dff] text-white"
                : "bg-[#141a24] border-[#242c38] text-[#aeb8c4] hover:text-white"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-[#8b98a9]">
        Zero-baseline scale relative to the highest known value shown; tap any bar to inspect that element with the same metric selected.
      </p>

      {/* Bar chart comparison across Period or Group */}
      <div className="pt-1 pb-1 overflow-x-auto">
        <div className="flex items-end gap-2 min-h-[130px] pt-5 px-1">
          {peerElements.map((peer) => {
            const val = getTrendMetricValue(peer, activeMetric.key);
            const hasVal = val !== null;
            const isCurrent = peer.slug === element.slug;
            const heightPct = hasVal && maxVal > 0 ? Number(((val / maxVal) * 100).toFixed(1)) : 0;
            const color = CATEGORY_META[peer.category]?.hex || "#4f9dff";
            const metricValueText = hasVal ? `${val}${activeMetric.unit ? ` ${activeMetric.unit}` : ""}` : "Not established";

            return (
              <button
                key={peer.slug}
                type="button"
                aria-label={`Inspect ${peer.name} (${peer.symbol}), ${activeMetric.label}: ${metricValueText}`}
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => onSelectElement && onSelectElement(peer.slug)}
                title={`${peer.name} (${peer.symbol}): ${metricValueText}`}
                className={`flex flex-col items-center flex-1 min-w-[44px] py-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f9dff] rounded transition-opacity motion-reduce:transition-none ${
                  isCurrent ? "opacity-100" : "opacity-80 hover:opacity-100"
                }`}
              >
                <span className={`text-[10px] font-mono mb-1 ${isCurrent ? "text-white font-bold" : "text-[#aeb8c4]"}`}>
                  {hasVal ? val : "n/a"}
                </span>
                <div
                  className={`w-full h-24 bg-[#141a24] rounded-t flex items-end justify-center p-0.5 border ${
                    isCurrent ? "border-[#4f9dff]" : "border-[#242c38]"
                  }`}
                >
                  {hasVal ? (
                    <div
                      data-bar-slug={peer.slug}
                      data-bar-height-pct={heightPct}
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: color,
                      }}
                      className={`w-full rounded-t transition-all motion-reduce:transition-none ${
                        isCurrent ? "ring-2 ring-white" : ""
                      }`}
                    />
                  ) : (
                    <span
                      data-bar-slug={peer.slug}
                      data-bar-height-pct={0}
                      className="text-[9px] font-mono text-[#7a8694] self-center"
                    >
                      n/a
                    </span>
                  )}
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

      {/* Selected-Element Numeric Worked Example & Reference Note */}
      <div
        data-testid="trend-worked-example"
        aria-live="polite"
        className="rounded-lg bg-[#141a24] border border-[#242c38] border-l-[3px] border-l-[#4f9dff] p-3.5 space-y-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-bold text-white">{analysis.headline}</p>
          {analysis.seriesSpanLabel && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0e121a] border border-[#242c38] text-[#7bb6ff]">
              {analysis.seriesSpanLabel}
            </span>
          )}
        </div>

        <p className="text-xs text-[#cbd5e1] leading-relaxed">{analysis.summary}</p>
        {analysis.sourceUrl && <a href={analysis.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-[#7bb6ff] underline">Explanation source: OpenStax Chemistry 2e</a>}

        <div className="pt-2 border-t border-[#1f2836] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-[#8b98a9]">
          <p className="leading-relaxed">
            <strong className="text-[#aeb8c4]">Reference note:</strong> {analysis.principle}
          </p>
          {analysis.compareSlugs.length >= 2 && (
            <Link
              to={`/compare?ids=${analysis.compareSlugs.join(",")}`}
              className="min-h-[40px] shrink-0 px-3 py-1.5 rounded-lg bg-[#0e121a] border border-[#2a323d] hover:border-[#4f9dff] text-xs font-semibold text-[#7bb6ff] inline-flex items-center justify-center gap-1.5 no-underline transition-colors motion-reduce:transition-none"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
              <span>Compare {analysis.compareLabel}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}