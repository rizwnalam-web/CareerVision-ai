import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, ShieldAlert, AlertTriangle, ChevronDown, ChevronUp, Download, Play, X } from "lucide-react";
import { cn } from "../lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type Severity = "fail" | "warn" | "pass";
type WcagLevel = "A" | "AA";

interface AuditResult {
  id: string;
  severity: Severity;
  level: WcagLevel;
  rule: string;
  description: string;
  elements: string[];
  count: number;
}

// ── DOM audit rules ───────────────────────────────────────────────────────────
function runAudit(): AuditResult[] {
  const results: AuditResult[] = [];
  const doc = document;

  // 1. Images missing alt
  const imgsMissingAlt = Array.from(doc.querySelectorAll<HTMLImageElement>("img:not([alt])"))
    .map((el) => el.src || el.className || "img");
  results.push({
    id: "img-alt",
    severity: imgsMissingAlt.length > 0 ? "fail" : "pass",
    level: "A",
    rule: "Images must have alt text",
    description: "All <img> elements must have an alt attribute (can be empty for decorative images).",
    elements: imgsMissingAlt.slice(0, 5),
    count: imgsMissingAlt.length,
  });

  // 2. Buttons without accessible name
  const unnamedButtons = Array.from(doc.querySelectorAll<HTMLButtonElement>("button"))
    .filter((btn) => !btn.textContent?.trim() && !btn.getAttribute("aria-label") && !btn.getAttribute("aria-labelledby") && !btn.title)
    .map((btn) => btn.className.split(" ")[0] || "button");
  results.push({
    id: "button-name",
    severity: unnamedButtons.length > 0 ? "fail" : "pass",
    level: "A",
    rule: "Buttons must have accessible names",
    description: "Every <button> needs visible text, aria-label, or aria-labelledby.",
    elements: unnamedButtons.slice(0, 5),
    count: unnamedButtons.length,
  });

  // 3. Links without accessible name
  const unnamedLinks = Array.from(doc.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .filter((a) => !a.textContent?.trim() && !a.getAttribute("aria-label") && !a.getAttribute("aria-labelledby"))
    .map((a) => a.href || a.className.split(" ")[0] || "a");
  results.push({
    id: "link-name",
    severity: unnamedLinks.length > 0 ? "fail" : "pass",
    level: "A",
    rule: "Links must have accessible names",
    description: "Every <a> needs visible text or aria-label.",
    elements: unnamedLinks.slice(0, 5),
    count: unnamedLinks.length,
  });

  // 4. Inputs without labels
  const unnamedInputs = Array.from(doc.querySelectorAll<HTMLInputElement>("input:not([type='hidden']):not([type='submit']):not([type='button'])"))
    .filter((input) => {
      const id = input.id;
      const hasLabel = id && doc.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute("aria-label") || input.getAttribute("aria-labelledby");
      return !hasLabel && !hasAriaLabel;
    })
    .map((input) => input.id || input.name || input.type || "input");
  results.push({
    id: "input-label",
    severity: unnamedInputs.length > 0 ? "fail" : "pass",
    level: "A",
    rule: "Form inputs must have labels",
    description: "Every input needs an associated <label>, aria-label, or aria-labelledby.",
    elements: unnamedInputs.slice(0, 5),
    count: unnamedInputs.length,
  });

  // 5. aria-hidden on focusable elements
  const ariaHiddenFocusable = Array.from(
    doc.querySelectorAll<HTMLElement>("[aria-hidden='true'] a, [aria-hidden='true'] button, [aria-hidden='true'] input, [aria-hidden='true'] [tabindex]")
  )
    .filter((el) => (el as HTMLElement & { tabIndex: number }).tabIndex >= 0)
    .map((el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ""));
  results.push({
    id: "aria-hidden-focus",
    severity: ariaHiddenFocusable.length > 0 ? "fail" : "pass",
    level: "A",
    rule: "No focusable elements inside aria-hidden",
    description: "Elements marked aria-hidden='true' must not contain focusable children.",
    elements: ariaHiddenFocusable.slice(0, 5),
    count: ariaHiddenFocusable.length,
  });

  // 6. Missing lang attribute on html
  const htmlLang = doc.documentElement.getAttribute("lang");
  results.push({
    id: "html-lang",
    severity: !htmlLang ? "fail" : "pass",
    level: "A",
    rule: "Page must have a lang attribute",
    description: "The <html> element must have a lang attribute specifying the page language.",
    elements: htmlLang ? [] : ["<html>"],
    count: htmlLang ? 0 : 1,
  });

  // 7. Heading hierarchy — check for h1→h3 skips (warn, not fail)
  const headings = Array.from(doc.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4, h5, h6"));
  const headingSkips: string[] = [];
  let prevLevel = 0;
  for (const h of headings) {
    const level = parseInt(h.tagName[1]);
    if (prevLevel > 0 && level > prevLevel + 1) {
      headingSkips.push(`${h.tagName}: "${h.textContent?.trim().slice(0, 40)}"`);
    }
    prevLevel = level;
  }
  results.push({
    id: "heading-order",
    severity: headingSkips.length > 0 ? "warn" : "pass",
    level: "AA",
    rule: "Heading levels should not skip ranks",
    description: "Heading levels should increase by one (h1 → h2 → h3) without skipping.",
    elements: headingSkips.slice(0, 5),
    count: headingSkips.length,
  });

  // 8. Landmark regions
  const hasMain = !!doc.querySelector("main");
  const hasNav = !!doc.querySelector("nav");
  results.push({
    id: "landmark-main",
    severity: hasMain ? "pass" : "warn",
    level: "AA",
    rule: "Page should have a <main> landmark",
    description: "A <main> element helps screen reader users navigate to primary content.",
    elements: hasMain ? [] : ["missing <main>"],
    count: hasMain ? 0 : 1,
  });
  results.push({
    id: "landmark-nav",
    severity: hasNav ? "pass" : "warn",
    level: "AA",
    rule: "Page should have a <nav> landmark",
    description: "A <nav> element with aria-label helps users navigate the site.",
    elements: hasNav ? [] : ["missing <nav>"],
    count: hasNav ? 0 : 1,
  });

  // 9. Dialogs with role="dialog" should have aria-labelledby
  const unnamedDialogs = Array.from(doc.querySelectorAll<HTMLElement>("[role='dialog']"))
    .filter((d) => !d.getAttribute("aria-labelledby") && !d.getAttribute("aria-label"))
    .map((d) => d.className.split(" ")[0] || "dialog");
  results.push({
    id: "dialog-label",
    severity: unnamedDialogs.length > 0 ? "fail" : "pass",
    level: "AA",
    rule: "Dialogs must have accessible names",
    description: "Every role='dialog' should have aria-labelledby pointing to its title.",
    elements: unnamedDialogs.slice(0, 5),
    count: unnamedDialogs.length,
  });

  return results;
}

// ── Severity icons & colors ───────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<Severity, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  fail: { icon: ShieldAlert,  color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",    label: "Fail"  },
  warn: { icon: AlertTriangle, color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20", label: "Warn"  },
  pass: { icon: ShieldCheck,  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Pass" },
};

// ── Result row ────────────────────────────────────────────────────────────────
function ResultRow({ result }: { result: AuditResult }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[result.severity];
  const Icon = cfg.icon;

  if (result.severity === "pass") {
    return (
      <div className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg border", cfg.bg)}>
        <Icon size={14} className={cn(cfg.color, "shrink-0")} aria-hidden="true" />
        <span className="text-xs text-slate-300 flex-1">{result.rule}</span>
        <span className={cn("text-[10px] font-black uppercase", cfg.color)}>{cfg.label}</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border overflow-hidden", cfg.bg)}>
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <Icon size={14} className={cn(cfg.color, "shrink-0")} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white font-medium truncate">{result.rule}</p>
          <p className="text-[10px] text-slate-400">{result.count} occurrence{result.count !== 1 ? "s" : ""} · WCAG {result.level}</p>
        </div>
        <span className={cn("text-[10px] font-black uppercase shrink-0", cfg.color)}>{cfg.label}</span>
        {expanded ? <ChevronUp size={12} className="text-slate-500 shrink-0" aria-hidden="true" /> : <ChevronDown size={12} className="text-slate-500 shrink-0" aria-hidden="true" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5">
          <p className="text-[11px] text-slate-400 leading-relaxed">{result.description}</p>
          {result.elements.length > 0 && (
            <div className="space-y-1">
              {result.elements.map((el, i) => (
                <code key={i} className="block text-[10px] font-mono bg-black/30 text-slate-300 px-2 py-1 rounded truncate">
                  {el}
                </code>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

export default function AccessibilityChecker({ onClose }: Props) {
  const { t } = useTranslation();
  const [results, setResults] = useState<AuditResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runAuditNow = useCallback(() => {
    setRunning(true);
    // Defer to next frame so the "running" state renders first
    requestAnimationFrame(() => {
      setTimeout(() => {
        const r = runAudit();
        setResults(r);
        setLastRun(new Date());
        setRunning(false);
      }, 300);
    });
  }, []);

  const exportResults = useCallback(() => {
    if (!results) return;
    const data = JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `a11y-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const fails  = results?.filter((r) => r.severity === "fail").length ?? 0;
  const warns  = results?.filter((r) => r.severity === "warn").length ?? 0;
  const passes = results?.filter((r) => r.severity === "pass").length ?? 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-checker-title"
      className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-[9999] bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-indigo-400" aria-hidden="true" />
          <div>
            <h2 id="a11y-checker-title" className="text-sm font-black text-white">{t("a11y.checkerTitle")}</h2>
            <p className="text-[10px] text-slate-500">{t("a11y.checkerDescription")}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Summary bar */}
      {results && (
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 border-b border-slate-800 shrink-0" aria-live="polite">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={13} className="text-red-400" aria-hidden="true" />
            <span className="text-xs font-black text-red-400">{fails} {t("a11y.failed")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-400" aria-hidden="true" />
            <span className="text-xs font-black text-amber-400">{warns} {t("a11y.warnings")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" aria-hidden="true" />
            <span className="text-xs font-black text-emerald-400">{passes} {t("a11y.passed")}</span>
          </div>
          {lastRun && (
            <span className="ml-auto text-[9px] text-slate-600">
              {t("a11y.lastAudit")}: {lastRun.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* Results list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {!results && !running && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <ShieldCheck size={40} className="text-slate-700" aria-hidden="true" />
            <p className="text-slate-400 text-sm">Press <strong className="text-white">Run Audit</strong> to scan the current page for WCAG A/AA issues.</p>
          </div>
        )}
        {running && (
          <div className="flex flex-col items-center justify-center h-full gap-3" role="status" aria-live="polite">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            <p className="text-slate-400 text-sm">{t("a11y.auditRunning")}</p>
          </div>
        )}
        {results && !running && (
          <>
            {/* Fails first, then warns, then passes */}
            {[...results.filter((r) => r.severity === "fail"),
               ...results.filter((r) => r.severity === "warn"),
               ...results.filter((r) => r.severity === "pass")].map((r) => (
              <ResultRow key={r.id} result={r} />
            ))}
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-slate-800 flex gap-2 shrink-0">
        <button
          onClick={runAuditNow}
          disabled={running}
          aria-busy={running}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest transition-colors"
        >
          <Play size={13} aria-hidden="true" />
          {running ? t("a11y.auditRunning") : t("common.runAudit")}
        </button>
        {results && (
          <button
            onClick={exportResults}
            aria-label={t("common.exportJson")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <Download size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
