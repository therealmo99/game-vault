import { useState, useCallback, useEffect } from "react";
import { cn } from "../../../lib/utils";
import { Card, CardBody, CardHeader, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { t, type Locale } from "../../../i18n";
import type { GameId } from "../../../lib/gameState";
import { useGameProgress, useSecrets } from "../../../hooks/useGameState";
import { X, Check, ChevronUp, ChevronDown, Trophy, Lock } from "lucide-react";

interface TimelineEvent {
  id: string;
  year: number;
  title: { de: string; en: string };
  description: { de: string; en: string };
}

const EVENTS: TimelineEvent[] = [
  { id: "1", year: -476, title: { de: "Ende des Weströmischen Reiches", en: "Fall of Western Roman Empire" }, description: { de: "Romulus Augustulus wird abgesetzt.", en: "Romulus Augustulus deposed." } },
  { id: "2", year: 800, title: { de: "Karl der Große wird Kaiser", en: "Charlemagne Crowned Emperor" }, description: { de: "Papst Leo III. krönt ihn in Rom.", en: "Pope Leo III crowns him in Rome." } },
  { id: "3", year: 1066, title: { de: "Schlacht bei Hastings", en: "Battle of Hastings" }, description: { de: "Wilhelm der Eroberer besiegt Harold II.", en: "William the Conqueror defeats Harold II." } },
  { id: "4", year: 1215, title: { de: "Magna Carta", en: "Magna Carta" }, description: { de: "König Johann unterzeichnet in Runnymede.", en: "King John signs at Runnymede." } },
  { id: "5", year: 1453, title: { de: "Fall von Konstantinopel", en: "Fall of Constantinople" }, description: { de: "Osmanen erobern die Stadt.", en: "Ottomans conquer the city." } },
  { id: "6", year: 1492, title: { de: "Kolumbus erreicht Amerika", en: "Columbus Reaches America" }, description: { de: "Entdeckung der Neuen Welt.", en: "Discovery of the New World." } },
  { id: "7", year: 1517, title: { de: "Luthers Thesenanschlag", en: "Luther's 95 Theses" }, description: { de: "Beginn der Reformation.", en: "Start of the Reformation." } },
  { id: "8", year: 1648, title: { de: "Westfälischer Friede", en: "Peace of Westphalia" }, description: { de: "Ende des Dreißigjährigen Krieges.", en: "End of Thirty Years' War." } },
  { id: "9", year: 1789, title: { de: "Französische Revolution", en: "French Revolution" }, description: { de: "Sturm auf die Bastille.", en: "Storming of the Bastille." } },
  { id: "10", year: 1815, title: { de: "Schlacht bei Waterloo", en: "Battle of Waterloo" }, description: { de: "Napoleons endgültige Niederlage.", en: "Napoleon's final defeat." } },
  { id: "11", year: 1914, title: { de: "Beginn des Ersten Weltkriegs", en: "WWI Begins" }, description: { de: "Attentat in Sarajevo löst Krieg aus.", en: "Assassination in Sarajevo triggers war." } },
  { id: "12", year: 1945, title: { de: "Ende des Zweiten Weltkriegs", en: "WWII Ends" }, description: { de: "Kapitulation Deutschlands und Japans.", en: "Germany and Japan surrender." } },
  { id: "13", year: 1969, title: { de: "Mondlandung Apollo 11", en: "Apollo 11 Moon Landing" }, description: { de: "Neil Armstrong betritt den Mond.", en: "Neil Armstrong walks on Moon." } },
  { id: "14", year: 1989, title: { de: "Fall der Berliner Mauer", en: "Fall of Berlin Wall" }, description: { de: "Symbol für Ende des Kalten Krieges.", en: "Symbol of Cold War's end." } },
  { id: "15", year: 2001, title: { de: "Anschläge vom 11. September", en: "9/11 Attacks" }, description: { de: "Terroranschläge in den USA.", en: "Terror attacks in the USA." } },
];

const LEVEL_CONFIG = [
  { count: 4, timeBonus: 5000 },
  { count: 5, timeBonus: 4000 },
  { count: 6, timeBonus: 3000 },
  { count: 7, timeBonus: 2000 },
  { count: 8, timeBonus: 1000 },
];

interface ChronicleGameProps {
  locale: Locale;
  onClose: () => void;
  gameId: GameId;
}

export function ChronicleGame({ locale, onClose, gameId }: ChronicleGameProps) {
  const { progress, update, complete, addTime } = useGameProgress(gameId);
  const { add: addSecret } = useSecrets();
  const [level, setLevel] = useState(progress.level - 1);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
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
    const shuffled = [...EVENTS].sort(() => Math.random() - 0.5).slice(0, config.count);
    const scrambled = [...shuffled].sort(() => Math.random() - 0.5);
    setEvents(scrambled);
    setStartTime(Date.now());
    setTimeElapsed(0);
    setSelectedId(null);
    setShowResult(false);
  }, [level]);

  const handleDragStart = useCallback((id: string) => setDraggedId(id), []);
  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);
  const handleDrop = useCallback((targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    setEvents(prev => {
      const fromIdx = prev.findIndex(e => e.id === draggedId);
      const toIdx = prev.findIndex(e => e.id === targetId);
      const next = [...prev];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return next;
    });
    setDraggedId(null);
  }, [draggedId]);

  const checkOrder = useCallback(() => {
    const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
    const isCorrect = events.every((e, i) => e.year === config.count > 0 ? EVENTS.find(ev => ev.id === e.id)?.year : 0);
    const sortedEvents = [...events].sort((a, b) => {
      const aYear = EVENTS.find(ev => ev.id === a.id)?.year ?? 0;
      const bYear = EVENTS.find(ev => ev.id === b.id)?.year ?? 0;
      return aYear - bYear;
    });
    const isCorrectOrder = events.every((e, i) => e.id === sortedEvents[i].id);

    setCorrect(isCorrectOrder);
    setShowResult(true);

    if (isCorrectOrder) {
      const baseScore = 1000;
      const timeBonus = Math.max(0, config.timeBonus - Math.floor(timeElapsed / 100));
      const levelBonus = level * 200;
      const totalScore = baseScore + timeBonus + levelBonus;
      setScore(totalScore);
      addTime(timeElapsed);
    }
  }, [events, level, timeElapsed, addTime]);

  const handleNext = useCallback(() => {
    if (correct) {
      if (level < LEVEL_CONFIG.length - 1) {
        setLevel(l => l + 1);
        update({ level: level + 2, maxLevelReached: Math.max(progress.maxLevelReached, level + 1) });
      } else {
        complete(score);
        if (!progress.secretFound && !secretTriggered) {
          addSecret(gameId, t(locale, "easterEggs.secret"), t(locale, "gamesUI.chronicle.title"), "CHRONICLE");
          setSecretTriggered(true);
        }
      }
    } else {
      update({ attempts: progress.attempts + 1 });
    }
    setShowResult(false);
  }, [correct, level, score, progress, update, complete, gameId, locale, addSecret, secretTriggered]);

  const gamesUI = t(locale, `gamesUI.${gameId}`);

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-ink-950/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="chronicle-title">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-bg-card border border-border-primary">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-border-primary">
          <div>
            <h2 id="chronicle-title" className="text-brutal text-xl sm:text-2xl tracking-widest shimmer">
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
            <div className="space-y-3" role="list" aria-label={t(locale, "gamesUI.chronicle.instruction")}>
              {events.map((event, index) => {
                const originalEvent = EVENTS.find(e => e.id === event.id);
                const isSelected = selectedId === event.id;
                return (
                  <div
                    key={event.id}
                    draggable={true}
                    onDragStart={() => handleDragStart(event.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(event.id)}
                    onClick={() => setSelectedId(event.id)}
                    className={cn(
                      "relative flex items-center gap-4 p-4 bg-bg-tertiary border border-border-primary cursor-grab active:cursor-grabbing transition-all",
                      isSelected && "border-gold-500 bg-gold-500/10",
                      draggedId === event.id && "opacity-50 rotate-2 scale-102"
                    )}
                    role="listitem"
                    aria-grabbed={draggedId === event.id}
                    aria-selected={isSelected}
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-bg-primary border border-border-secondary text-fg-muted text-sm font-mono">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-brutal text-xs tracking-wider text-gold-500 font-mono whitespace-nowrap">
                          {originalEvent?.year > 0 ? originalEvent.year : `${Math.abs(originalEvent?.year ?? 0)} v. Chr.`}
                        </span>
                        <h3 className="text-fg-primary font-medium truncate">{originalEvent?.title[locale]}</h3>
                      </div>
                      <p className="text-fg-muted text-sm truncate">{originalEvent?.description[locale]}</p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-gold-500" aria-hidden="true" />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-3">
                {correct ? (
                  <Trophy className="w-12 h-12 text-gold-500" aria-hidden="true" />
                ) : (
                  <Lock className="w-12 h-12 text-accent-crimson" aria-hidden="true" />
                )}
                <div>
                  <h3 className={cn("text-brutal text-2xl", correct ? "text-gold-500" : "text-accent-crimson")}>
                    {correct ? gamesUI.correct : gamesUI.incorrect}
                  </h3>
                  <p className="text-fg-muted mt-1">
                    {correct
                      ? `${gamesUI.score}: ${score.toLocaleString(locale)} (+${level * 200} Level-Bonus)`
                      : gamesUI.tryAgain}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-bg-tertiary p-4 rounded-none border border-border-primary">
                  <div className="text-fg-muted">{t(locale, "common.time")}</div>
                  <div className="text-brutal text-lg text-gold-500 font-mono">
                    {Math.floor(timeElapsed / 60000)}:{String(Math.floor((timeElapsed % 60000) / 1000)).padStart(2, "0")}
                  </div>
                </div>
                <div className="bg-bg-tertiary p-4 rounded-none border border-border-primary">
                  <div className="text-fg-muted">{gamesUI.level}</div>
                  <div className="text-brutal text-lg text-gold-500 font-mono">{level + 1} / {LEVEL_CONFIG.length}</div>
                </div>
              </div>
            </div>
          )}
        </CardBody>

        <CardFooter className="flex justify-center gap-4 p-4 sm:p-6 border-t border-border-primary">
          {!showResult ? (
            <Button size="lg" onClick={checkOrder} className="min-w-[200px]">
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