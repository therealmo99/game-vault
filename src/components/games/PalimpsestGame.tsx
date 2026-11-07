import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { Card, CardBody, CardHeader, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { t, type Locale } from "../../i18n";
import type { GameId } from "../../lib/gameState";
import { useGameProgress, useSecrets } from "../../hooks/useGameState";
import { X, Eye, Scissors, Check } from "lucide-react";

const LAYERS = [
  {
    top: { de: "████████████████████████████████", en: "████████████████████████████████" },
    middle: { de: "DIE WAHRHEIT LIEGT UNTER DER OBERFLÄCHE", en: "THE TRUTH LIES BENEATH THE SURFACE" },
    bottom: { de: "NUR WER KRATZT, FINDET DAS GOLD", en: "ONLY THOSE WHO SCRATCH FIND THE GOLD" },
  },
  {
    top: { de: "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░", en: "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░" },
    middle: { de: "ERINNERUNGEN SIND NICHT IN STEIN GEMEISSELT", en: "MEMORIES ARE NOT CARVED IN STONE" },
    bottom: { de: "SIE VERÄNDERN SICH MIT JEDEM ERZÄHLEN", en: "THEY CHANGE WITH EVERY TELLING" },
  },
  {
    top: { de: "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", en: "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓" },
    middle: { de: "DIE VERGANGENHEIT IST EIN FREMDER PLANET", en: "THE PAST IS A FOREIGN PLANET" },
    bottom: { de: "WIR SIND NUR TOURISTEN IN UNSERER GESCHICHTE", en: "WE ARE ONLY TOURISTS IN OUR OWN HISTORY" },
  },
  {
    top: { de: "═══════════════════════════════════", en: "═══════════════════════════════════" },
    middle: { de: "WAS VERBORGEN WAR, WIRD OFFENBART", en: "WHAT WAS HIDDEN IS REVEALED" },
    bottom: { de: "DER SCHLÜSSEL LIEGT IN DEINEN HÄNDEN", en: "THE KEY LIES IN YOUR HANDS" },
  },
];

const LEVEL_CONFIG = [
  { layerIndex: 0, scratchThreshold: 0.6 },
  { layerIndex: 1, scratchThreshold: 0.65 },
  { layerIndex: 2, scratchThreshold: 0.7 },
  { layerIndex: 3, scratchThreshold: 0.75 },
];

interface PalimpsestGameProps {
  locale: Locale;
  onClose: () => void;
  gameId: GameId;
}

export function PalimpsestGame({ locale, onClose, gameId }: PalimpsestGameProps) {
  const { progress, update, complete, addTime } = useGameProgress(gameId);
  const { add: addSecret } = useSecrets();
  const [level, setLevel] = useState(progress.level - 1);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [revealedLayer, setRevealedLayer] = useState<"top" | "middle" | "bottom">("top");
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerId, setTimerId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [secretTriggered, setSecretTriggered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isScratchingRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setTimeElapsed(Date.now() - startTime), 100);
    setTimerId(id);
    return () => clearInterval(id);
  }, [startTime]);

  useEffect(() => {
    const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
    setScratchProgress(0);
    setRevealedLayer("top");
    setShowResult(false);
    setStartTime(Date.now());
    setTimeElapsed(0);
    drawCanvas();
  }, [level]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
    const layer = LAYERS[config.layerIndex];
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#080808";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    if (revealedLayer === "bottom" || (revealedLayer === "middle" && scratchProgress > config.scratchThreshold)) {
      ctx.font = "bold 24px 'Space Grotesk', sans-serif";
      ctx.fillStyle = "#d49630";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = layer.bottom[locale].match(/.{1,40}/g) || [layer.bottom[locale]];
      lines.forEach((line, i) => {
        ctx.fillText(line, centerX, centerY - 40 + i * 36);
      });
    } else if (revealedLayer === "middle" || scratchProgress > config.scratchThreshold * 0.5) {
      ctx.font = "bold 20px 'Space Grotesk', sans-serif";
      ctx.fillStyle = "#a0a0a0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = layer.middle[locale].match(/.{1,50}/g) || [layer.middle[locale]];
      lines.forEach((line, i) => {
        ctx.fillText(line, centerX, centerY - 20 + i * 32);
      });
    } else {
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = "#262626";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = layer.top[locale].match(/.{1,60}/g) || [layer.top[locale]];
      lines.forEach((line, i) => {
        ctx.fillText(line, centerX, centerY - 10 + i * 28);
      });
    }

    if (scratchProgress > 0 && revealedLayer !== "bottom") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,1)";
      const particles = Math.floor(scratchProgress * 200);
      for (let i = 0; i < particles; i++) {
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        const r = Math.random() * 8 + 4;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }
  }, [level, scratchProgress, revealedLayer, locale]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isScratchingRef.current = true;
    handleScratch(e);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isScratchingRef.current) handleScratch(e);
  }, []);

  const handleMouseUp = useCallback(() => {
    isScratchingRef.current = false;
  }, []);

  const handleScratch = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];

    setScratchProgress(prev => {
      const next = Math.min(1, prev + 0.015);
      if (next >= config.scratchThreshold && revealedLayer === "top") {
        setRevealedLayer("middle");
      } else if (next >= config.scratchThreshold && revealedLayer === "middle") {
        setRevealedLayer("bottom");
      }
      drawCanvas();
      return next;
    });
  }, [level, revealedLayer, drawCanvas]);

  const checkSolution = useCallback(() => {
    const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
    const isCorrect = scratchProgress >= config.scratchThreshold && revealedLayer === "bottom";
    setCorrect(isCorrect);
    setShowResult(true);

    if (isCorrect) {
      const baseScore = 1100;
      const timeBonus = Math.max(0, 4000 - Math.floor(timeElapsed / 50));
      const levelBonus = level * 250;
      const totalScore = baseScore + timeBonus + levelBonus;
      setScore(totalScore);
      addTime(timeElapsed);
    }
  }, [level, scratchProgress, revealedLayer, timeElapsed, addTime]);

  const handleNext = useCallback(() => {
    if (correct) {
      if (level < LEVEL_CONFIG.length - 1) {
        setLevel(l => l + 1);
        update({ level: level + 2, maxLevelReached: Math.max(progress.maxLevelReached, level + 1) });
      } else {
        complete(score);
        if (!progress.secretFound && !secretTriggered) {
          addSecret(gameId, t(locale, "easterEggs.secret"), t(locale, "gamesUI.palimpsest.title"), "PALIMPSEST");
          setSecretTriggered(true);
        }
      }
    } else {
      update({ attempts: progress.attempts + 1 });
    }
    setShowResult(false);
  }, [correct, level, score, progress, update, complete, gameId, locale, addSecret, secretTriggered]);

  const gamesUI = t(locale, `gamesUI.${gameId}`);
  const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
  const layer = LAYERS[config.layerIndex];

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-ink-950/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="palimpsest-title">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-bg-card border border-border-primary">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-border-primary">
          <div>
            <h2 id="palimpsest-title" className="text-brutal text-xl sm:text-2xl tracking-widest shimmer">
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

        <CardBody className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col items-center justify-center">
          {!showResult ? (
            <div className="w-full max-w-2xl">
              <div className="relative aspect-[4/3] bg-bg-primary border border-border-primary overflow-hidden cursor-crosshair touch-none select-none">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchMove={handleMouseMove}
                  onTouchEnd={handleMouseUp}
                  role="img"
                  aria-label={t(locale, "gamesUI.palimpsest.instruction")}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center p-4">
                    <Scissors className="w-12 h-12 mx-auto mb-3 text-fg-muted/30 animate-bounce" />
                    <p className="text-brutal text-xs tracking-widest text-fg-muted">
                      {gamesUI.scratch}
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-bg-tertiary/90 backdrop-blur-sm p-3 border border-border-primary">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-fg-muted">{gamesUI.layer}</span>
                      <span className="text-brutal text-gold-500 font-mono">
                        {revealedLayer === "bottom" ? "3/3" : revealedLayer === "middle" ? "2/3" : "1/3"}
                      </span>
                    </div>
                    <div className="h-2 bg-bg-primary border border-border-primary overflow-hidden">
                      <div
                        className="h-full bg-gold-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, scratchProgress * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center text-fg-muted text-sm">
                {revealedLayer === "top" && "Kratze die Oberfläche frei..."}
                {revealedLayer === "middle" && "Fast geschafft... weiter kratzen!"}
                {revealedLayer === "bottom" && layer.bottom[locale]}
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center w-full max-w-md">
              <div className="flex items-center justify-center gap-3">
                {correct ? <Eye className="w-12 h-12 text-gold-500" /> : <X className="w-12 h-12 text-accent-crimson" />}
                <div>
                  <h3 className={cn("text-brutal text-2xl", correct ? "text-gold-500" : "text-accent-crimson")}>
                    {correct ? gamesUI.correct : gamesUI.incorrect}
                  </h3>
                  <p className="text-fg-muted mt-1">
                    {correct ? `${gamesUI.score}: ${score.toLocaleString(locale)}` : gamesUI.tryAgain}
                  </p>
                </div>
              </div>
              <div className="bg-bg-tertiary p-4 border border-border-primary">
                <p className="text-fg-muted text-sm mb-2 text-brutal tracking-wider">ENTHÜLLT:</p>
                <p className="text-fg-primary leading-relaxed">{layer.bottom[locale]}</p>
              </div>
            </div>
          )}
        </CardBody>

        <CardFooter className="flex justify-center gap-4 p-4 sm:p-6 border-t border-border-primary">
          {!showResult ? (
            <Button size="lg" onClick={checkSolution} className="min-w-[200px]" disabled={revealedLayer !== "bottom"}>
              {gamesUI.reveal}
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