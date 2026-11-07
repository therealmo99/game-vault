import { useState, useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { t, type Locale } from "../i18n";
import type { GameId } from "../lib/gameState";
import { useVaultState } from "../hooks/useGameState";
import { Check, Download, Upload, Trash2, AlertTriangle, Clock, Trophy, Key, Lock, Volume2, Music, Zap, Minus, Circle } from "lucide-react";

const GAME_ORDER: GameId[] = ["chronicle", "cipher", "constellation", "archive", "resonance", "palimpsest", "vault"];

interface ProgressProps {
  locale: Locale;
}

export function Progress({ locale }: ProgressProps) {
  const { state, setState } = useVaultState();
  const [inView, setInView] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [exportData, setExportData] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1, rootMargin: "50px" }
    );
    const el = document.getElementById("progress-section");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const progress = t(locale, "progress");
  const gamesUI = t(locale, "gamesUI");
  const common = t(locale, "common");

  const handleExport = () => {
    const data = btoa(JSON.stringify(state));
    setExportData(data);
    navigator.clipboard.writeText(data);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(atob(event.target?.result as string));
        setState(prev => ({ ...prev, ...imported }));
        alert(common.confirm);
      } catch {
        alert(common.error);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setState(() => {
      const newState = { ...state, games: {}, secrets: [], totalTimePlayed: 0, firstVisit: Date.now(), lastVisit: Date.now() };
      return newState;
    });
    setShowResetConfirm(false);
  };

  return (
    <section
      id="progress-section"
      className="py-16 lg:py-24 relative noise-overlay"
      aria-labelledby="progress-title"
    >
      <div className="container">
        <div className={cn("text-center mb-12 lg:mb-16", inView ? "animate-fade-in" : "opacity-0")}>
          <span className="text-brutal text-xs tracking-widest text-gold-500 mb-4 block">
            {progress.title}
          </span>
          <h2 id="progress-title" className="display-2 lg:display-3 text-balance mb-4">
            {progress.title}
          </h2>
          <div className="rule-gold-center mb-6" aria-hidden="true" />
          <p className="text-fg-secondary text-lg max-w-2xl mx-auto text-pretty">
            {progress.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12" role="status" aria-live="polite">
          {[
            { label: progress.totalProgress, value: `${Object.values(state.games).filter(g => g.status === "completed").length * 100 / 7}%`, icon: Trophy, color: "text-gold-500" },
            { label: progress.gamesCompleted, value: `${Object.values(state.games).filter(g => g.status === "completed").length} / 7`, icon: Check, color: "text-accent-emerald" },
            { label: progress.secretsFound, value: `${state.secrets.length} / 7`, icon: Key, color: "text-gold-500" },
            { label: progress.timePlayed, value: `${Math.floor(state.totalTimePlayed / 60000)}m ${Math.floor((state.totalTimePlayed % 60000) / 1000)}s`, icon: Clock, color: "text-accent-cobalt" },
          ].map((stat, i) => (
            <Card key={i} className={cn("text-center", inView ? "stagger" : "opacity-0")} style={{ transitionDelay: `${i * 100}ms` }}>
              <CardBody className="py-8">
                <stat.icon className={cn("w-10 h-10 mx-auto mb-4", stat.color)} aria-hidden="true" />
                <div className="display-3 font-extrabold tracking-widest">{stat.value}</div>
                <span className="text-brutal text-xs tracking-widest text-fg-muted mt-2 block">{stat.label}</span>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className={cn(inView ? "stagger" : "opacity-0")} style={{ transitionDelay: "400ms" }}>
            <CardHeader>
              <h3 className="text-brutal text-lg tracking-wider">{progress.gamesCompleted}</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {GAME_ORDER.map((gameId) => {
                const gameProgress = state.games[gameId];
                const gameUI = gamesUI[gameId] || { title: gameId.toUpperCase() };
                const statusConfig = {
                  locked: { label: t(locale, "games.locked"), variant: "locked" as const, icon: Lock },
                  unlocked: { label: t(locale, "games.unlocked"), variant: "gold" as const, icon: null },
                  completed: { label: t(locale, "games.completed"), variant: "complete" as const, icon: Check },
                };
                const config = statusConfig[gameProgress.status];

                return (
                  <div key={gameId} className="flex items-center justify-between p-3 bg-bg-tertiary border border-border-primary">
                    <div className="flex items-center gap-3">
                      {config.icon && <config.icon className="w-5 h-5 text-fg-muted" aria-hidden="true" />}
                      <div>
                        <p className="text-brutal text-sm tracking-wider">{gameUI.title}</p>
                        <p className="text-fg-muted text-xs">{Math.floor(gameProgress.timePlayed / 60000)}m • {gameProgress.attempts} Versuche</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant}>{config.label}</Badge>
                      {gameProgress.secretFound && (
                        <Badge variant="secret"><Key className="w-3 h-3 mr-1" /> {t(locale, "games.secret")}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <Card className={cn(inView ? "stagger" : "opacity-0")} style={{ transitionDelay: "500ms" }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-brutal text-lg tracking-wider">{t(locale, "common.settings")}</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <label className="label">{t(locale, "common.language")}</label>
                <div className="flex gap-2">
                  {["de", "en"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setState(prev => ({ ...prev, settings: { ...prev.settings, language: lang as "de" | "en" } }))}
                      className={cn(
                        "flex-1 px-4 py-3 text-brutal text-sm tracking-wider uppercase transition-all",
                        state.settings.language === lang
                          ? "bg-gold-500 text-ink-950 border-gold-500"
                          : "bg-bg-tertiary border-border-primary hover:border-gold-500"
                      )}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: "soundEnabled", label: t(locale, "common.sound"), icon: Volume2 },
                  { key: "musicEnabled", label: t(locale, "common.music"), icon: Music },
                  { key: "effectsEnabled", label: t(locale, "common.effects"), icon: Zap },
                  { key: "reducedMotion", label: "Reduzierte Animationen", icon: Minus },
                  { key: "highContrast", label: "Hoher Kontrast", icon: Circle },
                ].map(({ key, label, icon: Icon }) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">{label}</span>
                    <input
                      type="checkbox"
                      checked={state.settings[key as keyof typeof state.settings]}
                      onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, [key]: e.target.checked } }))}
                      className="w-5 h-5 accent-gold-500"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-4 border-t border-border-primary space-y-3">
                <h4 className="text-brutal text-xs tracking-widest text-fg-secondary">{t(locale, "common.data")}</h4>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleExport} className="flex-1">
                    <Download className="w-4 h-4 mr-1" /> {progress.export}
                  </Button>
                  <input type="file" accept=".txt" onChange={handleImport} className="hidden" ref={fileInputRef} />
                  <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1">
                    <Upload className="w-4 h-4 mr-1" /> {progress.import}
                  </Button>
                </div>
                <Button variant="danger" size="sm" className="w-full" onClick={() => setShowResetConfirm(true)}>
                  <Trash2 className="w-4 h-4 mr-1" /> {progress.reset}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {showResetConfirm && (
          <div className="fixed inset-0 z-toast flex items-center justify-center p-4 bg-ink-950/95 backdrop-blur-sm">
            <Card className="w-full max-w-md">
              <CardBody className="p-6 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 mx-auto text-accent-crimson" />
                <h3 className="text-brutal text-xl">{common.confirm}</h3>
                <p className="text-fg-muted">{progress.resetConfirm}</p>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setShowResetConfirm(false)} className="flex-1">{common.cancel}</Button>
                  <Button variant="danger" onClick={handleReset} className="flex-1">{common.yes}</Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}