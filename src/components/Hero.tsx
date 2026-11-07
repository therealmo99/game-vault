"use client";

import { t, type Locale } from "../i18n";
import { Button } from "./ui/Button";
import { BackgroundAnimation } from "./BackgroundAnimation";
import { Sparkles, Target, Database, MousePointer, ChevronDown } from "lucide-react";

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
      <div className="absolute inset-0 bg-gradient-to-b from-ink-975 via-ink-950 to-ink-975" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(232,176,58,0.06)_0%,_transparent_55%)]" aria-hidden="true" />
      <div className="absolute inset-0 noise-overlay" style={{ opacity: 0.03 }} aria-hidden="true" />

      <div className="container relative z-10 pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="reveal stagger">
            <span className="inline-flex items-center gap-2 text-brutal text-xs tracking-widest text-gold-500 mb-6 animate-fade-in gold-border-gradient px-4 py-1">
              <span className="relative z-10">{hero.title}</span>
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
            <Button size="lg" onClick={onScrollToGames} className="w-full sm:w-auto min-w-[220px] gold-border-gradient relative overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                {hero.cta}
                <MousePointer className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Button>
          </div>

          <div className="reveal stagger reveal-delay-5 mt-16">
            <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-8 text-fg-tertiary text-sm">
              <span className="flex items-center gap-2 group cursor-default">
                <Sparkles className="w-5 h-5 text-gold-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" aria-hidden="true" />
                <span className="text-brutal text-xs tracking-wider">{t(locale, "hero.featureGames")}</span>
              </span>
              <span className="flex items-center gap-2 group cursor-default">
                <Target className="w-5 h-5 text-gold-500 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                <span className="text-brutal text-xs tracking-wider">{t(locale, "hero.featureSecrets")}</span>
              </span>
              <span className="flex items-center gap-2 group cursor-default">
                <Database className="w-5 h-5 text-gold-500 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                <span className="text-brutal text-xs tracking-wider">{t(locale, "hero.featureLocal")}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
          <button
            onClick={onScrollToGames}
            className="p-2 rounded-full bg-ink-950/50 backdrop-blur-sm border border-border-primary hover:border-gold-500/50 transition-all"
            aria-label={t(locale, "hero.scrollAria")}
          >
            <ChevronDown className="w-5 h-5 text-gold-500/60" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}