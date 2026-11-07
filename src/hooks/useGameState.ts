import { useState, useEffect, useCallback, useRef } from "react";
import type { GameId, GameProgress, VaultState, UserSettings, Secret } from "../lib/gameState";
import {
  getVaultState,
  saveVaultState,
  updateGameProgress,
  completeGame,
  addSecret,
  getSecrets,
  unlockGame,
  getSettings,
  updateSettings,
  recordEasterEgg,
  addTimePlayed,
  resetVaultState,
  exportVaultState,
  importVaultState,
  getOverallProgress,
  getCompletedCount,
} from "../lib/gameState";

export function useVaultState() {
  const [state, setState] = useState<VaultState>(() => getVaultState());
  const [mounted, setMounted] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setMounted(true);
    setState(getVaultState());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleStorageChange = useCallback((e: StorageEvent) => {
    if (e.key === "game-vault-state" && e.newValue) {
      try {
        setState(JSON.parse(e.newValue));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const debouncedSave = useCallback((newState: VaultState) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveVaultState(newState), 100);
  }, []);

  const updateState = useCallback((updater: (prev: VaultState) => VaultState) => {
    setState(prev => {
      const next = updater(prev);
      debouncedSave(next);
      return next;
    });
  }, [debouncedSave]);

  return { state, setState: updateState, mounted };
}

export function useGameProgress(gameId: GameId) {
  const { state, setState } = useVaultState();
  const progress = state.games[gameId];

  const update = useCallback((updates: Partial<GameProgress>) => {
    setState(prev => {
      const next = { ...prev };
      next.games[gameId] = { ...next.games[gameId], ...updates };
      next.lastVisit = Date.now();
      return next;
    });
  }, [setState, gameId]);

  const complete = useCallback((score: number, data?: Record<string, unknown>) => {
    setState(prev => {
      const next = { ...prev };
      const current = next.games[gameId];
      const now = Date.now();

      const order: GameId[] = ["chronicle", "cipher", "constellation", "archive", "resonance", "palimpsest", "vault"];
      const idx = order.indexOf(gameId);
      if (idx >= 0 && idx < order.length - 1) {
        next.games[order[idx + 1]].status = "unlocked";
      }

      next.games[gameId] = {
        ...current,
        status: "completed",
        bestScore: Math.max(current.bestScore, score),
        currentScore: score,
        completedAt: now,
        level: current.level + 1,
        maxLevelReached: Math.max(current.maxLevelReached, current.level),
        data: data || current.data,
      };
      return next;
    });
  }, [setState, gameId]);

  const unlock = useCallback(() => {
    update({ status: "unlocked" });
  }, [update]);

  const addTime = useCallback((ms: number) => {
    setState(prev => {
      const next = { ...prev };
      next.games[gameId].timePlayed += ms;
      next.totalTimePlayed += ms;
      return next;
    });
  }, [setState, gameId]);

  return { progress, update, complete, unlock, addTime };
}

export function useSecrets() {
  const { state, setState } = useVaultState();

  const add = useCallback((gameId: GameId, name: string, description: string, location: string) => {
    setState(prev => {
      const next = { ...prev };
      const secret = {
        id: `secret_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        gameId,
        name,
        description,
        foundAt: Date.now(),
        location,
      };
      next.secrets.push(secret);
      next.games[gameId].secretFound = true;
      next.games[gameId].secretFoundAt = Date.now();
      return next;
    });
  }, [setState]);

  const all = state.secrets;
  const byGame = (gameId: GameId) => state.secrets.filter(s => s.gameId === gameId);

  return { secrets: all, add, byGame };
}

export function useSettings() {
  const { state, setState } = useVaultState();

  const update = useCallback((updates: Partial<UserSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  }, [setState]);

  return { settings: state.settings, update };
}

export function useEasterEggs() {
  const { state, setState } = useVaultState();

  const trigger = useCallback((type: keyof typeof state.easterEggs, value: string | boolean) => {
    setState(prev => {
      const next = { ...prev, easterEggs: { ...prev.easterEggs } };
      if (type === "clickPatterns" || type === "timeBasedFound" || type === "secretRoutesFound") {
        const arr = (next.easterEggs[type] as string[]);
        if (!arr.includes(value as string)) arr.push(value as string);
      } else if (typeof value === "boolean" && value) {
        (next.easterEggs[type] as boolean) = true;
        const timeKey = `${type}At` as keyof typeof next.easterEggs;
        (next.easterEggs[timeKey] as number | null) = Date.now();
      }
      return next;
    });
  }, [setState]);

  return { easterEggs: state.easterEggs, trigger };
}

export function useOverallProgress() {
  const { state } = useVaultState();
  const progress = getOverallProgress();
  const completed = getCompletedCount();
  const totalTime = state.totalTimePlayed;
  return { progress, completed, totalTime };
}

export function useVaultActions() {
  const { setState } = useVaultState();

  const reset = useCallback(() => {
    const newState = resetVaultState();
    setState(() => newState);
  }, [setState]);

  const exportState = useCallback(() => exportVaultState(), []);
  const importState = useCallback((data: string) => {
    const success = importVaultState(data);
    if (success) setState(() => getVaultState());
    return success;
  }, [setState]);

  return { reset, exportState, importState };
}