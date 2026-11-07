import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { t, type Locale } from "../i18n";

interface HeaderProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onScrollToGames: () => void;
}

export function Header({ locale, onLocaleChange, onScrollToGames }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const nav = t(locale, "nav");

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-sticky transition-all duration-300",
        scrolled ? "bg-ink-950/95 backdrop-blur-sm border-b border-border-primary" : "bg-transparent"
      )}
      role="banner"
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <a
            href="/"
            className="text-brutal text-xl lg:text-2xl tracking-widest shimmer"
            aria-label={t(locale, "hero.title")}
          >
            VAULT
          </a>

          <nav className="hidden lg:flex items-center gap-8" role="navigation" aria-label={t(locale, "common.language")}>
            <button
              onClick={onScrollToGames}
              className="btn-ghost text-sm"
              aria-label={nav.games}
            >
              {nav.games}
            </button>
            <button
              onClick={() => document.getElementById("progress")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-ghost text-sm"
              aria-label={nav.progress}
            >
              {nav.progress}
            </button>
            <button
              onClick={() => document.getElementById("secrets")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-ghost text-sm"
              aria-label={nav.secrets}
            >
              {nav.secrets}
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-bg-tertiary border border-border-primary p-1" role="group" aria-label={t(locale, "common.language")}>
              {["de", "en"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLocaleChange(lang as Locale)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all",
                    locale === lang
                      ? "bg-gold-500 text-ink-950"
                      : "text-fg-muted hover:text-fg-primary"
                  )}
                  aria-pressed={locale === lang}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={onScrollToGames}
              className="btn-primary hidden sm:inline-flex"
              aria-label={t(locale, "hero.ctaAria")}
            >
              {t(locale, "hero.cta")}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}