import type { GameState } from '../engine/types';

/**
 * Serialize GameState into a compact JSON string for AI context.
 * Targets ~500-1000 tokens to leave room for conversation.
 */
export function serializeGameState(state: GameState): string {
  const components = state.components.map((c) => ({
    type: c.type,
    health: c.health,
    load: Math.round(c.load * 100) + '%',
    rps: Math.round(c.stats.requestsPerSecond),
    latency: Math.round(c.stats.latencyMs) + 'ms',
    ...(c.stats.hitRate !== undefined ? { hitRate: Math.round(c.stats.hitRate * 100) + '%' } : {}),
    ...(c.stats.queueDepth !== undefined ? { queueDepth: c.stats.queueDepth } : {}),
  }));

  const connections = state.connections.map((conn) => {
    const from = state.components.find((c) => c.id === conn.fromComponentId);
    const to = state.components.find((c) => c.id === conn.toComponentId);
    return `${from?.type ?? '?'} → ${to?.type ?? '?'}`;
  });

  const activeEvents = state.events
    .filter((e) => e.active)
    .map((e) => e.title);

  const summary = {
    components,
    connections,
    activeEvents,
    budget: {
      spent: state.budget.monthlySpent,
      limit: state.budget.monthlyLimit,
      remaining: state.budget.remaining,
    },
    metrics: {
      uptime: state.score.uptime.toFixed(1) + '%',
      latency: Math.round(state.score.avgLatency) + 'ms',
      totalRequests: state.simulation.totalRequests,
      completedRequests: state.simulation.completedRequests,
      droppedRequests: state.simulation.droppedRequests,
    },
    status: state.simulation.status,
  };

  return JSON.stringify(summary, null, 0);
}
