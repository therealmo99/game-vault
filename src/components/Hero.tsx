import { t, type Locale } from "../i18n";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";

interface HeroProps {
  locale: Locale;
  onScrollToGames: () => void;
}

export function Hero({ locale, onScrollToGames }: HeroProps) {
  const hero = t(locale, "hero");

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden noise-overlay grid-pattern"
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-900 to-ink-950" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-gold-900)_0%,_transparent_70%)] opacity-20" aria-hidden="true" />

      <div className="container relative z-10 pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="reveal stagger">
            <span className="inline-block text-brutal text-xs tracking-widest text-gold-500 mb-6 animate-fade-in">
              {hero.title}
            </span>
          </div>

          <div className="reveal stagger reveal-delay-1">
            <h1 id="hero-title" className="display-1 lg:display-2 text-balance mb-6">
              {hero.title}
            </h1>
          </div>

          <div className="reveal stagger reveal-delay-2">
            <div className="rule-gold-center mb-6" aria-hidden="true" />
          </div>

          <div className="reveal stagger reveal-delay-3">
            <p className="text-lg lg:text-xl text-fg-secondary max-w-2xl mx-auto mb-10 leading-relaxed text-pretty">
              {hero.subtitle}
            </p>
          </div>

          <div className="reveal stagger reveal-delay-4">
            <Button size="lg" onClick={onScrollToGames} className="w-full sm:w-auto min-w-[200px]">
              {hero.cta}
            </Button>
          </div>

          <div className="reveal stagger reveal-delay-5 mt-16">
            <div className="flex items-center justify-center gap-8 text-fg-muted text-sm">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m-6 10a6 6 0 110-12 6 6 0 010 12z" />
                </svg>
                7 Spiele
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                7 Geheimnisse
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Lokal gespeichert
              </span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
          <svg className="w-6 h-6 text-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}