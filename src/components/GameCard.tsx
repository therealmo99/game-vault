import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Card, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { t, type Locale } from "../i18n";
import type { GameId, GameProgress } from "../lib/gameState";

interface GameCardProps {
  gameId: GameId;
  progress: GameProgress;
  locale: Locale;
  onPlay: (gameId: GameId) => void;
  index: number;
}

const gameIcons: Record<GameId, React.ReactNode> = {
  chronicle: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  cipher: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  constellation: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  archive: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  resonance: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1M8.5 20.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    </svg>
  ),
  palimpsest: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  vault: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
};

const gameTitles: Record<GameId, { de: string; en: string }> = {
  chronicle: { de: "CHRONICLE", en: "CHRONICLE" },
  cipher: { de: "CIPHER", en: "CIPHER" },
  constellation: { de: "CONSTELLATION", en: "CONSTELLATION" },
  archive: { de: "ARCHIVE", en: "ARCHIVE" },
  resonance: { de: "RESONANCE", en: "RESONANCE" },
  palimpsest: { de: "PALIMPSEST", en: "PALIMPSEST" },
  vault: { de: "VAULT", en: "VAULT" },
};

export function GameCard({ gameId, progress, locale, onPlay, index }: GameCardProps) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1, rootMargin: "50px" }
    );
    const el = document.getElementById(`game-card-${gameId}`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [gameId]);

  const statusConfig = {
    locked: { label: t(locale, "games.locked"), variant: "locked" as const, playable: false },
    unlocked: { label: t(locale, "games.unlocked"), variant: "gold" as const, playable: true },
    completed: { label: t(locale, "games.completed"), variant: "complete" as const, playable: true },
  };

  const config = statusConfig[progress.status];
  const description = t(locale, `gameDescriptions.${gameId}`);
  const title = gameTitles[gameId][locale];
  const gamesUI = t(locale, `gamesUI.${gameId}`);
  const buttonText = progress.status === "completed" ? gamesUI.replay : gamesUI.play;

  return (
    <Card
      id={`game-card-${gameId}`}
      className={cn(
        "group relative overflow-hidden",
        progress.status === "locked" && "opacity-50 pointer-events-none",
        progress.secretFound && "border-gold-500/50"
      )}
      variant={progress.secretFound ? "gold" : "default"}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />

      <div className="relative p-6 h-full flex flex-col">
        <div className={cn("flex items-center justify-between mb-4", inView ? "animate-slide-up" : "opacity-0 translate-y-4")}>
          <div className="text-gold-500" aria-hidden="true">
            {gameIcons[gameId]}
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        <div className={cn("flex-1", inView ? "animate-slide-up" : "opacity-0 translate-y-4")} style={{ transitionDelay: "100ms" }}>
          <h3 className="text-brutal text-xl tracking-widest mb-3 shimmer">{title}</h3>
          <p className="text-fg-muted text-sm leading-relaxed mb-4">{description}</p>

          {progress.status === "completed" && (
            <div className="flex items-center gap-4 text-xs text-fg-secondary mb-4">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {progress.bestScore.toLocaleString(locale)} {t(locale, "common.score")}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t(locale, "common.time")}: {Math.floor(progress.timePlayed / 60000)}m
              </span>
            </div>
          )}

          {progress.secretFound && (
            <div className="flex items-center gap-2 text-xs text-gold-500 mb-4 animate-pulse">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>{t(locale, "games.secret")}</span>
            </div>
          )}
        </div>

        <div className={cn("pt-4 border-t border-border-primary", inView ? "animate-slide-up" : "opacity-0 translate-y-4")} style={{ transitionDelay: "200ms" }}>
          <Button
            className="w-full"
            onClick={() => config.playable && onPlay(gameId)}
            disabled={!config.playable}
            aria-label={`${buttonText} ${title}`}
          >
            {buttonText}
          </Button>
        </div>
      </div>

      {progress.secretFound && (
        <div className="absolute top-4 right-4" aria-hidden="true">
          <div className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
        </div>
      )}
    </Card>
  );
}