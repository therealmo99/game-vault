import { useState, useCallback, useEffect } from "react";
import { cn } from "../../../lib/utils";
import { Card, CardBody, CardHeader, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { t, type Locale } from "../../../i18n";
import type { GameId } from "../../../lib/gameState";
import { useGameProgress, useVaultState, useSecrets } from "../../../hooks/useGameState";
import { X, Key, Lock, Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const VAULT_COMBINATIONS = [
  { name: { de: "Ur-Schlüssel", en: "Prime Key" }, parts: 3, pattern: [0, 2, 1] },
  { name: { de: "Sekundär-Code", en: "Secondary Code" }, parts: 4, pattern: [3, 1, 0, 2] },
  { name: { de: "Tertiär-Siegel", en: "Tertiary Seal" }, parts: 4, pattern: [1, 3, 2, 0] },
  { name: { de: "Quartär-Schloss", en: "Quaternary Lock" }, parts: 5, pattern: [2, 0, 4, 1, 3] },
  { name: { de: "Meister-Schlüssel", en: "Master Key" }, parts: 6, pattern: [5, 2, 0, 3, 1, 4] },
];

const FRAGMENT_NAMES = [
  { de: "CHRONICLE-FRAGMENT", en: "CHRONICLE FRAGMENT" },
  { de: "CIPHER-FRAGMENT", en: "CIPHER FRAGMENT" },
  { de: "CONSTELLATION-FRAGMENT", en: "CONSTELLATION FRAGMENT" },
  { de: "ARCHIVE-FRAGMENT", en: "ARCHIVE FRAGMENT" },
  { de: "RESONANCE-FRAGMENT", en: "RESONANCE FRAGMENT" },
  { de: "PALIMPSEST-FRAGMENT", en: "PALIMPSEST FRAGMENT" },
];

interface VaultGameProps {
  locale: Locale;
  onClose: () => void;
  gameId: GameId;
}

export function VaultGame({ locale, onClose, gameId }: VaultGameProps) {
  const { state } = useVaultState();
  const { progress, update, complete, addTime } = useGameProgress(gameId);
  const { add: addSecret } = useSecrets();
  const [level, setLevel] = useState(progress.level - 1);
  const [selectedFragments, setSelectedFragments] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerId, setTimerId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [secretTriggered, setSecretTriggered] = useState(false);
  const [animationState, setAnimationState] = useState<"idle" | "checking" | "success" | "fail">("idle");

  useEffect(() => {
    const id = setInterval(() => setTimeElapsed(Date.now() - startTime), 100);
    setTimerId(id);
    return () => clearInterval(id);
  }, [startTime]);

  const availableFragments = Object.entries(state.games)
    .filter(([_, g]) => g.status === "completed")
    .map(([id]) => id as GameId);

  useEffect(() => {
    setSelectedFragments([]);
    setShowResult(false);
    setAnimationState("idle");
    setStartTime(Date.now());
    setTimeElapsed(0);
  }, [level]);

  const handleFragmentToggle = useCallback((fragmentId: string) => {
    if (animationState !== "idle") return;
    setSelectedFragments(prev =>
      prev.includes(fragmentId)
        ? prev.filter(f => f !== fragmentId)
        : [...prev, fragmentId]
    );
  }, [animationState]);

  const checkSolution = useCallback(() => {
    const config = VAULT_COMBINATIONS[Math.min(level, VAULT_COMBINATIONS.length - 1)];
    const expectedIds = config.pattern.map(i => availableFragments[i]).filter(Boolean);
    const isCorrect = expectedIds.length === selectedFragments.length &&
      expectedIds.every((id, i) => id === selectedFragments[i]);

    setAnimationState("checking");
    setTimeout(() => {
      setAnimationState(isCorrect ? "success" : "fail");
      setCorrect(isCorrect);
      setShowResult(true);

      if (isCorrect) {
        const baseScore = 2000;
        const timeBonus = Math.max(0, 5000 - Math.floor(timeElapsed / 50));
        const levelBonus = level * 500;
        const totalScore = baseScore + timeBonus + levelBonus;
        setScore(totalScore);
        addTime(timeElapsed);
      }
    }, 800);
  }, [level, availableFragments, selectedFragments, timeElapsed, addTime]);

  const handleNext = useCallback(() => {
    if (correct) {
      if (level < VAULT_COMBINATIONS.length - 1) {
        setLevel(l => l + 1);
        update({ level: level + 2, maxLevelReached: Math.max(progress.maxLevelReached, level + 1) });
      } else {
        complete(score);
        if (!progress.secretFound && !secretTriggered) {
          addSecret(gameId, t(locale, "easterEggs.secret"), t(locale, "gamesUI.vault.title"), "VAULT");
          setSecretTriggered(true);
        }
      }
    } else {
      update({ attempts: progress.attempts + 1 });
      setSelectedFragments([]);
      setAnimationState("idle");
      setShowResult(false);
    }
  }, [correct, level, score, progress, update, complete, gameId, locale, addSecret, secretTriggered]);

  const gamesUI = t(locale, `gamesUI.${gameId}`);
  const config = VAULT_COMBINATIONS[Math.min(level, VAULT_COMBINATIONS.length - 1)];
  const vaultName = config.name[locale];

  const fragmentIcons: Record<GameId, React.ReactNode> = {
    chronicle: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    cipher: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    constellation: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    archive: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    resonance: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1M8.5 20.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /></svg>,
    palimpsest: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-ink-950/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="vault-title">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-bg-card border border-border-primary">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-border-primary">
          <div>
            <h2 id="vault-title" className="text-brutal text-xl sm:text-2xl tracking-widest shimmer">
              {gamesUI.title}
            </h2>
            <p className="text-fg-muted text-sm mt-1">{gamesUI.instruction}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="gold">{gamesUI.level} {level + 1} / {VAULT_COMBINATIONS.length}</Badge>
            <Badge variant={progress.status === "completed" ? "complete" : "locked"}>{gamesUI.score}: {progress.bestScore.toLocaleString(locale)}</Badge>
            <Badge variant="gold">{vaultName}</Badge>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={t(locale, "common.close")}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardBody className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!showResult ? (
            <div className="space-y-8">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className={cn(
                    "absolute inset-0 border-4 rounded-full transition-all",
                    animationState === "success" && "border-gold-500 animate-ping",
                    animationState === "fail" && "border-accent-crimson animate-pulse",
                    animationState === "checking" && "border-gold-500/50 animate-spin",
                    animationState === "idle" && "border-border-secondary"
                  )} />
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-center text-5xl transition-all duration-300",
                    animationState === "success" && "text-gold-500 scale-125",
                    animationState === "fail" && "text-accent-crimson scale-125",
                    animationState === "checking" && "text-gold-500/50",
                    animationState === "idle" && "text-fg-muted/30"
                  )}>
                    <Lock />
                  </div>
                </div>
                <h3 className="text-brutal text-xl tracking-widest text-gold-500 mb-2">{vaultName}</h3>
                <p className="text-fg-muted text-sm">{availableFragments.length} / 6 {gamesUI.fragments} {t(locale, "gamesUI.vault.masterKey")}</p>
              </div>

              <div>
                <label className="label mb-4">{gamesUI.fragments} ({selectedFragments.length} / {config.parts})</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" role="list" aria-label={gamesUI.fragments}>
                  {FRAGMENT_NAMES.map((fragment, i) => {
                    const gameId = fragment.de.replace("-FRAGMENT", "").toLowerCase() as GameId;
                    const isCompleted = state.games[gameId]?.status === "completed";
                    const isSelected = selectedFragments.includes(fragment.de);
                    const isAvailable = availableFragments.includes(gameId);

                    return (
                      <button
                        key={fragment.de}
                        onClick={() => isAvailable && handleFragmentToggle(fragment.de)}
                        disabled={!isAvailable || animationState !== "idle"}
                        className={cn(
                          "relative p-4 bg-bg-tertiary border-2 transition-all min-h-[100px] flex flex-col items-center justify-center gap-2",
                          isAvailable ? "border-border-secondary hover:border-gold-500 cursor-pointer" : "border-border-primary opacity-40 cursor-not-allowed",
                          isSelected && "border-gold-500 bg-gold-500/10",
                          animationState === "success" && isSelected && "animate-pulse"
                        )}
                        role="listitem"
                        aria-selected={isSelected}
                        aria-disabled={!isAvailable}
                      >
                        <div className={cn("transition-colors", isAvailable ? "text-gold-500" : "text-fg-muted/30")}>
                          {fragmentIcons[gameId]}
                        </div>
                        <span className="text-brutal text-xs tracking-wider truncate w-full text-center">
                          {fragment[locale]}
                        </span>
                        {isSelected && <Check className="w-5 h-5 text-gold-500" />}
                        {!isAvailable && <Lock className="w-5 h-5 text-fg-muted/30" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedFragments.length > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-fg-muted">
                  <span>Ausgewählt:</span>
                  {selectedFragments.map((f, i) => (
                    <span key={f} className="px-2 py-1 bg-gold-500/10 border border-gold-500 text-gold-400 text-xs font-mono">
                      {i + 1}. {f.replace("-FRAGMENT", "")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-3">
                {correct ? (
                  <>
                    <Key className="w-12 h-12 text-gold-500" />
                    <Sparkles className="w-12 h-12 text-gold-500 animate-spin" />
                  </>
                ) : (
                  <Lock className="w-12 h-12 text-accent-crimson" />
                )}
                <div>
                  <h3 className={cn("text-brutal text-2xl", correct ? "text-gold-500" : "text-accent-crimson")}>
                    {correct ? gamesUI.correct : gamesUI.incorrect}
                  </h3>
                  <p className="text-fg-muted mt-1">
                    {correct
                      ? `${gamesUI.score}: ${score.toLocaleString(locale)} — {t(locale, "gamesUI.vault.masterKey")} ERHALTEN`
                      : gamesUI.tryAgain}
                  </p>
                </div>
              </div>
              {correct && (
                <div className="bg-bg-tertiary p-6 border border-gold-500 relative noise-overlay">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Key className="w-16 h-16 text-gold-500" />
                    <div className="text-center">
                      <p className="text-brutal text-xs tracking-widest text-gold-500">{t(locale, "gamesUI.vault.masterKey")}</p>
                      <p className="text-fg-primary font-mono text-lg tracking-widest">VAULT-7-{Date.now().toString(36).toUpperCase()}</p>
                    </div>
                  </div>
                  <p className="text-fg-muted text-sm text-center">
                    {t(locale, "hero.subtitle")}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardBody>

        <CardFooter className="flex justify-center gap-4 p-4 sm:p-6 border-t border-border-primary">
          {!showResult ? (
            <Button size="lg" onClick={checkSolution} className="min-w-[200px]" disabled={selectedFragments.length !== config.parts || animationState !== "idle"}>
              {animationState === "checking" ? "PRÜFE..." : gamesUI.combine}
            </Button>
          ) : (
            <Button size="lg" variant={correct ? "primary" : "secondary"} onClick={handleNext} className="min-w-[200px]">
              {correct && level < VAULT_COMBINATIONS.length - 1 ? gamesUI.next : correct ? t(locale, "common.close") : gamesUI.tryAgain}
            </Button>
          )}
        </CardFooter>
      </div>
    </div>
  );
}