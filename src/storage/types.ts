import type { Score } from '../engine/types';

export interface LevelProgress {
  bestStars: 0 | 1 | 2 | 3;
  bestScore: Score;
  attempts: number;
  lastPlayed: string; // ISO date
}

export interface PlayerSettings {
  userApiKey?: string;
  hintsEnabled: boolean;
  soundEnabled: boolean;
}

export interface PlayerProgress {
  version: number; // schema version for migration
  levels: Record<string, LevelProgress>;
  totalStars: number;
  unlockedTiers: string[];
  settings: PlayerSettings;
}
