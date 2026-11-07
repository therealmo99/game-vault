"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "../lib/utils";
import { Card, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { t, type Locale } from "../i18n";
import { useVaultState } from "../hooks/useGameState";
import { Zap, Code, MousePointer, Clock, Route, Eye, Check } from "lucide-react";

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
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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

  return (
    <section
      id="eastereggs-section"
      className="py-16 lg:py-24 relative noise-overlay"
      aria-labelledby="eastereggs-title"
      onClick={handleClick}
      onContextMenu={handleClick}
    >
      <div className="container">
        <div className={cn("text-center mb-12 lg:mb-16", inView ? "animate-fade-in" : "opacity-0")}>
          <span className="text-brutal text-xs tracking-widest text-gold-500 mb-4 block">
            🥚 EASTER EGGS
          </span>
          <h2 id="eastereggs-title" className="display-2 lg:display-3 text-balance mb-4">
            EASTER EGGS
          </h2>
          <div className="rule-gold-center mb-6" aria-hidden="true" />
          <p className="text-fg-secondary text-lg max-w-2xl mx-auto text-pretty">
            Versteckte Features, die nur die Neugierigsten finden. Bist du einer von ihnen?
          </p>
        </div>

        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
            inView ? "stagger" : "opacity-0"
          )}
          role="list"
          aria-label="Easter Eggs"
        >
          {easterEggList.map((egg, i) => (
            <Card
              key={egg.id}
              className={cn(
                "group relative overflow-hidden",
                egg.found && "border-gold-500/50"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {egg.found && (
                  <Badge variant="gold">
                    <Check className="w-3 h-3 mr-1" /> {common.found || "GEFUNDEN"}
                  </Badge>
                )}
              </div>
              <CardBody className="relative p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-bg-tertiary border border-border-primary">
                    <egg.icon className={cn("w-6 h-6", egg.found ? "text-gold-500" : "text-fg-muted")} aria-hidden="true" />
                  </div>
                  <h3 className={cn("text-brutal text-lg tracking-wider flex-1", egg.found ? "text-fg-primary" : "text-fg-muted")}>
                    {egg.title}
                  </h3>
                </div>

                <p className="text-fg-muted text-sm leading-relaxed mb-4 flex-1">
                  {egg.description[locale]}
                </p>

                {egg.found && egg.foundAt && (
                  <div className="flex items-center gap-2 text-xs text-gold-500 mb-4">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    <span>Gefunden: {new Date(egg.foundAt).toLocaleString(locale)}</span>
                  </div>
                )}

                {egg.subItems && egg.subItems.length > 0 && (
                  <div className="mt-auto space-y-1">
                    {egg.subItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-fg-secondary bg-bg-tertiary p-2 border border-border-primary">
                        <Check className="w-3 h-3 text-gold-500" aria-hidden="true" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center" aria-hidden="true">
          <div className="rule-gold-center mb-8" />
          <p className="text-brutal text-xs tracking-widest text-fg-muted">
            {state.easterEggs.konamiActivated && "🎮 Konami aktiv  • "}
            {state.easterEggs.devtoolsDetected && "🛠 DevTools erkannt  • "}
            {state.easterEggs.clickPatterns.length > 0 && `${state.easterEggs.clickPatterns.length} Klick-Muster  • `}
            {state.easterEggs.secretRoutesFound.length > 0 && `${state.easterEggs.secretRoutesFound.length} geheime Routen`}
          </p>
        </div>
      </div>
    </section>
  );
}