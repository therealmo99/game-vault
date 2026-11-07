import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { Card, CardBody, CardHeader, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { t, type Locale } from "../../i18n";
import type { GameId } from "../../lib/gameState";
import { useGameProgress, useSecrets } from "../../hooks/useGameState";
import { X, Star, Eye, EyeOff } from "lucide-react";

interface StarPoint {
  id: string;
  x: number;
  y: number;
  connected: string[];
}

const CONSTELLATIONS = [
  { name: { de: "Großer Wagen", en: "Big Dipper" }, stars: 7, pattern: [
    { x: 15, y: 70 }, { x: 25, y: 55 }, { x: 35, y: 45 },
    { x: 50, y: 40 }, { x: 65, y: 42 }, { x: 78, y: 50 }, { x: 85, y: 65 }
  ], connections: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]] },
  { name: { de: "Orion", en: "Orion" }, stars: 7, pattern: [
    { x: 20, y: 30 }, { x: 40, y: 25 }, { x: 50, y: 40 },
    { x: 60, y: 25 }, { x: 80, y: 30 }, { x: 45, y: 55 }, { x: 55, y: 55 }
  ], connections: [[0,2],[1,2],[2,3],[3,4],[2,5],[2,6],[5,6]] },
  { name: { de: "Kassiopeia", en: "Cassiopeia" }, stars: 5, pattern: [
    { x: 15, y: 50 }, { x: 30, y: 65 }, { x: 50, y: 50 },
    { x: 70, y: 65 }, { x: 85, y: 50 }
  ], connections: [[0,1],[1,2],[2,3],[3,4]] },
  { name: { de: "Skorpion", en: "Scorpius" }, stars: 8, pattern: [
    { x: 20, y: 20 }, { x: 30, y: 35 }, { x: 35, y: 50 },
    { x: 45, y: 55 }, { x: 55, y: 50 }, { x: 65, y: 40 },
    { x: 75, y: 30 }, { x: 85, y: 25 }
  ], connections: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]] },
  { name: { de: "Kreuz des Südens", en: "Southern Cross" }, stars: 5, pattern: [
    { x: 50, y: 15 }, { x: 35, y: 40 }, { x: 50, y: 55 },
    { x: 65, y: 40 }, { x: 50, y: 40 }
  ], connections: [[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]] },
];

