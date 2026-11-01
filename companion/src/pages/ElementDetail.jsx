import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AtomVisualizer from "@/components/AtomVisualizer";
import TrendExplorerCard from "@/components/TrendExplorerCard";
import {
  getElementBySlug,
  CATEGORY_META,
  categoryLabel,
  formatMass,
  getRadioactiveBadgeLabel,
  buildArticle,
  adjacentElements,
  buildElementShareUrl,
} from "@/data/elementsData";
import { useStudyProgress } from "@/lib/studyStore";
import {
  Share2,
  BookmarkCheck,
  ArrowLeftRight,
  BrainCircuit,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Save,
} from "lucide-react";

export default function ElementDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const element = getElementBySlug(slug);
  const { savedSlugs, masteryMap, notesMap, toggleSavedSlug, saveElementNote, toggleMasteredManual } =
    useStudyProgress();

  const [noteInput, setNoteInput] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (element) {
      setNoteInput(notesMap[element.slug] || "");
      document.title = `${element.name} (${element.symbol}) — Elementa`;
    } else {
      document.title = "Element not found — Elementa";
      const meta = document.createElement("meta");
      meta.name = "prerender-status-code";
      meta.content = "404";
      document.head.appendChild(meta);
      return () => {
        document.head.removeChild(meta);
      };
    }
  }, [element, notesMap]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  if (!element) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#ff6b6b] flex items-center justify-center mx-auto text-2xl font-mono font-bold text-[#ff6b6b]">
            404
          </div>
          <h1 className="text-3xl font-extrabold text-white">404 — Off the table</h1>
          <p className="text-sm text-[#aeb8c4]">
            No element matches <code className="font-mono text-white">“{slug}”</code>. Maybe it hasn&apos;t been
            synthesized yet.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-[#4f9dff] text-[#07121f] font-semibold text-xs sm:text-sm no-underline"
            >
              ← Back to the periodic table
            </Link>
            <Link
              to="/elements"
              className="px-4 py-2 rounded-lg bg-[#1c232d] border border-[#2a323d] text-white text-xs sm:text-sm no-underline hover:border-[#4f9dff]"
            >
              Browse all 118 elements
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const article = buildArticle(element);
  const accent = CATEGORY_META[element.category]?.hex || "#4f9dff";
  const { prev, next } = adjacentElements(element.number);
  const compareIds = [prev, element, next]
    .filter(Boolean)
    .map((e) => e.slug)
    .join(",");

  const isSaved = savedSlugs.includes(element.slug);
  const isMastered = Boolean(masteryMap[element.slug]?.mastered);

  const shareUrl = buildElementShareUrl(element);

  const handleShare = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast(`Copied ${shareUrl}`);
      } else {
        showToast(`Share URL: ${shareUrl}`);
      }
    } catch {
      showToast(`Share URL: ${shareUrl}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#8b98a9] flex flex-wrap items-center gap-1">
          <Link to="/" className="min-h-[36px] px-1.5 inline-flex items-center hover:text-white">
            Home
          </Link>
          <span aria-hidden="true">›</span>
          <Link to="/elements" className="min-h-[36px] px-1.5 inline-flex items-center hover:text-white">
            Elements
          </Link>
          <span aria-hidden="true">›</span>
          <span className="min-h-[36px] px-1.5 inline-flex items-center text-white font-medium" aria-current="page">
            {element.name}
          </span>
        </nav>

        {/* Element Hero Tile + Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#131822] border border-[#242c38] rounded-2xl p-4 sm:p-5">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-5 min-w-0">
            <div
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl bg-[#1c232d] border border-[#2a323d] border-l-[6px] flex flex-col items-center justify-center shrink-0 shadow-md"
              style={{ borderLeftColor: accent }}
            >
              <span className="text-[11px] sm:text-xs font-mono text-[#8b98a9]">{element.number}</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-white leading-none my-1">{element.symbol}</span>
              <span className="text-[11px] sm:text-xs font-mono text-[#aeb8c4]">{formatMass(element)}</span>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                  style={{
                    color: accent,
                    borderColor: `${accent}55`,
                    backgroundColor: `${accent}18`,
                  }}
                >
                  {categoryLabel(element.category)}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1c232d] text-[#aeb8c4] border border-[#2a323d] uppercase">
                  {element.phase} at STP
                </span>
                {element.radioactive && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#da77f2]/15 text-[#e599f7] border border-[#da77f2]/30">
                    {getRadioactiveBadgeLabel(element)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight break-words">
                {element.name}
              </h1>
              <p className="text-xs sm:text-sm text-[#aeb8c4] font-mono break-words">
                Group {element.group ?? "— (f-block)"} · Period {element.period} · {element.block}-block · Config:{" "}
                <strong className="text-white">{element.electronConfig}</strong>
              </p>
            </div>
          </div>

          {/* Mastery & Study Deck Actions */}
          <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              aria-pressed={isSaved}
              aria-label={isSaved ? `Remove ${element.name} from Study Deck` : `Add ${element.name} to Study Deck`}
              onClick={() => {
                const added = toggleSavedSlug(element.slug);
                showToast(added ? `Added ${element.name} to Study Deck` : `Removed ${element.name} from Study Deck`);
              }}
              className={`min-h-[44px] px-3.5 py-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                isSaved
                  ? "bg-[#4f9dff]/20 border-[#4f9dff] text-[#7bb6ff]"
                  : "bg-[#1c232d] border-[#2a323d] text-white hover:border-[#4f9dff]"
              }`}
            >
              <BookmarkCheck className="w-4 h-4 shrink-0" />
              <span>{isSaved ? "In Study Deck" : "Add to Study Deck"}</span>
            </button>
            <button
              type="button"
              aria-pressed={isMastered}
              aria-label={isMastered ? `Mark ${element.name} as still learning` : `Mark ${element.name} as mastered`}
              onClick={() => {
                toggleMasteredManual(element.slug);
                showToast(isMastered ? `Marked ${element.name} as learning` : `Marked ${element.name} as mastered!`);
              }}
              className={`min-h-[44px] px-3.5 py-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                isMastered
                  ? "bg-[#69db7c]/20 border-[#69db7c] text-[#69db7c]"
                  : "bg-[#1c232d] border-[#2a323d] text-[#aeb8c4] hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{isMastered ? "Mastered ✓" : "Mark Mastered"}</span>
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2">
          <button
            type="button"
            data-share-url={shareUrl}
            aria-label={`Copy shareable link for ${element.name}`}
            onClick={handleShare}
            className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#161b22] border border-[#2a323d] hover:border-[#4f9dff] text-xs font-medium text-white flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            <span>Share</span>
          </button>
          <Link
            to={`/compare?ids=${compareIds}`}
            aria-label={`Compare ${element.name} with neighbouring elements`}
            className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#161b22] border border-[#2a323d] hover:border-[#4f9dff] text-xs font-medium text-[#7bb6ff] flex items-center justify-center gap-1.5 no-underline"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Compare ({compareIds.split(",").join(" vs ")})</span>
          </Link>
          <Link
            to={`/practice?element=${element.slug}`}
            aria-label={`Start practice quiz focused on ${element.name}`}
            className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#161b22] border border-[#2a323d] hover:border-[#69db7c] text-xs font-medium text-[#69db7c] flex items-center justify-center gap-1.5 no-underline"
          >
            <BrainCircuit className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Quiz on {element.name}</span>
          </Link>
          <Link
            to="/"
            className="min-h-[44px] sm:ml-auto px-3.5 py-2.5 rounded-lg bg-[#161b22] border border-[#2a323d] hover:border-white text-xs font-medium text-[#aeb8c4] hover:text-white flex items-center justify-center no-underline"
          >
            ← Back to table
          </Link>
        </div>

        {/* Interactive Bohr Shell & Subshell Visualizer */}
        <AtomVisualizer element={element} />

        {/* Article & Facts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Article Column */}
          <div className="lg:col-span-7 space-y-5 bg-[#131822] border border-[#242c38] rounded-xl p-5">
            <div className="article space-y-4">
              <p className="summary text-base sm:text-lg text-white font-serif leading-relaxed border-l-4 border-[#4f9dff] pl-3.5">
                {article.summary}
              </p>

              {article.sections.map((section) => (
                <section key={section.heading} className="space-y-1.5 pt-2">
                  <h2 className="text-base font-bold text-white">{section.heading}</h2>
                  <p className="text-sm text-[#aeb8c4] font-serif leading-relaxed">{section.body}</p>
                </section>
              ))}
            </div>

            {/* Personal Study Notes */}
            <div className="pt-4 border-t border-[#242c38] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="element-note" className="text-xs font-bold uppercase tracking-wider text-[#7bb6ff] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> My Personal Study Note for {element.name}
                </label>
                <span className="text-[11px] font-mono text-[#7a8694]">{noteInput.length}/500</span>
              </div>
              <textarea
                id="element-note"
                rows={2}
                maxLength={500}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={`Write a mnemonic, oxidation state note, or lab observation for ${element.name}…`}
                className="w-full rounded-lg bg-[#0e121a] border border-[#2a323d] p-2.5 text-xs sm:text-sm text-white placeholder-[#7a8694] focus:outline-none focus:border-[#4f9dff]"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    saveElementNote(element.slug, noteInput);
                    showToast(`Saved study note for ${element.name}`);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-[#4f9dff] text-[#07121f] font-semibold text-xs flex items-center gap-1.5 hover:bg-[#7bb6ff]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Note</span>
                </button>
              </div>
            </div>
          </div>

          {/* Key Properties Table & Citations Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#131822] border border-[#242c38] rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-[#161c27] border-b border-[#242c38]">
                <h2 className="text-sm font-bold text-white">Key Properties ({element.symbol})</h2>
              </div>
              <table className="w-full text-xs facts">
                <tbody className="divide-y divide-[#242c38]">
                  {article.facts.map((fact) => (
                    <tr key={fact.label}>
                      <th scope="row" className="py-2.5 px-4 text-left font-medium text-[#8b98a9] w-5/12">
                        {fact.label}
                      </th>
                      <td className="py-2.5 px-4 font-mono text-white">{fact.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reference Sources */}
            <div className="bg-[#131822] border border-[#242c38] rounded-xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b98a9]">
                Reference Sources
              </h3>
              <div className="space-y-2">
                {article.citations.map((cit) => (
                  <a
                    key={cit.source}
                    href={cit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] p-3 rounded-lg bg-[#0e121a] border border-[#242c38] hover:border-[#4f9dff] flex items-start justify-between gap-2 text-xs no-underline group"
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
        </div>

        {/* Periodic Trend Comparison Card */}
        <TrendExplorerCard
          element={element}
          onSelectElement={(nextSlug) => navigate(`/element/${nextSlug}`)}
        />

        {/* Prev / Next Navigation */}
        <nav
          aria-label="Element navigation"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#242c38]"
        >
          {prev ? (
            <Link
              to={`/element/${prev.slug}`}
              aria-label={`Previous element: ${prev.name} (${prev.symbol}), atomic number ${prev.number}`}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#131822] border border-[#242c38] hover:border-[#4f9dff] text-xs sm:text-sm font-medium text-white flex items-center gap-2 no-underline"
            >
              <ArrowLeft className="w-4 h-4 text-[#7bb6ff] shrink-0" />
              <span className="truncate">
                #{prev.number} {prev.name} ({prev.symbol})
              </span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {next ? (
            <Link
              to={`/element/${next.slug}`}
              aria-label={`Next element: ${next.name} (${next.symbol}), atomic number ${next.number}`}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#131822] border border-[#242c38] hover:border-[#4f9dff] text-xs sm:text-sm font-medium text-white flex items-center justify-end gap-2 no-underline"
            >
              <span className="truncate">
                #{next.number} {next.name} ({next.symbol})
              </span>
              <ArrowRight className="w-4 h-4 text-[#7bb6ff] shrink-0" />
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
        </nav>
      </main>

      <Footer />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[#1c232d] border border-[#4f9dff] text-xs font-medium text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}