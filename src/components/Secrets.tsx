import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Card, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { t, type Locale } from "../i18n";
import type { GameId } from "../lib/gameState";
import { useVaultState } from "../hooks/useGameState";
import { Eye, Lock, Sparkles, MapPin } from "lucide-react";

const SECRET_DETAILS: Record<GameId, { name: { de: string; en: string }; description: { de: string; en: string }; location: { de: string; en: string } }> = {
  chronicle: {
    name: { de: "Zeitzeugen-Fragment", en: "Timeline Fragment" },
    description: { de: "Ein Splitter der Ewigkeit, eingefroren in der Chronologie.", en: "A shard of eternity, frozen in chronology." },
    location: { de: "CHRONICLE — Stufe 5", en: "CHRONICLE — Level 5" },
  },
  cipher: {
    name: { de: "Chiffrier-Schlüssel", en: "Cipher Key" },
    description: { de: "Der Schlüssel, der jedes Schloss der Sprache öffnet.", en: "The key that unlocks every lock of language." },
    location: { de: "CIPHER — Stufe 5", en: "CIPHER — Level 5" },
  },
  constellation: {
    name: { de: "Sternenstaub-Essenz", en: "Stardust Essence" },
    description: { de: "Die Substanz, aus der Träume und Koordinaten gewebt sind.", en: "The substance from which dreams and coordinates are woven." },
    location: { de: "CONSTELLATION — Stufe 5", en: "CONSTELLATION — Level 5" },
  },
  archive: {
    name: { de: "Archivar-Siegel", en: "Archivist Seal" },
    description: { de: "Das Siegel des Hüters vergessener Wahrheiten.", en: "The seal of the keeper of forgotten truths." },
    location: { de: "ARCHIVE — Stufe 5", en: "ARCHIVE — Level 5" },
  },
  resonance: {
    name: { de: "Resonanz-Kristall", en: "Resonance Crystal" },
    description: { de: "Schwingt im Takt der verborgenen Melodie des Universums.", en: "Vibrates to the hidden melody of the universe." },
    location: { de: "RESONANCE — Stufe 5", en: "RESONANCE — Level 5" },
  },
  palimpsest: {
    name: { de: "Palimpsest-Klinge", en: "Palimpsest Blade" },
    description: { de: "Kratzt nicht nur Oberflächen, sondern Schicksale frei.", en: "Scratches away not just surfaces, but destinies." },
    location: { de: "PALIMPSEST — Stufe 5", en: "PALIMPSEST — Level 5" },
  },
  vault: {
    name: { de: "Meisterschlüssel VAULT-7", en: "Master Key VAULT-7" },
    description: { de: "Der Schlüssel, der alle sieben Tresore gleichzeitig öffnet.", en: "The key that opens all seven vaults at once." },
    location: { de: "VAULT — Meister-Ebene", en: "VAULT — Master Level" },
  },
};

const GAME_ORDER: GameId[] = ["chronicle", "cipher", "constellation", "archive", "resonance", "palimpsest", "vault"];

interface SecretsProps {
  locale: Locale;
}

