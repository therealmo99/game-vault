import { useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "../../../lib/utils";
import { Card, CardBody, CardHeader, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { t, type Locale } from "../../../i18n";
import type { GameId } from "../../../lib/gameState";
import { useGameProgress, useSecrets } from "../../../hooks/useGameState";
import { X, Check, Key, Copy } from "lucide-react";

const CIPHER_TEXTS = [
  { de: "DIE ZEIT VERGEHT WIE EIN PFIEL", en: "TIME FLIES LIKE AN ARROW" },
  { de: "WISSEN IST MACHT UND MACHT IST WISSEN", en: "KNOWLEDGE IS POWER AND POWER IS KNOWLEDGE" },
  { de: "DER WEG IST DAS ZIEL SELBST", en: "THE JOURNEY IS THE DESTINATION" },
  { de: "IM ANFANG WAR DAS WORT", en: "IN THE BEGINNING WAS THE WORD" },
  { de: "ALLES FLIESST NICHTS BLEIBT", en: "EVERYTHING FLOWS NOTHING STAYS" },
  { de: "NUR DIE HÄRTESTEN ÜBERLEBEN", en: "ONLY THE STRONGEST SURVIVE" },
  { de: "ORDNUNG IST DAS HALBE LEBEN", en: "ORDER IS HALF OF LIFE" },
  { de: "DIE WAHRHEIT LIEGT IM DUNKELN", en: "THE TRUTH LIES IN DARKNESS" },
];

const LEVEL_CONFIG = [
  { shift: 3, hintLetters: 2 },
  { shift: 5, hintLetters: 1 },
  { shift: 7, hintLetters: 1 },
  { shift: 11, hintLetters: 0 },
  { shift: 13, hintLetters: 0 },
];

function caesarCipher(text: string, shift: number): string {
  return text.toUpperCase().split("").map(c => {
    if (c >= "A" && c <= "Z") {
      return String.fromCharCode((c.charCodeAt(0) - 65 + shift) % 26 + 65);
    }
    if (c >= "a" && c <= "z") {
      return String.fromCharCode((c.charCodeAt(0) - 97 + shift) % 26 + 97);
    }
    return c;
  }).join("");
}

function getFrequency(text: string): Record<string, number> {
  const freq: Record<string, number> = {};
  text.toUpperCase().split("").forEach(c => {
    if (c >= "A" && c <= "Z") freq[c] = (freq[c] || 0) + 1;
  });
  return freq;
}

interface CipherGameProps {
  locale: Locale;
  onClose: () => void;
  gameId: GameId;
}

export function CipherGame({ locale, onClose, gameId }: CipherGameProps) {
  const { progress, update, complete, addTime } = useGameProgress(gameId);
  const { add: addSecret } = useSecrets();
  const [level, setLevel] = useState(progress.level - 1);
  const [currentText, setCurrentText] = useState("");
  const [encryptedText, setEncryptedText] = useState("");
  const [userMapping, setUserMapping] = useState<Record<string, string>>({});
  const [userInput, setUserInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerId, setTimerId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [secretTriggered, setSecretTriggered] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTimeElapsed(Date.now() - startTime), 100);
    setTimerId(id);
    return () => clearInterval(id);
  }, [startTime]);

  useEffect(() => {
    const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
    const textObj = CIPHER_TEXTS[level % CIPHER_TEXTS.length];
    const plain = textObj[locale];
    const encrypted = caesarCipher(plain, config.shift);
    setCurrentText(plain);
    setEncryptedText(encrypted);
    setUserMapping({});
    setUserInput("");
    setStartTime(Date.now());
    setTimeElapsed(0);
    setShowResult(false);
  }, [level, locale]);

  const frequency = useMemo(() => getFrequency(encryptedText), [encryptedText]);
  const sortedFreq = useMemo(() =>
    Object.entries(frequency).sort((a, b) => b[1] - a[1]).map(([char]) => char),
    [frequency]
  );

  const handleMappingChange = useCallback((encrypted: string, plain: string) => {
    setUserMapping(prev => ({ ...prev, [encrypted]: plain.toUpperCase() }));
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value.toUpperCase());
  }, []);

  const checkSolution = useCallback(() => {
    const isCorrect = userInput.replace(/\s+/g, "") === currentText.replace(/\s+/g, "").toUpperCase();
    setCorrect(isCorrect);
    setShowResult(true);

    if (isCorrect) {
      const baseScore = 1500;
      const timeBonus = Math.max(0, 5000 - Math.floor(timeElapsed / 100));
      const levelBonus = level * 300;
      const totalScore = baseScore + timeBonus + levelBonus;
      setScore(totalScore);
      addTime(timeElapsed);
    }
  }, [userInput, currentText, level, timeElapsed, addTime]);

  const handleNext = useCallback(() => {
    if (correct) {
      if (level < LEVEL_CONFIG.length - 1) {
        setLevel(l => l + 1);
        update({ level: level + 2, maxLevelReached: Math.max(progress.maxLevelReached, level + 1) });
      } else {
        complete(score);
        if (!progress.secretFound && !secretTriggered) {
          addSecret(gameId, t(locale, "easterEggs.secret"), t(locale, "gamesUI.cipher.title"), "CIPHER");
          setSecretTriggered(true);
        }
      }
    } else {
      update({ attempts: progress.attempts + 1 });
    }
    setShowResult(false);
  }, [correct, level, score, progress, update, complete, gameId, locale, addSecret, secretTriggered]);

  const gamesUI = t(locale, `gamesUI.${gameId}`);

  const decryptedDisplay = encryptedText.split("").map(c => {
    if (c === " ") return <span key={`space-${c}`} className="w-2" />;
    const mapped = userMapping[c];
    return (
      <span key={c} className={cn("w-8 h-10 flex items-center justify-center bg-bg-tertiary border border-border-primary text-center font-mono text-base", mapped && "border-gold-500 bg-gold-500/10")}>
        {mapped || <span className="text-fg-muted">?</span>}
      </span>
    );
  });

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-ink-950/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cipher-title">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-bg-card border border-border-primary">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-border-primary">
          <div>
            <h2 id="cipher-title" className="text-brutal text-xl sm:text-2xl tracking-widest shimmer">
              {gamesUI.title}
            </h2>
            <p className="text-fg-muted text-sm mt-1">{gamesUI.instruction}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="gold">{gamesUI.level} {level + 1} / {LEVEL_CONFIG.length}</Badge>
            <Badge variant={progress.status === "completed" ? "complete" : "locked"}>{gamesUI.score}: {progress.bestScore.toLocaleString(locale)}</Badge>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={t(locale, "common.close")}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardBody className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!showResult ? (
            <div className="space-y-6">
              <div>
                <label className="label">{gamesUI.frequency}</label>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(frequency).sort((a, b) => b[1] - a[1]).map(([char, count]) => (
                    <span key={char} className="px-2 py-1 bg-bg-tertiary border border-border-primary text-xs font-mono">
                      {char}: {count}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">{gamesUI.mapping}</label>
                <div className="flex flex-wrap gap-1" role="list" aria-label={gamesUI.mapping}>
                  {encryptedText.split("").map((c, i) => {
                    if (c === " ") return <span key={`space-${i}`} className="w-2" />;
                    const mapped = userMapping[c];
                    return (
                      <button
                        key={`${c}-${i}`}
                        onClick={() => {
                          const replacement = prompt(`${gamesUI.frequency}: "${c}" → ?`);
                          if (replacement && replacement.length === 1) handleMappingChange(c, replacement);
                        }}
                        className={cn("w-10 h-12 flex items-center justify-center bg-bg-tertiary border border-border-primary text-center font-mono text-base transition-all", mapped && "border-gold-500 bg-gold-500/10")}
                        aria-label={`${c} → ${mapped || "unbekannt"}`}
                      >
                        {mapped || <span className="text-fg-muted">?</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label">{t(locale, "common.submit")}</label>
                <Input
                  value={userInput}
                  onChange={handleInputChange}
                  placeholder={t(locale, "gamesUI.cipher.instruction")}
                  className="font-mono text-lg tracking-wider"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-3">
                {correct ? <Key className="w-12 h-12 text-gold-500" /> : <X className="w-12 h-12 text-accent-crimson" />}
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
                <p className="text-fg-muted text-sm mb-2">{t(locale, "gamesUI.cipher.title")}:</p>
                <p className="font-mono text-lg tracking-wider shimmer">{currentText}</p>
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