const LEVEL_CONFIG = [
  { constellationIdx: 0, extraStars: 3 },
  { constellationIdx: 1, extraStars: 4 },
  { constellationIdx: 2, extraStars: 5 },
  { constellationIdx: 3, extraStars: 6 },
  { constellationIdx: 4, extraStars: 7 },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandomPosition(existing: {x: number, y: number}[]): {x: number, y: number} {
  let attempts = 0;
  while (attempts < 50) {
    const x = Math.random() * 70 + 15;
    const y = Math.random() * 70 + 15;
    const tooClose = existing.some(p => Math.hypot(p.x - x, p.y - y) < 8);
    if (!tooClose) return { x, y };
    attempts++;
  }
  return { x: Math.random() * 70 + 15, y: Math.random() * 70 + 15 };
}

interface ConstellationGameProps {
  locale: Locale;
  onClose: () => void;
  gameId: GameId;
}

export function ConstellationGame({ locale, onClose, gameId }: ConstellationGameProps) {
  const { progress, update, complete, addTime } = useGameProgress(gameId);
  const { add: addSecret } = useSecrets();
  const [level, setLevel] = useState(progress.level - 1);
  const [stars, setStars] = useState<StarPoint[]>([]);
  const [selectedStar, setSelectedStar] = useState<string | null>(null);
  const [connections, setConnections] = useState<[string, string][]>([]);
  const [showPattern, setShowPattern] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerId, setTimerId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [secretTriggered, setSecretTriggered] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const id = setInterval(() => setTimeElapsed(Date.now() - startTime), 100);
    setTimerId(id);
    return () => clearInterval(id);
  }, [startTime]);

  useEffect(() => {
    const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
    const constellation = CONSTELLATIONS[config.constellationIdx];
    const patternStars = constellation.pattern.map((p, i) => ({
      id: `target-${i}`,
      x: p.x,
      y: p.y,
      connected: constellation.connections
        .filter(c => c.includes(i))
        .flatMap(c => c.filter(idx => idx !== i).map(idx => `target-${idx}`))
    }));

    const extraStars: StarPoint[] = [];
    for (let i = 0; i < config.extraStars; i++) {
      const pos = getRandomPosition([...patternStars, ...extraStars]);
      extraStars.push({
        id: `extra-${i}`,
        x: pos.x,
        y: pos.y,
        connected: []
      });
    }

    const allStars = shuffleArray([...patternStars, ...extraStars]);
    setStars(allStars);
    setConnections([]);
    setSelectedStar(null);
    setShowPattern(false);
    setShowResult(false);
    setStartTime(Date.now());
    setTimeElapsed(0);
  }, [level]);

  const handleStarClick = useCallback((starId: string) => {
    if (selectedStar === null) {
      setSelectedStar(starId);
    } else if (selectedStar === starId) {
      setSelectedStar(null);
    } else {
      const exists = connections.some(([a, b]) =>
        (a === selectedStar && b === starId) || (a === starId && b === selectedStar)
      );
      if (!exists) {
        setConnections(prev => [...prev, [selectedStar, starId]]);
      }
      setSelectedStar(null);
    }
  }, [selectedStar, connections]);

  const checkSolution = useCallback(() => {
    const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
    const constellation = CONSTELLATIONS[config.constellationIdx];
    const targetConnections = constellation.connections.map(([a, b]) => [
      `target-${a}`, `target-${b}`
    ].sort());

    const userConnections = connections.map(([a, b]) => [a, b].sort());
    const isCorrect = targetConnections.length === userConnections.length &&
      targetConnections.every(tc => userConnections.some(uc =>
        uc[0] === tc[0] && uc[1] === tc[1]
      ));

    setCorrect(isCorrect);
    setShowResult(true);
    setShowPattern(true);

    if (isCorrect) {
      const baseScore = 1200;
      const timeBonus = Math.max(0, 4000 - Math.floor(timeElapsed / 100));
      const levelBonus = level * 250;
      const totalScore = baseScore + timeBonus + levelBonus;
      setScore(totalScore);
      addTime(timeElapsed);
    }
  }, [connections, level, timeElapsed, addTime]);

  const handleNext = useCallback(() => {
    if (correct) {
      if (level < LEVEL_CONFIG.length - 1) {
        setLevel(l => l + 1);
        update({ level: level + 2, maxLevelReached: Math.max(progress.maxLevelReached, level + 1) });
      } else {
        complete(score);
        if (!progress.secretFound && !secretTriggered) {
          addSecret(gameId, t(locale, "easterEggs.secret"), t(locale, "gamesUI.constellation.title"), "CONSTELLATION");
          setSecretTriggered(true);
        }
      }
    } else {
      update({ attempts: progress.attempts + 1 });
      setConnections([]);
      setShowPattern(false);
      setShowResult(false);
    }
  }, [correct, level, score, progress, update, complete, gameId, locale, addSecret, secretTriggered]);

  const handleReveal = useCallback(() => setShowPattern(true), []);
  const handleHide = useCallback(() => setShowPattern(false), []);

  const gamesUI = t(locale, `gamesUI.${gameId}`);
  const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
  const constellation = CONSTELLATIONS[config.constellationIdx];

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-ink-950/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="constellation-title">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-bg-card border border-border-primary">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-border-primary">
          <div>
            <h2 id="constellation-title" className="text-brutal text-xl sm:text-2xl tracking-widest shimmer">
              {gamesUI.title}
            </h2>
            <p className="text-fg-muted text-sm mt-1">{gamesUI.instruction}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="gold">{gamesUI.level} {level + 1} / {LEVEL_CONFIG.length}</Badge>
            <Badge variant={progress.status === "completed" ? "complete" : "locked"}>{gamesUI.score}: {progress.bestScore.toLocaleString(locale)}</Badge>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={t(locale, "common.close")}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardBody className="flex-1 overflow-hidden p-4 sm:p-6 relative">
          {!showResult ? (
            <>
              <div className="relative aspect-square max-w-[600px] mx-auto bg-bg-primary border border-border-primary">
                <svg ref={svgRef} className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 Z" fill="currentColor" />
                    </marker>
                  </defs>
                  <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    {connections.map(([a, b], i) => {
                      const starA = stars.find(s => s.id === a);
                      const starB = stars.find(s => s.id === b);
                      if (!starA || !starB) return null;
                      const isTarget = a.startsWith("target-") && b.startsWith("target-");
                      return (
                        <line
                          key={i}
                          x1={starA.x} y1={starA.y}
                          x2={starB.x} y2={starB.y}
                          className={cn("transition-colors", isTarget && "stroke-gold-500", !isTarget && "stroke-fg-muted/50")}
                        />
                      );
                    })}
                  </g>
                  {showPattern && (
                    <g stroke="var(--color-gold-500)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4,4" opacity="0.6">
                      {constellation.connections.map(([a, b], i) => (
                        <line
                          key={`pattern-${i}`}
                          x1={constellation.pattern[a].x} y1={constellation.pattern[a].y}
                          x2={constellation.pattern[b].x} y2={constellation.pattern[b].y}
                        />
                      ))}
                    </g>
                  )}
                  {stars.map(star => {
                    const isTarget = star.id.startsWith("target-");
                    const isSelected = selectedStar === star.id;
                    const isConnected = connections.some(([a, b]) => a === star.id || b === star.id);
                    return (
                      <circle
                        key={star.id}
                        cx={star.x} cy={star.y}
                        r={isSelected ? 5 : isTarget ? 4 : 3}
                        className={cn(
                          "transition-all cursor-pointer",
                          isTarget ? "fill-gold-500" : "fill-fg-muted",
                          isSelected && "stroke-gold-500 stroke-2 scale-150",
                          isConnected && !isTarget && "stroke-gold-500/50"
                        )}
                        onClick={() => handleStarClick(star.id)}
                        style={{ filter: isTarget ? "drop-shadow(0 0 4px var(--color-gold-500))" : "none" }}
                      />
                    );
                  })}
                </svg>
              </div>

              <div className="flex items-center justify-center gap-4 mt-6">
                <Button variant="secondary" size="sm" onClick={handleReveal}>
                  <Eye className="w-4 h-4 mr-1" /> {gamesUI.reveal}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleHide}>
                  <EyeOff className="w-4 h-4 mr-1" /> {t(locale, "common.hide")}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConnections([])}>
                  {t(locale, "common.reset")}
                </Button>
              </div>
            </>
          ) : (
            <div className="relative aspect-square max-w-[600px] mx-auto bg-bg-primary border border-border-primary flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <g stroke={correct ? "var(--color-gold-500)" : "var(--color-accent-crimson)"} strokeWidth={2} strokeLinecap="round">
                  {constellation.connections.map(([a, b], i) => (
                    <line
                      key={i}
                      x1={constellation.pattern[a].x} y1={constellation.pattern[a].y}
                      x2={constellation.pattern[b].x} y2={constellation.pattern[b].y}
                    />
                  ))}
                </g>
                {constellation.pattern.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x} cy={p.y} r={5}
                    fill={correct ? "var(--color-gold-500)" : "var(--color-accent-crimson)"}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-4">
                <div className="flex items-center justify-center gap-3">
                  {correct ? <Star className="w-12 h-12 text-gold-500" /> : <X className="w-12 h-12 text-accent-crimson" />}
                  <div>
                    <h3 className={cn("text-brutal text-2xl", correct ? "text-gold-500" : "text-accent-crimson")}>
                      {correct ? gamesUI.correct : gamesUI.incorrect}
                    </h3>
                    <p className="text-fg-muted mt-1">
                      {correct ? `${gamesUI.score}: ${score.toLocaleString(locale)}` : gamesUI.tryAgain}
                    </p>
                  </div>
                </div>
                <p className="text-fg-muted text-sm">{constellation.name[locale]}</p>
              </div>
            </div>
          )}
        </CardBody>

        <CardFooter className="flex justify-center gap-4 p-4 sm:p-6 border-t border-border-primary">
          {!showResult ? (
            <Button size="lg" onClick={checkSolution} className="min-w-[200px]">
              {gamesUI.submit}
            </Button>
          ) : (
            <Button size="lg" variant={correct ? "primary" : "secondary"} onClick={handleNext} className="min-w-[200px]">
              {correct && level < LEVEL_CONFIG.length - 1 ? gamesUI.next : correct ? t(locale, "common.close") : gamesUI.tryAgain}
            </Button>
          )}
        </CardFooter>
      </div>
    </div>
  );
}