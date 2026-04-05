import type { GameState } from '../engine/types';

export interface HintRule {
  id: string;
  condition: (state: GameState) => boolean;
  variants: [string, string, string, string, string, string, string, string]; // exactly 8
  relatedComponentType?: string; // for context in "Ask about this"
  cooldownMs: number;
}

export interface ActiveHint {
  ruleId: string;
  text: string;
  relatedComponentType?: string;
  timestamp: number;
}
