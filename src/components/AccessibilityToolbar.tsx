import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Type, Globe, ShieldCheck } from "lucide-react";
import { useAccessibility, type FontSize, type SupportedLang } from "../lib/AccessibilityContext";
import { cn } from "../lib/utils";

// ── Language metadata ─────────────────────────────────────────────────────────
const LANGUAGES: { code: SupportedLang; nativeLabel: string; flag: string }[] = [
  { code: "en", nativeLabel: "EN", flag: "🇬🇧" },
  { code: "es", nativeLabel: "ES", flag: "🇪🇸" },
  { code: "fr", nativeLabel: "FR", flag: "🇫🇷" },
  { code: "ar", nativeLabel: "AR", flag: "🇸🇦" },
  { code: "zh", nativeLabel: "ZH", flag: "🇨🇳" },
];

const FONT_SIZES: { value: FontSize; label: string; sizeClass: string }[] = [
  { value: "normal", label: "A", sizeClass: "text-xs" },
  { value: "large",  label: "A", sizeClass: "text-sm" },
  { value: "xlarge", label: "A", sizeClass: "text-base" },
];

// ── Accessibility Toolbar ─────────────────────────────────────────────────────
export default function AccessibilityToolbar({
  isAdmin = false,
  onOpenChecker,
}: {
  isAdmin?: boolean;
  onOpenChecker?: () => void;
}) {
  const { t } = useTranslation();
  const { highContrast, toggleHighContrast, fontSize, setFontSize, language, setLanguage } = useAccessibility();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      role="region"
      aria-label={t("a11y.toolbarLabel")}
      className="fixed bottom-28 lg:bottom-10 right-4 z-[9998] flex flex-col items-end gap-2"
    >
      {/* Main toggle button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={t("a11y.toolbarLabel")}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all",
          expanded
            ? "bg-indigo-600 text-white shadow-indigo-300"
            : "bg-white/90 text-slate-700 hover:bg-indigo-50 border border-slate-200 shadow-slate-200"
        )}
      >
        <Eye size={18} aria-hidden="true" />
      </button>

      {/* Expanded controls panel — rendered BELOW the toggle so it grows upward via flex-col-reverse parent, or downward here */}
      {expanded && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 flex flex-col gap-3 w-52">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
            {t("a11y.toolbarLabel")}
          </p>

          {/* High Contrast toggle */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-slate-400" aria-hidden="true" />
              <span className="text-xs text-slate-300 font-medium">{t("a11y.highContrast")}</span>
            </div>
            <button
              onClick={toggleHighContrast}
              role="switch"
              aria-checked={highContrast}
              aria-label={highContrast ? t("a11y.highContrastOn") : t("a11y.highContrastOff")}
              className={cn(
                "w-10 h-5 rounded-full relative transition-colors shrink-0",
                highContrast ? "bg-yellow-400" : "bg-slate-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  highContrast ? "translate-x-5" : "translate-x-0.5"
                )}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Font size picker */}
          <div className="px-1">
            <div className="flex items-center gap-2 mb-2">
              <Type size={14} className="text-slate-400" aria-hidden="true" />
              <span className="text-xs text-slate-300 font-medium">{t("a11y.fontSize")}</span>
            </div>
            <div className="flex gap-1" role="group" aria-label={t("a11y.fontSize")}>
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.value}
                  onClick={() => setFontSize(fs.value)}
                  aria-pressed={fontSize === fs.value}
                  aria-label={`${t("a11y.fontSize")}: ${fs.value}`}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg font-bold transition-all",
                    fs.sizeClass,
                    fontSize === fs.value
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  )}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language selector — inline grid, no dropdown, no z-index issues */}
          <div className="px-1">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={14} className="text-slate-400" aria-hidden="true" />
              <span className="text-xs text-slate-300 font-medium">{t("a11y.language")}</span>
            </div>
            <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label={t("a11y.language")}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  role="radio"
                  aria-checked={language === lang.code}
                  title={lang.nativeLabel}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-center transition-all",
                    language === lang.code
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  )}
                >
                  <span className="text-sm leading-none" aria-hidden="true">{lang.flag}</span>
                  <span className="text-[9px] font-bold leading-none">{lang.nativeLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Admin — Accessibility Checker */}
          {isAdmin && onOpenChecker && (
            <button
              onClick={() => { onOpenChecker(); setExpanded(false); }}
              className="mx-1 flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <ShieldCheck size={13} aria-hidden="true" />
              Accessibility Audit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── LanguageSelector re-export (used nowhere else but kept for API compat) ────
export function LanguageSelector() {
  const { language, setLanguage } = useAccessibility();
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label={t("a11y.language")}>
      {LANGUAGES.map((lang) => (
        <button key={lang.code} onClick={() => setLanguage(lang.code)} role="radio" aria-checked={language === lang.code} title={lang.nativeLabel}
          className={cn("flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all",
            language === lang.code ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600")}>
          <span className="text-sm leading-none" aria-hidden="true">{lang.flag}</span>
          <span className="text-[9px] font-bold leading-none">{lang.nativeLabel}</span>
        </button>
      ))}
    </div>
  );
}
