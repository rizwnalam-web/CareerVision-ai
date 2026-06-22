import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import i18n from "../i18n";

// ── Types ─────────────────────────────────────────────────────────────────────
export type SupportedLang = "en" | "es" | "fr" | "ar" | "zh";
export type FontSize = "normal" | "large" | "xlarge";

interface AccessibilityState {
  highContrast: boolean;
  toggleHighContrast: () => void;
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;
  language: SupportedLang;
  setLanguage: (l: SupportedLang) => void;
  reducedMotion: boolean;
}

const defaults: AccessibilityState = {
  highContrast: false,
  toggleHighContrast: () => {},
  fontSize: "normal",
  setFontSize: () => {},
  language: "en",
  setLanguage: () => {},
  reducedMotion: false,
};

const AccessibilityContext = createContext<AccessibilityState>(defaults);

// ── Helpers ───────────────────────────────────────────────────────────────────
const RTL_LANGS: SupportedLang[] = ["ar"];

const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  normal: "",
  large: "a11y-font-large",
  xlarge: "a11y-font-xlarge",
};

function persist(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* quota exceeded – ignore */ }
}
function restore(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    const stored = restore("a11y_highContrast");
    if (stored !== null) return stored === "true";
    // Honor OS preference on first load
    return window.matchMedia("(prefers-contrast: high)").matches;
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (restore("a11y_fontSize") as FontSize) ?? "normal";
  });

  const [language, setLanguageState] = useState<SupportedLang>(() => {
    return (restore("a11y_language") as SupportedLang) ?? "en";
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // ── Side effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("high-contrast", highContrast);
    persist("a11y_highContrast", String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    const root = document.documentElement;
    // Remove all font-size classes first
    Object.values(FONT_SIZE_CLASSES).forEach((c) => c && root.classList.remove(c));
    const cls = FONT_SIZE_CLASSES[fontSize];
    if (cls) root.classList.add(cls);
    persist("a11y_fontSize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", language);
    root.setAttribute("dir", RTL_LANGS.includes(language) ? "rtl" : "ltr");
    i18n.changeLanguage(language);
    persist("a11y_language", language);
  }, [language]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Callbacks ───────────────────────────────────────────────────────────────
  const toggleHighContrast = useCallback(() => setHighContrast((v) => !v), []);

  const setFontSize = useCallback((s: FontSize) => setFontSizeState(s), []);

  const setLanguage = useCallback((l: SupportedLang) => setLanguageState(l), []);

  return (
    <AccessibilityContext.Provider
      value={{ highContrast, toggleHighContrast, fontSize, setFontSize, language, setLanguage, reducedMotion }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAccessibility() {
  return useContext(AccessibilityContext);
}
