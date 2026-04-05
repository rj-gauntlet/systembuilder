import type { GameState, LevelDefinition, Score } from './types';

export class ScoringEngine {
  calculateScore(state: GameState, level: LevelDefinition): Score {
    const total = state.simulation.totalRequests;
    const dropped = state.simulation.droppedRequests;

    // Uptime: percentage of requests successfully processed
    const uptime = total > 0 ? ((total - dropped) / total) * 100 : 100;

    // Average latency across active components
    const activeComponents = state.components.filter(
      (c) => c.type !== 'client' && c.stats.requestsPerSecond > 0,
    );
    const avgLatency =
      activeComponents.length > 0
        ? activeComponents.reduce((sum, c) => sum + c.stats.latencyMs, 0) / activeComponents.length
        : 0;

    // Cost efficiency: ratio of player cost to optimal cost
    const costEfficiency =
      level.optimalBenchmark.monthlyCost > 0
        ? (state.budget.monthlySpent / level.optimalBenchmark.monthlyCost) * 100
        : 100;

    // Survival: no components in failed state at end
    const survival = !state.components.some((c) => c.health === 'failed');

    // Calculate stars
    const stars = this.calculateStars(uptime, avgLatency, costEfficiency, survival, level);

    return { uptime, avgLatency, costEfficiency, survival, stars };
  }

  private calculateStars(
    uptime: number,
    avgLatency: number,
    costRatio: number,
    survival: boolean,
    level: LevelDefinition,
  ): 0 | 1 | 2 | 3 {
    const { starThresholds } = level;

    // Check 3 stars first, then 2, then 1
    if (this.meetsThreshold(uptime, avgLatency, costRatio, survival, starThresholds.threeStar)) {
      return 3;
    }
    if (this.meetsThreshold(uptime, avgLatency, costRatio, survival, starThresholds.twoStar)) {
      return 2;
    }
    if (this.meetsThreshold(uptime, avgLatency, costRatio, survival, starThresholds.oneStar)) {
      return 1;
    }
    return 0;
  }

  private meetsThreshold(
    uptime: number,
    avgLatency: number,
    costRatio: number,
    survival: boolean,
    criteria: { minUptime: number; maxLatency: number; maxCostRatio: number; mustSurvive: boolean },
  ): boolean {
    if (uptime < criteria.minUptime) return false;
    if (avgLatency > criteria.maxLatency) return false;
    if (costRatio > criteria.maxCostRatio) return false;
    if (criteria.mustSurvive && !survival) return false;
    return true;
  }
}
