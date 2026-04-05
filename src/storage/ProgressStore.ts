import type { Score } from '../engine/types';
import type { PlayerProgress } from './types';
import { migrate } from './migration';

const STORAGE_KEY = 'systembuilder_progress';
const CURRENT_VERSION = 1;

function defaultProgress(): PlayerProgress {
  return {
    version: CURRENT_VERSION,
    levels: {},
    totalStars: 0,
    unlockedTiers: ['beginner'],
    settings: {
      hintsEnabled: true,
      soundEnabled: true,
    },
  };
}

export class ProgressStore {
  private data: PlayerProgress;

  constructor() {
    this.data = this.load();
  }

  private load(): PlayerProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProgress();
      const parsed = JSON.parse(raw) as PlayerProgress;
      return migrate(parsed, CURRENT_VERSION);
    } catch {
      return defaultProgress();
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  getProgress(): PlayerProgress {
    return this.data;
  }

  getLevelProgress(levelId: string) {
    return this.data.levels[levelId] ?? null;
  }

  saveLevelResult(levelId: string, score: Score): void {
    const existing = this.data.levels[levelId];
    if (!existing || score.stars > existing.bestStars) {
      this.data.levels[levelId] = {
        bestStars: score.stars,
        bestScore: score,
        attempts: (existing?.attempts ?? 0) + 1,
        lastPlayed: new Date().toISOString(),
      };
    } else {
      existing.attempts += 1;
      existing.lastPlayed = new Date().toISOString();
      if (score.stars > existing.bestStars) {
        existing.bestStars = score.stars;
        existing.bestScore = score;
      }
    }

    // Recalculate total stars
    this.data.totalStars = Object.values(this.data.levels).reduce(
      (sum, lp) => sum + lp.bestStars,
      0,
    );

    this.save();
  }

  unlockTier(tier: string): void {
    if (!this.data.unlockedTiers.includes(tier)) {
      this.data.unlockedTiers.push(tier);
      this.save();
    }
  }

  isTierUnlocked(tier: string): boolean {
    return this.data.unlockedTiers.includes(tier);
  }

  updateSettings(settings: Partial<PlayerProgress['settings']>): void {
    Object.assign(this.data.settings, settings);
    this.save();
  }

  reset(): void {
    this.data = defaultProgress();
    this.save();
  }
}
