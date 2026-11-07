import { t, type Locale } from "../i18n";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";
import { BackgroundAnimation } from "./BackgroundAnimation";
import { Sparkles, Target, Database, MousePointer } from "lucide-react";

interface HeroProps {
  locale: Locale;
  onScrollToGames: () => void;
}

export function Hero({ locale, onScrollToGames }: HeroProps) {
  const hero = t(locale, "hero");

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      aria-labelledby="hero-title"
    >
      <BackgroundAnimation />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-900 to-ink-950" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,168,67,0.08)_0%,_transparent_60%)]" aria-hidden="true" />
      <div className="absolute inset-0 noise-overlay" style={{ opacity: 0.05 }} aria-hidden="true" />

      <div className="container relative z-10 pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="reveal stagger">
            <span className="inline-block text-brutal text-xs tracking-widest text-gold-500 mb-6 animate-fade-in gold-border-gradient px-4 py-1">
              {hero.title}
            </span>
          </div>

          <div className="reveal stagger reveal-delay-1">
            <h1 id="hero-title" className="display-1 lg:display-2 text-balance mb-6 shimmer">
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
            <Button size="lg" onClick={onScrollToGames} className="w-full sm:w-auto min-w-[200px] gold-border-gradient">
              {hero.cta}
              <MousePointer className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </div>

          <div className="reveal stagger reveal-delay-5 mt-16">
            <div className="flex items-center justify-center gap-6 lg:gap-10 text-fg-muted text-sm">
              <span className="flex items-center gap-2 group">
                <Sparkles className="w-5 h-5 text-gold-500 transition-transform group-hover:scale-110 group-hover:rotate-12" aria-hidden="true" />
                <span className="text-brutal text-xs tracking-wider">{t(locale, "hero.featureGames")}</span>
              </span>
              <span className="flex items-center gap-2 group">
                <Target className="w-5 h-5 text-gold-500 transition-transform group-hover:scale-110" aria-hidden="true" />
                <span className="text-brutal text-xs tracking-wider">{t(locale, "hero.featureSecrets")}</span>
              </span>
              <span className="flex items-center gap-2 group">
                <Database className="w-5 h-5 text-gold-500 transition-transform group-hover:scale-110" aria-hidden="true" />
                <span className="text-brutal text-xs tracking-wider">{t(locale, "hero.featureLocal")}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
          <svg className="w-6 h-6 text-gold-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}