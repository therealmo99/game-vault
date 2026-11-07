import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { Card, CardBody, CardHeader, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { t, type Locale } from "../../i18n";
import type { GameId } from "../../lib/gameState";
import { useGameProgress, useSecrets } from "../../hooks/useGameState";
import { X, Volume2, VolumeX, Music, Check, RotateCcw } from "lucide-react";

const TONE_FREQUENCIES = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

const LEVEL_CONFIG = [
  { sequenceLength: 3, rounds: 3, speed: 800 },
  { sequenceLength: 4, rounds: 4, speed: 700 },
  { sequenceLength: 5, rounds: 5, speed: 600 },
  { sequenceLength: 6, rounds: 6, speed: 500 },
  { sequenceLength: 7, rounds: 7, speed: 450 },
];

function generateSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * TONE_FREQUENCIES.length));
}

interface ResonanceGameProps {
  locale: Locale;
  onClose: () => void;
  gameId: GameId;
}

export function ResonanceGame({ locale, onClose, gameId }: ResonanceGameProps) {
  const { progress, update, complete, addTime } = useGameProgress(gameId);
  const { add: addSecret } = useSecrets();
  const [level, setLevel] = useState(progress.level - 1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<"listen" | "repeat" | "result">("listen");
  const [currentRound, setCurrentRound] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerId, setTimerId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [secretTriggered, setSecretTriggered] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const id = setInterval(() => setTimeElapsed(Date.now() - startTime), 100);
    setTimerId(id);
    return () => clearInterval(id);
  }, [startTime]);

  useEffect(() => {
    return () => {
      if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
    };
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number = 300) => {
    if (!audioEnabled) return;
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, [audioEnabled, getAudioContext]);

  const playSequence = useCallback(async (seq: number[], speed: number) => {
    setPhase("listen");
    for (let i = 0; i < seq.length; i++) {
      playTone(TONE_FREQUENCIES[seq[i]], speed * 0.7);
      await new Promise(r => setTimeout(r, speed));
    }
    setPhase("repeat");
    setUserSequence([]);
  }, [playTone]);

  useEffect(() => {
    const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
    const seq = generateSequence(config.sequenceLength);
    setSequence(seq);
    setCurrentRound(1);
    setShowResult(false);
    setStartTime(Date.now());
    setTimeElapsed(0);

    const delay = setTimeout(() => playSequence(seq, config.speed), 1000);
    return () => clearTimeout(delay);
  }, [level, playSequence]);

  const handleTonePress = useCallback((index: number) => {
    if (phase !== "repeat") return;
    playTone(TONE_FREQUENCIES[index], 200);
    setUserSequence(prev => [...prev, index]);
  }, [phase, playTone]);

  useEffect(() => {
    if (phase !== "repeat") return;
    const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
    if (userSequence.length === config.sequenceLength) {
      const isCorrect = userSequence.every((v, i) => v === sequence[i]);
      setCorrect(isCorrect);
      setShowResult(true);
      setPhase("result");

      if (isCorrect) {
        const baseScore = 1000;
        const roundBonus = currentRound * 200;
        const levelBonus = level * 150;
        const totalScore = baseScore + roundBonus + levelBonus;
        setScore(prev => prev + totalScore);
        addTime(timeElapsed);

        if (currentRound < config.rounds) {
          setTimeout(() => {
            setCurrentRound(r => r + 1);
            setUserSequence([]);
            const nextSeq = generateSequence(config.sequenceLength);
            setSequence(next);
            playSequence(next, config.speed);
          }, 1500);
        } else {
          // Level complete
        }
      } else {
        // Wrong - will handle in handleNext
      }
    }
  }, [userSequence, phase, sequence, level, currentRound, playSequence, addTime, timeElapsed]);

  const handleNext = useCallback(() => {
    if (correct) {
      const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
      if (currentRound < config.rounds) {
        // Continue handled in effect
      } else if (level < LEVEL_CONFIG.length - 1) {
        setLevel(l => l + 1);
        update({ level: level + 2, maxLevelReached: Math.max(progress.maxLevelReached, level + 1) });
      } else {
        complete(score);
        if (!progress.secretFound && !secretTriggered) {
          addSecret(gameId, t(locale, "easterEggs.secret"), t(locale, "gamesUI.resonance.title"), "RESONANCE");
          setSecretTriggered(true);
        }
      }
    } else {
      update({ attempts: progress.attempts + 1 });
      // Retry same level
      const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
      const seq = generateSequence(config.sequenceLength);
      setSequence(seq);
      setCurrentRound(1);
      setShowResult(false);
      setStartTime(Date.now());
      setTimeElapsed(0);
      setTimeout(() => playSequence(seq, config.speed), 1000);
    }
  }, [correct, level, currentRound, score, progress, update, complete, gameId, locale, addSecret, secretTriggered, playSequence]);

  const gamesUI = t(locale, `gamesUI.${gameId}`);
  const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-ink-950/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="resonance-title">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-bg-card border border-border-primary">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-border-primary">
          <div>
            <h2 id="resonance-title" className="text-brutal text-xl sm:text-2xl tracking-widest shimmer">
              {gamesUI.title}
            </h2>
            <p className="text-fg-muted text-sm mt-1">{gamesUI.instruction}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="gold">{gamesUI.level} {level + 1} / {LEVEL_CONFIG.length}</Badge>
            <Badge variant={progress.status === "completed" ? "complete" : "locked"}>{gamesUI.score}: {progress.bestScore.toLocaleString(locale)}</Badge>
            <Badge variant="gold">{gamesUI.round} {currentRound} / {config.rounds}</Badge>
            <Button variant="ghost" size="icon" onClick={() => setAudioEnabled(!audioEnabled)} aria-label={audioEnabled ? t(locale, "common.sound") + " aus" : t(locale, "common.sound") + " an"}>
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={t(locale, "common.close")}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardBody className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
          {!showResult ? (
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="text-brutal text-xs tracking-widest text-gold-500 mb-2">
                  {phase === "listen" ? gamesUI.listen : gamesUI.repeat}
                </div>
                <div className="text-fg-muted text-sm">
                  {phase === "listen"
                    ? t(locale, "gamesUI.resonance.sequence")
                    : `${gamesUI.sequence}: ${userSequence.length} / ${config.sequenceLength}`}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3" role="group" aria-label={t(locale, "gamesUI.resonance.sequence")}>
                {TONE_FREQUENCIES.map((freq, i) => (
                  <button
                    key={i}
                    onClick={() => handleTonePress(i)}
                    disabled={phase !== "repeat"}
                    className={cn(
                      "aspect-square bg-bg-tertiary border-2 transition-all font-mono text-lg",
                      phase === "listen" ? "border-border-primary cursor-wait" : "border-border-secondary hover:border-gold-500 cursor-pointer active:scale-95",
                      userSequence.includes(i) && phase === "repeat" && "border-gold-500 bg-gold-500/10"
                    )}
                    aria-label={`Ton ${i + 1}`}
                    aria-pressed={userSequence.includes(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {phase === "listen" && (
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-2 text-fg-muted text-sm">
                    <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <span>Spielt Sequenz...</span>
                  </div>
                </div>
              )}

              {phase === "repeat" && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setUserSequence([])}>
                    <RotateCcw className="w-4 h-4 mr-1" /> {t(locale, "common.reset")}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-center w-full max-w-md">
              <div className="flex items-center justify-center gap-3">
                {correct ? <Music className="w-12 h-12 text-gold-500" /> : <X className="w-12 h-12 text-accent-crimson" />}
                <div>
                  <h3 className={cn("text-brutal text-2xl", correct ? "text-gold-500" : "text-accent-crimson")}>
                    {correct ? gamesUI.correct : gamesUI.incorrect}
                  </h3>
                  <p className="text-fg-muted mt-1">
                    {correct ? `${gamesUI.score}: ${score.toLocaleString(locale)}` : gamesUI.tryAgain}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-bg-tertiary p-4 border border-border-primary">
                  <div className="text-fg-muted">{t(locale, "common.time")}</div>
                  <div className="text-brutal text-lg text-gold-500 font-mono">
                    {Math.floor(timeElapsed / 60000)}:{String(Math.floor((timeElapsed % 60000) / 1000)).padStart(2, "0")}
                  </div>
                </div>
                <div className="bg-bg-tertiary p-4 border border-border-primary">
                  <div className="text-fg-muted">{gamesUI.round}</div>
                  <div className="text-brutal text-lg text-gold-500 font-mono">{currentRound} / {config.rounds}</div>
                </div>
              </div>
            </div>
          )}
        </CardBody>

        <CardFooter className="flex justify-center gap-4 p-4 sm:p-6 border-t border-border-primary">
          {!showResult && phase === "repeat" ? (
            <Button size="lg" onClick={() => { setPhase("result"); }} className="min-w-[200px]" disabled={userSequence.length < config.sequenceLength}>
              {gamesUI.submit}
            </Button>
          ) : showResult ? (
            <Button size="lg" variant={correct ? "primary" : "secondary"} onClick={handleNext} className="min-w-[200px]">
              {correct && (currentRound < config.rounds || level < LEVEL_CONFIG.length - 1) ? gamesUI.next : correct ? t(locale, "common.close") : gamesUI.tryAgain}
            </Button>
          ) : null}
        </CardFooter>
      </div>
    </div>
  );
}