"use client";

import { useState, useEffect, useCallback } from "react";
import { t, type Locale } from "../i18n";
import { ChronicleGame } from "./games/ChronicleGame";
import { CipherGame } from "./games/CipherGame";
import { ConstellationGame } from "./games/ConstellationGame";
import { ArchiveGame } from "./games/ArchiveGame";
import { ResonanceGame } from "./games/ResonanceGame";
import { PalimpsestGame } from "./games/PalimpsestGame";
import { VaultGame } from "./games/VaultGame";
import type { GameId } from "../lib/gameState";

interface GameManagerProps {
  locale: Locale;
}

export function GameManager({ locale }: GameManagerProps) {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  const handlePlayGame = useCallback((event: CustomEvent) => {
    const gameId = event.detail?.gameId as GameId;
    if (gameId) {
      setActiveGame(gameId);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("play-game", handlePlayGame as EventListener);
    return () => window.removeEventListener("play-game", handlePlayGame as EventListener);
  }, [handlePlayGame]);

  const handleClose = useCallback(() => {
    setActiveGame(null);
  }, []);

  if (!activeGame) return null;

  const GameComponent = {
    chronicle: ChronicleGame,
    cipher: CipherGame,
    constellation: ConstellationGame,
    archive: ArchiveGame,
    resonance: ResonanceGame,
    palimpsest: PalimpsestGame,
    vault: VaultGame,
  }[activeGame];

  return <GameComponent locale={locale} onClose={handleClose} gameId={activeGame} />;
}