"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "../lib/utils";
import { Card, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { t, type Locale } from "../i18n";
import { useVaultState } from "../hooks/useGameState";
import { Zap, Code, MousePointer, Clock, Route, Eye, Check, X, ChevronDown, ChevronUp, Terminal } from "lucide-react";

const KONAMI_CODE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "KeyB", "KeyA"
];

const CLICK_PATTERNS = [
  { name: { de: "Dreifach-Klick", en: "Triple Click" }, pattern: ["click", "click", "click"], maxInterval: 500 },
  { name: { de: "Rechts-Links-Rechts", en: "Right-Left-Right" }, pattern: ["right", "left", "right"], maxInterval: 800 },
];

const SECRET_ROUTES = ["/void", "/admin", "/debug", "/source", "/hidden", "/backdoor", "/konami", "/vault-7"];

interface EasterEggsProps {
  locale: Locale;
}

export function EasterEggs({ locale }: EasterEggsProps) {
  const { state, setState } = useVaultState();
  const [inView, setInView] = useState(false);
  const [konamiIndex, setKonamiIndex] = useState(0);
  const [clickSequence, setClickSequence] = useState<string[]>([]);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Track if ANY easter egg was found to show the hidden panel trigger
  const anyFound = state.easterEggs.konamiActivated ||
    state.easterEggs.devtoolsDetected ||
    state.easterEggs.clickPatterns.length > 0 ||
    state.easterEggs.secretRoutesFound.length > 0 ||
    state.easterEggs.timeBasedFound.length > 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1, rootMargin: "50px" }
    );
    const el = document.getElementById("eastereggs-section");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const easterEggs = t(locale, "easterEggs");
  const common = t(locale, "common");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === KONAMI_CODE[konamiIndex]) {
        setKonamiIndex(prev => prev + 1);
      } else {
        setKonamiIndex(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [konamiIndex]);

  useEffect(() => {
    if (konamiIndex === KONAMI_CODE.length) {
      if (!state.easterEggs.konamiActivated) {
        setState(prev => ({
          ...prev,
          easterEggs: { ...prev.easterEggs, konamiActivated: true, konamiActivatedAt: Date.now() }
        }));
        alert(easterEggs.konami);
      }
      setKonamiIndex(0);
    }
  }, [konamiIndex, state.easterEggs.konamiActivated, setState, easterEggs.konami, locale]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    const isRightClick = e.button === 2;
    const clickType = isRightClick ? "right" : "click";

    if (now - lastClickTime > 1000) {
      setClickSequence([clickType]);
    } else {
      setClickSequence(prev => [...prev.slice(-2), clickType]);
    }
    setLastClickTime(now);

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => setClickSequence([]), 1000);

    CLICK_PATTERNS.forEach(pattern => {
      const seq = clickSequence.slice(-pattern.pattern.length);
      if (seq.join(",") === pattern.pattern.join(",")) {
        if (!state.easterEggs.clickPatterns.includes(pattern.name[locale])) {
          setState(prev => ({
            ...prev,
            easterEggs: {
              ...prev.easterEggs,
              clickPatterns: [...prev.easterEggs.clickPatterns, pattern.name[locale]]
            }
          }));
          alert(`${easterEggs.clickPattern}: ${pattern.name[locale]}`);
        }
      }
    });
  }, [lastClickTime, clickSequence, state.easterEggs.clickPatterns, setState, locale, easterEggs.clickPattern]);

  useEffect(() => {
    const checkDevTools = () => {
      const threshold = 160;
      if (window.outerWidth - window.innerWidth > threshold ||
          window.outerHeight - window.innerHeight > threshold) {
        if (!state.easterEggs.devtoolsDetected) {
          setState(prev => ({
            ...prev,
            easterEggs: { ...prev.easterEggs, devtoolsDetected: true, devtoolsDetectedAt: Date.now() }
          }));
          console.log('%c🛠 DEVTOOLS DETECTED', 'color: #d49630; font-size: 16px; font-weight: bold;');
        }
      }
    };
    const interval = setInterval(checkDevTools, 1000);
    return () => clearInterval(interval);
  }, [state.easterEggs.devtoolsDetected, setState]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (SECRET_ROUTES.includes("/" + hash) && !state.easterEggs.secretRoutesFound.includes("/" + hash)) {
        setState(prev => ({
          ...prev,
          easterEggs: {
            ...prev.easterEggs,
            secretRoutesFound: [...prev.easterEggs.secretRoutesFound, "/" + hash]
          }
        }));
        alert(`${easterEggs.secretRoute}: /${hash}`);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [state.easterEggs.secretRoutesFound, setState, easterEggs.secretRoute]);

  const easterEggList = [
    {
      id: "konami",
      icon: Code,
      title: easterEggs.konami,
      description: { de: "Der klassische Cheat-Code: ↑↑↓↓←→←→BA", en: "The classic cheat code: ↑↑↓↓←→←→BA" },
      found: state.easterEggs.konamiActivated,
      foundAt: state.easterEggs.konamiActivatedAt,
    },
    {
      id: "devtools",
      icon: Zap,
      title: easterEggs.devtools,
      description: { de: "DevTools geöffnet? Wir sehen alles.", en: "DevTools opened? We see everything." },
      found: state.easterEggs.devtoolsDetected,
      foundAt: state.easterEggs.devtoolsDetectedAt,
    },
    {
      id: "clickPatterns",
      icon: MousePointer,
      title: easterEggs.clickPattern,
      description: { de: "Spezielle Klick-Muster auf der Seite entdecken.", en: "Discover special click patterns on the page." },
      found: state.easterEggs.clickPatterns.length > 0,
      foundAt: state.easterEggs.clickPatterns.length > 0 ? Date.now() : null,
      subItems: state.easterEggs.clickPatterns,
    },
    {
      id: "secretRoutes",
      icon: Route,
      title: easterEggs.secretRoute,
      description: { de: "Versteckte URL-Pfade erkunden (z.B. /void, /admin, /konami).", en: "Explore hidden URL paths (e.g. /void, /admin, /konami)." },
      found: state.easterEggs.secretRoutesFound.length > 0,
      foundAt: state.easterEggs.secretRoutesFound.length > 0 ? Date.now() : null,
      subItems: state.easterEggs.secretRoutesFound,
    },
    {
      id: "timeBased",
      icon: Clock,
      title: easterEggs.timeBased,
      description: { de: "Besuche die Seite zu besonderen Zeiten (Mitternacht, Vollmond, ...).", en: "Visit the page at special times (midnight, full moon, ...)." },
      found: state.easterEggs.timeBasedFound.length > 0,
      foundAt: state.easterEggs.timeBasedFound.length > 0 ? Date.now() : null,
      subItems: state.easterEggs.timeBasedFound,
    },
  ];

  // Hidden trigger - only shows in footer area if any egg found
  const triggerLabel = locale === "de" ? "🥚 Logs anzeigen" : "🥚 Show Logs";

  return (
    <>
      {/* Hidden listeners attached to body via EasterEggs section */}
      <section
        id="eastereggs-section"
        className="hidden"
        onClick={handleClick}
        onContextMenu={handleClick}
        aria-hidden="true"
      />

      {/* Subtle footer trigger - only appears after first discovery */}
      {anyFound && (
        <div className="fixed bottom-6 right-6 z-toast" aria-hidden="true">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPanel(true)}
            className="group flex items-center gap-2 px-4 py-2 bg-ink-950/90 backdrop-blur-sm border border-gold-500/30 hover:border-gold-500 hover:bg-gold-500/10 transition-all"
            aria-label={triggerLabel}
          >
            <Terminal className="w-4 h-4 text-gold-500" aria-hidden="true" />
            <span className="text-brutal text-xs tracking-widest text-gold-500">{triggerLabel}</span>
            <ChevronUp className="w-4 h-4 text-gold-500" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Hidden Panel - only visible when triggered */}
      {showPanel && (
        <div className="fixed inset-0 z-modal flex items-end justify-center p-4 bg-ink-950/95 backdrop-blur-sm" onClick={() => setShowPanel(false)} role="dialog" aria-modal="true" aria-labelledby="easteregg-panel-title">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-bg-card border border-gold-500/30" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border-primary">
              <div className="flex items-center gap-3">
                <Terminal className="w-6 h-6 text-gold-500" aria-hidden="true" />
                <h2 id="easteregg-panel-title" className="text-brutal text-xl tracking-widest shimmer">EASTER EGG LOG</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowPanel(false)} aria-label={common.close}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <CardBody className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4 font-mono text-sm">
                {easterEggList.map((egg, i) => (
                  <div
                    key={egg.id}
                    className={cn(
                      "p-4 border border-border-primary bg-bg-tertiary transition-all",
                      egg.found ? "border-gold-500/50 bg-gold-500/5" : "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <egg.icon className={cn("w-5 h-5 flex-shrink-0", egg.found ? "text-gold-500" : "text-fg-muted")} aria-hidden="true" />
                        <div>
                          <p className={cn("text-brutal text-xs tracking-wider", egg.found ? "text-gold-500" : "text-fg-muted")}>
                            {egg.title}
                          </p>
                          <p className="text-fg-muted/70 text-xs">{egg.description[locale]}</p>
                        </div>
                      </div>
                      {egg.found && (
                        <Badge variant="gold">
                          <Check className="w-3 h-3 mr-1" /> {common.found || "FOUND"}
                        </Badge>
                      )}
                    </div>
                    {egg.found && egg.subItems && egg.subItems.length > 0 && (
                      <div className="ml-8 mt-2 space-y-1 border-l border-gold-500/30 pl-3">
                        {egg.subItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gold-500">
                            <Check className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                            <span className="font-mono">{item}</span>
                            {egg.foundAt && idx === 0 && (
                              <span className="text-fg-muted/50 ml-auto">
                                {new Date(egg.foundAt).toLocaleString(locale)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {!anyFound && (
                  <div className="text-center py-8 text-fg-muted/50">
                    <p className="text-brutal text-xs tracking-widest mb-2">KEINE ENTDECKUNGEN</p>
                    <p className="text-sm">Konami-Code, DevTools, Klick-Muster, geheime Routen, besondere Zeiten…</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}