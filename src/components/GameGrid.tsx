import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { Card, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { GameCard } from "./GameCard";
import { t, type Locale } from "../i18n";
import type { GameId } from "../lib/gameState";
import { useVaultState, useOverallProgress } from "../hooks/useGameState";

const GAME_ORDER: GameId[] = ["chronicle", "cipher", "constellation", "archive", "resonance", "palimpsest", "vault"];

interface GameGridProps {
  locale: Locale;
  onPlay: (gameId: GameId) => void;
}

export function GameGrid({ locale, onPlay }: GameGridProps) {
  const { state } = useVaultState();
  const { progress: overallProgress, completed } = useOverallProgress();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1, rootMargin: "50px" }
    );
    const el = document.getElementById("games-section");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const games = t(locale, "games");
  const gamesUI = t(locale, "gamesUI");

  return (
    <section
      id="games-section"
      className="py-16 lg:py-24 relative noise-overlay"
      aria-labelledby="games-title"
    >
      <div className="container">
        <div className={cn("text-center mb-12 lg:mb-16", inView ? "animate-fade-in" : "opacity-0")}>
          <span className="text-brutal text-xs tracking-widest text-gold-500 mb-4 block">
            {games.title}
          </span>
          <h2 id="games-title" className="display-2 lg:display-3 text-balance mb-4">
            {games.title}
          </h2>
          <div className="rule-gold-center mb-6" aria-hidden="true" />
          <p className="text-fg-secondary text-lg max-w-2xl mx-auto text-pretty">
            {games.subtitle}
          </p>
        </div>

        <div className="mb-12" role="status" aria-live="polite">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="display-3 text-gold-500 font-extrabold tracking-widest">{overallProgress}%</div>
              <span className="text-brutal text-xs tracking-widest text-fg-muted mt-1">
                {t(locale, "progress.totalProgress")}
              </span>
            </div>
            <div className="w-full sm:w-64 h-1 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-500 transition-all duration-1000 ease-out"
                style={{ width: `${overallProgress}%` }}
                role="progressbar"
                aria-valuenow={overallProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t(locale, "progress.totalProgress")}
              />
            </div>
            <div className="flex flex-col items-center">
              <div className="display-3 text-gold-500 font-extrabold tracking-widest">{completed}</div>
              <span className="text-brutal text-xs tracking-widest text-fg-muted mt-1">
                {t(locale, "progress.gamesCompleted")} / 7
              </span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
            inView ? "stagger" : "opacity-0"
          )}
          role="list"
          aria-label={games.title}
        >
          {GAME_ORDER.map((gameId, index) => (
            <GameCard
              key={gameId}
              gameId={gameId}
              progress={state.games[gameId]}
              locale={locale}
              onPlay={onPlay}
              index={index}
            />
          ))}
        </div>

        <div className="text-center mt-12" aria-hidden="true">
          <div className="rule-gold-center" />
        </div>
      </div>
    </section>
  );
}