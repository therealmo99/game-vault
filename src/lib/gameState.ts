import { getStored, setStored, generateId } from "./utils";

export type GameId =
  | "chronicle"
  | "cipher"
  | "constellation"
  | "archive"
  | "resonance"
  | "palimpsest"
  | "vault";

export type GameStatus = "locked" | "unlocked" | "completed";

export interface GameProgress {
  gameId: GameId;
  status: GameStatus;
  bestScore: number;
  currentScore: number;
  timePlayed: number;
  attempts: number;
  completedAt: number | null;
  secretFound: boolean;
  secretFoundAt: number | null;
  level: number;
  maxLevelReached: number;
  data: Record<string, unknown>;
}

export interface VaultState {
  version: number;
  games: Record<GameId, GameProgress>;
  secrets: Secret[];
  totalTimePlayed: number;
  firstVisit: number;
  lastVisit: number;
  settings: UserSettings;
  easterEggs: EasterEggState;
}

export interface Secret {
  id: string;
  gameId: GameId;
  name: string;
  description: string;
  foundAt: number;
  location: string;
}

export interface UserSettings {
  language: "de" | "en";
  soundEnabled: boolean;
  musicEnabled: boolean;
  effectsEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface EasterEggState {
  konamiActivated: boolean;
  konamiActivatedAt: number | null;
  devtoolsDetected: boolean;
  devtoolsDetectedAt: number | null;
  clickPatterns: string[];
  timeBasedFound: string[];
  secretRoutesFound: string[];
}

const STORAGE_KEY = "game-vault-state";
const CURRENT_VERSION = 1;

const defaultGameProgress: Record<GameId, GameProgress> = {
  chronicle: { gameId: "chronicle", status: "unlocked", bestScore: 0, currentScore: 0, timePlayed: 0, attempts: 0, completedAt: null, secretFound: false, secretFoundAt: null, level: 1, maxLevelReached: 1, data: {} },
  cipher: { gameId: "cipher", status: "locked", bestScore: 0, currentScore: 0, timePlayed: 0, attempts: 0, completedAt: null, secretFound: false, secretFoundAt: null, level: 1, maxLevelReached: 1, data: {} },
  constellation: { gameId: "constellation", status: "locked", bestScore: 0, currentScore: 0, timePlayed: 0, attempts: 0, completedAt: null, secretFound: false, secretFoundAt: null, level: 1, maxLevelReached: 1, data: {} },
  archive: { gameId: "archive", status: "locked", bestScore: 0, currentScore: 0, timePlayed: 0, attempts: 0, completedAt: null, secretFound: false, secretFoundAt: null, level: 1, maxLevelReached: 1, data: {} },
  resonance: { gameId: "resonance", status: "locked", bestScore: 0, currentScore: 0, timePlayed: 0, attempts: 0, completedAt: null, secretFound: false, secretFoundAt: null, level: 1, maxLevelReached: 1, data: {} },
  palimpsest: { gameId: "palimpsest", status: "locked", bestScore: 0, currentScore: 0, timePlayed: 0, attempts: 0, completedAt: null, secretFound: false, secretFoundAt: null, level: 1, maxLevelReached: 1, data: {} },
  vault: { gameId: "vault", status: "locked", bestScore: 0, currentScore: 0, timePlayed: 0, attempts: 0, completedAt: null, secretFound: false, secretFoundAt: null, level: 1, maxLevelReached: 1, data: {} },
};

const defaultSettings: UserSettings = {
  language: "de",
  soundEnabled: true,
  musicEnabled: true,
  effectsEnabled: true,
  reducedMotion: false,
  highContrast: false,
};

const defaultEasterEggs: EasterEggState = {
  konamiActivated: false,
  konamiActivatedAt: null,
  devtoolsDetected: false,
  devtoolsDetectedAt: null,
  clickPatterns: [],
  timeBasedFound: [],
  secretRoutesFound: [],
};

const defaultState: VaultState = {
  version: CURRENT_VERSION,
  games: defaultGameProgress,
  secrets: [],
  totalTimePlayed: 0,
  firstVisit: Date.now(),
  lastVisit: Date.now(),
  settings: defaultSettings,
  easterEggs: defaultEasterEggs,
};

function migrateState(oldState: unknown): VaultState {
  const state = oldState as Partial<VaultState>;
  if (!state || state.version === CURRENT_VERSION) {
    return { ...defaultState, ...state, version: CURRENT_VERSION } as VaultState;
  }
  return { ...defaultState, ...state, version: CURRENT_VERSION } as VaultState;
}

export function getVaultState(): VaultState {
  return getStored(STORAGE_KEY, defaultState);
}

export function saveVaultState(state: VaultState): void {
  setStored(STORAGE_KEY, state);
}

export function resetVaultState(): VaultState {
  const newState = { ...defaultState, firstVisit: Date.now() };
  saveVaultState(newState);
  return newState;
}

export function exportVaultState(): string {
  const state = getVaultState();
  return btoa(JSON.stringify(state));
}

export function importVaultState(data: string): boolean {
  try {
    const parsed = JSON.parse(atob(data));
    const migrated = migrateState(parsed);
    saveVaultState(migrated);
    return true;
  } catch {
    return false;
  }
}

export function getGameProgress(gameId: GameId): GameProgress {
  return getVaultState().games[gameId];
}

export function updateGameProgress(gameId: GameId, updates: Partial<GameProgress>): GameProgress {
  const state = getVaultState();
  const current = state.games[gameId];
  const updated = { ...current, ...updates, lastPlayedAt: Date.now() };
  state.games[gameId] = updated;
  state.lastVisit = Date.now();
  saveVaultState(state);
  return updated;
}

export function unlockGame(gameId: GameId): void {
  updateGameProgress(gameId, { status: "unlocked" });
}

export function completeGame(gameId: GameId, score: number, data?: Record<string, unknown>): void {
  const state = getVaultState();
  const current = state.games[gameId];
  const now = Date.now();

  const unlockedNext = getNextGame(gameId);
  if (unlockedNext) {
    state.games[unlockedNext].status = "unlocked";
  }

  updateGameProgress(gameId, {
    status: "completed",
    bestScore: Math.max(current.bestScore, score),
    currentScore: score,
    completedAt: now,
    level: current.level + 1,
    maxLevelReached: Math.max(current.maxLevelReached, current.level),
    data: data || current.data,
  });
}

export function addSecret(gameId: GameId, name: string, description: string, location: string): Secret {
  const state = getVaultState();
  const secret: Secret = {
    id: generateId("secret"),
    gameId,
    name,
    description,
    foundAt: Date.now(),
    location,
  };
  state.secrets.push(secret);
  state.games[gameId].secretFound = true;
  state.games[gameId].secretFoundAt = Date.now();
  saveVaultState(state);
  return secret;
}

export function getSecrets(): Secret[] {
  return getVaultState().secrets;
}

export function getNextGame(gameId: GameId): GameId | null {
  const order: GameId[] = ["chronicle", "cipher", "constellation", "archive", "resonance", "palimpsest", "vault"];
  const idx = order.indexOf(gameId);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
}

export function getOverallProgress(): number {
  const state = getVaultState();
  const games = Object.values(state.games);
  const completed = games.filter(g => g.status === "completed").length;
  return Math.round((completed / games.length) * 100);
}

export function getCompletedCount(): number {
  const state = getVaultState();
  return Object.values(state.games).filter(g => g.status === "completed").length;
}

export function getSettings(): UserSettings {
  return getVaultState().settings;
}

export function updateSettings(updates: Partial<UserSettings>): UserSettings {
  const state = getVaultState();
  state.settings = { ...state.settings, ...updates };
  saveVaultState(state);
  return state.settings;
}

export function recordEasterEgg(type: keyof EasterEggState, value: string | boolean): void {
  const state = getVaultState();
  if (type === "clickPatterns" || type === "timeBasedFound" || type === "secretRoutesFound") {
    const arr = state.easterEggs[type] as string[];
    if (!arr.includes(value as string)) {
      arr.push(value as string);
    }
  } else if (typeof value === "boolean" && value) {
    (state.easterEggs[type] as boolean) = true;
    const timeKey = `${type}At` as keyof EasterEggState;
    (state.easterEggs[timeKey] as number | null) = Date.now();
  }
  saveVaultState(state);
}

export function addTimePlayed(gameId: GameId, ms: number): void {
  const state = getVaultState();
  state.games[gameId].timePlayed += ms;
  state.totalTimePlayed += ms;
  saveVaultState(state);
}