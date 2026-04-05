import type { LevelDefinition } from './types';
import { allLevels } from '../levels';

export class LevelLoader {
  private levels: Map<string, LevelDefinition>;

  constructor() {
    this.levels = new Map();
    for (const level of allLevels) {
      this.levels.set(level.id, level);
    }
  }

  getLevel(id: string): LevelDefinition | null {
    return this.levels.get(id) ?? null;
  }

  getLevelsByTier(tier: string): LevelDefinition[] {
    return allLevels.filter((l) => l.tier === tier);
  }

  getAllLevels(): LevelDefinition[] {
    return [...allLevels];
  }
}