export function Secrets({ locale }: SecretsProps) {
  const { state } = useVaultState();
  const [inView, setInView] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<GameId | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1, rootMargin: "50px" }
    );
    const el = document.getElementById("secrets-section");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const secrets = t(locale, "secrets");
  const common = t(locale, "common");

  const foundSecrets = state.secrets;
  const foundIds = new Set(foundSecrets.map(s => s.gameId));

  return (
    <section
      id="secrets-section"
      className="py-16 lg:py-24 relative noise-overlay"
      aria-labelledby="secrets-title"
    >
      <div className="container">
        <div className={cn("text-center mb-12 lg:mb-16", inView ? "animate-fade-in" : "opacity-0")}>
          <span className="text-brutal text-xs tracking-widest text-gold-500 mb-4 block">
            {secrets.title}
          </span>
          <h2 id="secrets-title" className="display-2 lg:display-3 text-balance mb-4">
            {secrets.title}
          </h2>
          <div className="rule-gold-center mb-6" aria-hidden="true" />
          <p className="text-fg-secondary text-lg max-w-2xl mx-auto text-pretty">
            {secrets.subtitle}
          </p>
        </div>

        {foundSecrets.length === 0 ? (
          <Card className={cn("max-w-2xl mx-auto text-center py-16", inView ? "animate-scale-in" : "opacity-0")}>
            <CardBody>
              <Lock className="w-16 h-16 mx-auto mb-6 text-fg-muted/30" aria-hidden="true" />
              <h3 className="text-brutal text-xl text-gold-500 mb-3">{secrets.none}</h3>
              <p className="text-fg-muted max-w-md mx-auto">
                {t(locale, "games.subtitle")}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
              inView ? "stagger" : "opacity-0"
            )}
            role="list"
            aria-label={secrets.title}
          >
            {GAME_ORDER.map((gameId) => {
              const secret = foundSecrets.find(s => s.gameId === gameId);
              const details = SECRET_DETAILS[gameId];
              const isFound = foundIds.has(gameId);

              return (
                <Card
                  key={gameId}
                  className={cn(
                    "group relative overflow-hidden cursor-pointer",
                    isFound ? "border-gold-500/50" : "opacity-40 pointer-events-none"
                  )}
                  onClick={() => isFound && setSelectedSecret(gameId)}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
                  <CardBody className="relative p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-brutal text-xs tracking-wider text-gold-500">
                          {gameId.toUpperCase()}
                        </span>
                        {isFound && (
                          <Badge variant="secret">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {secrets.found}
                          </Badge>
                        )}
                      </div>
                      {isFound && <Eye className="w-5 h-5 text-fg-muted/50 group-hover:text-gold-500 transition-colors" />}
                    </div>

                    <h3 className={cn("text-brutal text-lg tracking-wider mb-2", isFound ? "text-fg-primary" : "text-fg-muted/50")}>
                      {details.name[locale]}
                    </h3>

                    <p className={cn("text-fg-muted text-sm leading-relaxed flex-1 mb-4", isFound ? "" : "line-clamp-2")}>
                      {isFound ? details.description[locale] : "Vollende das Spiel, um dieses Geheimnis zu enthüllen."}
                    </p>

                    {isFound && (
                      <div className="flex items-center gap-2 text-xs text-fg-muted border-t border-border-primary pt-4">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        <span>{details.location[locale]}</span>
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {selectedSecret && (
          <div className="fixed inset-0 z-toast flex items-center justify-center p-4 bg-ink-950/95 backdrop-blur-sm" onClick={() => setSelectedSecret(null)} role="dialog" aria-modal="true" aria-labelledby="secret-detail-title">
            <Card className="w-full max-w-xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-brutal text-xs tracking-wider text-gold-500 mb-2 block">
                      {selectedSecret.toUpperCase()}
                    </span>
                    <h3 id="secret-detail-title" className="text-brutal text-2xl tracking-wider shimmer">
                      {SECRET_DETAILS[selectedSecret].name[locale]}
                    </h3>
                  </div>
                  <button onClick={() => setSelectedSecret(null)} className="text-fg-muted hover:text-gold-500 transition-colors p-1" aria-label={common.close}>
                    <Eye className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-bg-tertiary p-4 border border-border-primary">
                    <p className="text-fg-muted text-sm mb-2">{secrets.hint}</p>
                    <p className="text-fg-primary leading-relaxed">{SECRET_DETAILS[selectedSecret].description[locale]}</p>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-fg-muted bg-bg-tertiary p-3 border border-border-primary">
                    <MapPin className="w-4 h-4 text-gold-500" aria-hidden="true" />
                    <span>{SECRET_DETAILS[selectedSecret].location[locale]}</span>
                  </div>

                  <div className="text-center text-fg-muted/50 text-xs">
                    {foundSecrets.find(s => s.gameId === selectedSecret)?.foundAt && (
                      <>
                        Gefunden am {new Date(foundSecrets.find(s => s.gameId === selectedSecret)!.foundAt).toLocaleDateString(locale)}
                      </>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}