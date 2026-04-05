import type { GameState } from '../engine/types';
import type { HintRule, ActiveHint } from './types';
import { cacheRules } from './rules/cacheRules';
import { loadBalancerRules } from './rules/loadBalancerRules';
import { databaseRules } from './rules/databaseRules';
import { redundancyRules } from './rules/redundancyRules';
import { rateLimiterRules } from './rules/rateLimiterRules';
import { generalRules } from './rules/generalRules';

const ALL_RULES: HintRule[] = [
  ...cacheRules,
  ...loadBalancerRules,
  ...databaseRules,
  ...redundancyRules,
  ...rateLimiterRules,
  ...generalRules,
];

export class HintEngine {
  private lastFired: Map<string, number> = new Map(); // ruleId → timestamp
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  evaluate(state: GameState): ActiveHint | null {
    if (!this.enabled) return null;
    if (state.simulation.status !== 'running' && state.simulation.status !== 'draining') return null;

    const now = Date.now();

    for (const rule of ALL_RULES) {
      const lastTime = this.lastFired.get(rule.id) ?? 0;
      if (now - lastTime < rule.cooldownMs) continue;

      try {
        if (rule.condition(state)) {
          this.lastFired.set(rule.id, now);
          const variant = rule.variants[Math.floor(Math.random() * 8)];
          return {
            ruleId: rule.id,
            text: variant,
            relatedComponentType: rule.relatedComponentType,
            timestamp: now,
          };
        }
      } catch {
        // Skip rules that throw on unexpected state
      }
    }

    return null;
  }

  reset(): void {
    this.lastFired.clear();
  }
}
