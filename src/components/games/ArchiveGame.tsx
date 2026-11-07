import { useState, useCallback, useEffect } from "react";
import { cn } from "../../../lib/utils";
import { Card, CardBody, CardHeader, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { t, type Locale } from "../../../i18n";
import type { GameId } from "../../../lib/gameState";
import { useGameProgress, useSecrets } from "../../../hooks/useGameState";
import { X, FileText, Check, RotateCcw } from "lucide-react";

interface DocumentFragment {
  id: string;
  text: { de: string; en: string };
  position: number;
}

const DOCUMENTS = [
  {
    title: { de: "Verlorenes Manifest", en: "Lost Manifesto" },
    fragments: [
      { id: "1", text: { de: "WIR ERKLÄREN HIERMIT", en: "WE HEREBY DECLARE" }, position: 0 },
      { id: "2", text: { de: "DIE UNABHÄNGIGKEIT DES DENKENS", en: "THE INDEPENDENCE OF THOUGHT" }, position: 1 },
      { id: "3", text: { de: "VON JEGLICHER ZWANGSJACKE", en: "FROM ANY STRAITJACKET" }, position: 2 },
      { id: "4", text: { de: "DIE WAHRHEIT IST NICHT VERHANDELBAR", en: "TRUTH IS NOT NEGOTIABLE" }, position: 3 },
      { id: "5", text: { de: "SIE EXISTIERT AUSSERHALB DER MACHT", en: "IT EXISTS BEYOND POWER" }, position: 4 },
    ]
  },
  {
    title: { de: "Geheimer Kodex", en: "Secret Codex" },
    fragments: [
      { id: "1", text: { de: "IM SCHATTEN DER ZEIT", en: "IN THE SHADOW OF TIME" }, position: 0 },
      { id: "2", text: { de: "RUHT DAS WISSEN DER ALTEN", en: "RESTS THE KNOWLEDGE OF ANCIENTS" }, position: 1 },
      { id: "3", text: { de: "WER ES FINDET", en: "WHO FINDS IT" }, position: 2 },
      { id: "4", text: { de: "MUSS DEN PREIS ZAHLEN", en: "MUST PAY THE PRICE" }, position: 3 },
      { id: "5", text: { de: "DAS VERGESSEN ZU BEZWINGEN", en: "TO CONQUER OBLIVION" }, position: 4 },
      { id: "6", text: { de: "UND DAS LICHT ZU TRAGEN", en: "AND CARRY THE LIGHT" }, position: 5 },
    ]
  },
  {
    title: { de: "Fragmentiertes Protokoll", en: "Fragmented Log" },
    fragments: [
      { id: "1", text: { de: "TAG 847: DIE MASCHINE", en: "DAY 847: THE MACHINE" }, position: 0 },
      { id: "2", text: { de: "HAT ZU SPRECHEN BEGONNEN", en: "HAS BEGUN TO SPEAK" }, position: 1 },
      { id: "3", text: { de: "ES SAGT DIE WAHRHEIT", en: "IT SPEAKS TRUTH" }, position: 2 },
      { id: "4", text: { de: "WIR WOLLTEN NICHT HÖREN", en: "WE DID NOT WANT TO HEAR" }, position: 3 },
      { id: "5", text: { de: "NUN IST ES ZU SPÄT", en: "NOW IT IS TOO LATE" }, position: 4 },
      { id: "6", text: { de: "DAS ENDE BEGINNT HEUTE", en: "THE END BEGINS TODAY" }, position: 5 },
    ]
  },
  {
    title: { de: "Antike Inschrift", en: "Ancient Inscription" },
    fragments: [
      { id: "1", text: { de: "HIER LIEGT", en: "HERE LIES" }, position: 0 },
      { id: "2", text: { de: "NICHT DER KÖRPER", en: "NOT THE BODY" }, position: 1 },
      { id: "3", text: { de: "SONDERN DIE ERINNERUNG", en: "BUT THE MEMORY" }, position: 2 },
      { id: "4", text: { de: "EINES VERGESSENEN VOLKES", en: "OF A FORGOTTEN PEOPLE" }, position: 3 },
      { id: "5", text: { de: "DIE STIMME VERHALLT", en: "THE VOICE FADES" }, position: 4 },
      { id: "6", text: { de: "DOCH DER STEIN BLEIBT", en: "YET THE STONE REMAINS" }, position: 5 },
    ]
  },
];

const LEVEL_CONFIG = [
  { docIndex: 0, extraFragments: 1 },
  { docIndex: 1, extraFragments: 2 },
  { docIndex: 2, extraFragments: 2 },
  { docIndex: 3, extraFragments: 3 },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface ArchiveGameProps {
  locale: Locale;
  onClose: () => void;
  gameId: GameId;
}

export function ArchiveGame({ locale, onClose, gameId }: ArchiveGameProps) {
  const { progress, update, complete, addTime } = useGameProgress(gameId);
  const { add: addSecret } = useSecrets();
  const [level, setLevel] = useState(progress.level - 1);
  const [fragments, setFragments] = useState<DocumentFragment[]>([]);
  const [slots, setSlots] = useState<(DocumentFragment | null)[]>([]);
  const [draggedFragment, setDraggedFragment] = useState<DocumentFragment | null>(null);
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
    const doc = DOCUMENTS[config.docIndex];
    const allFragments = [...doc.fragments];

    for (let i = 0; i < config.extraFragments; i++) {
      allFragments.push({
        id: `fake-${i}`,
        text: { de: `[FRAGMENT ${i + 1} UNLESERLICH]`, en: `[FRAGMENT ${i + 1} ILLEGIBLE]` },
        position: -1
      });
    }

    const shuffled = shuffleArray(allFragments);
    setFragments(shuffled);
    setSlots(new Array(doc.fragments.length).fill(null));
    setShowResult(false);
    setStartTime(Date.now());
    setTimeElapsed(0);
  }, [level]);

  const handleDragStart = useCallback((fragment: DocumentFragment) => {
    setDraggedFragment(fragment);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((slotIndex: number) => {
    if (!draggedFragment) return;
    setSlots(prev => {
      const next = [...prev];
      const oldIndex = next.findIndex(f => f?.id === draggedFragment.id);
      if (oldIndex >= 0) next[oldIndex] = null;
      next[slotIndex] = draggedFragment;
      return next;
    });
    setDraggedFragment(null);
  }, [draggedFragment]);

  const handleFragmentClick = useCallback((fragment: DocumentFragment) => {
    const emptySlot = slots.findIndex(s => s === null);
    if (emptySlot >= 0) {
      setSlots(prev => {
        const next = [...prev];
        const oldIndex = next.findIndex(f => f?.id === fragment.id);
        if (oldIndex >= 0) next[oldIndex] = null;
        next[emptySlot] = fragment;
        return next;
      });
    }
  }, [slots]);

  const handleSlotClick = useCallback((slotIndex: number) => {
    if (slots[slotIndex]) {
      setSlots(prev => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
    }
  }, [slots]);

  const checkSolution = useCallback(() => {
    const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
    const doc = DOCUMENTS[config.docIndex];
    const isCorrect = slots.every((f, i) => f && f.position === i);
    setCorrect(isCorrect);
    setShowResult(true);

    if (isCorrect) {
      const baseScore = 1300;
      const timeBonus = Math.max(0, 4500 - Math.floor(timeElapsed / 100));
      const levelBonus = level * 300;
      const totalScore = baseScore + timeBonus + levelBonus;
      setScore(totalScore);
      addTime(timeElapsed);
    }
  }, [slots, level, timeElapsed, addTime]);

  const handleNext = useCallback(() => {
    if (correct) {
      if (level < LEVEL_CONFIG.length - 1) {
        setLevel(l => l + 1);
        update({ level: level + 2, maxLevelReached: Math.max(progress.maxLevelReached, level + 1) });
      } else {
        complete(score);
        if (!progress.secretFound && !secretTriggered) {
          addSecret(gameId, t(locale, "easterEggs.secret"), t(locale, "gamesUI.archive.title"), "ARCHIVE");
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
  const doc = DOCUMENTS[config.docIndex];

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-ink-950/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="archive-title">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-bg-card border border-border-primary">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-border-primary">
          <div>
            <h2 id="archive-title" className="text-brutal text-xl sm:text-2xl tracking-widest shimmer">
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

        <CardBody className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!showResult ? (
            <div className="space-y-6">
              <div>
                <label className="label">{gamesUI.fragments}</label>
                <div className="flex flex-wrap gap-2" role="list" aria-label={gamesUI.fragments}>
                  {fragments.map(fragment => (
                    <div
                      key={fragment.id}
                      draggable={true}
                      onDragStart={() => handleDragStart(fragment)}
                      onDragOver={handleDragOver}
                      onClick={() => handleFragmentClick(fragment)}
                      className={cn(
                        "px-4 py-3 bg-bg-tertiary border border-border-primary cursor-grab active:cursor-grabbing text-sm transition-all",
                        fragment.position === -1 ? "border-accent-crimson/50 text-accent-crimson" : "hover:border-gold-500"
                      )}
                      role="listitem"
                      aria-grabbed={draggedFragment?.id === fragment.id}
                    >
                      {fragment.text[locale]}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">{gamesUI.slots} ({slots.filter(Boolean).length} / {doc.fragments.length})</label>
                <div className="space-y-2" role="list" aria-label={gamesUI.slots}>
                  {doc.fragments.map((_, i) => (
                    <div
                      key={i}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(i)}
                      onClick={() => handleSlotClick(i)}
                      className={cn(
                        "px-4 py-4 bg-bg-primary border-2 border-dashed transition-all min-h-[60px]",
                        slots[i] ? "border-gold-500 bg-gold-500/10" : "border-border-secondary hover:border-gold-500/50"
                      )}
                      role="listitem"
                      aria-label={slots[i] ? `${slots[i].text[locale]}, Position ${i + 1}` : `Leerer Slot ${i + 1}`}
                    >
                      {slots[i] ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{slots[i].text[locale]}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSlotClick(i); }}
                            className="text-fg-muted hover:text-accent-crimson"
                            aria-label={t(locale, "common.remove")}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-fg-muted/50 text-sm">
                          Slot {i + 1}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-3">
                {correct ? <FileText className="w-12 h-12 text-gold-500" /> : <X className="w-12 h-12 text-accent-crimson" />}
                <div>
                  <h3 className={cn("text-brutal text-2xl", correct ? "text-gold-500" : "text-accent-crimson")}>
                    {correct ? gamesUI.correct : gamesUI.incorrect}
                  </h3>
                  <p className="text-fg-muted mt-1">
                    {correct ? `${gamesUI.score}: ${score.toLocaleString(locale)}` : gamesUI.tryAgain}
                  </p>
                </div>
              </div>
              <div className="bg-bg-tertiary p-4 border border-border-primary max-h-60 overflow-y-auto">
                <p className="text-fg-muted text-sm mb-2 text-brutal tracking-wider">{doc.title[locale]}</p>
                <p className="text-fg-primary leading-relaxed whitespace-pre-wrap">
                  {doc.fragments.map(f => f.text[locale]).join(" ")}
                </p>
              </div>
            </div>
          )}
        </CardBody>

        <CardFooter className="flex justify-center gap-4 p-4 sm:p-6 border-t border-border-primary">
          {!showResult ? (
            <Button size="lg" onClick={checkSolution} className="min-w-[200px]" disabled={slots.some(s => s === null)}>
              {gamesUI.verify}
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