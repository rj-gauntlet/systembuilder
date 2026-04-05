import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';
import { getHealthyIncoming } from './routeUtils';

/**
 * Rate Limiter: allows requests through up to throughput limit.
 * Excess requests are dropped. Passes responses through unchanged.
 */

const windowCounters: Map<string, number> = new Map();
const WINDOW_TICKS = 60; // 1 second window at 60 tps
let tickCounter = 0;

export function processRateLimiter(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  tickCounter++;

  // Reset window counter periodically
  if (tickCounter % WINDOW_TICKS === 0) {
    windowCounters.set(component.id, 0);
  }

  if (particle.direction === 'request') {
    const count = windowCounters.get(component.id) ?? 0;

    if (count >= component.stats.throughputLimit) {
      // Over limit — drop request
      ctx.removeParticle(particle.id);
      particle.status = 'dropped';
      ctx.state.simulation.droppedRequests++;
      return;
    }

    windowCounters.set(component.id, count + 1);

    // Forward to downstream
    const outConns = ctx.getOutgoingConnections(component.id);
    if (outConns.length > 0) {
      const conn = outConns[Math.floor(Math.random() * outConns.length)];
      ctx.removeParticle(particle.id);
      ctx.spawnParticle({
        connectionId: conn.id,
        position: 0,
        speed: particle.speed,
        direction: 'request',
        status: 'flowing',
        sourceComponentId: particle.sourceComponentId,
        createdAt: particle.createdAt,
      });
    }

    component.stats.requestsPerSecond = Math.min(
      component.stats.throughputLimit,
      component.stats.requestsPerSecond + 1,
    );
  } else {
    // Response — pass through back upstream
    ctx.removeParticle(particle.id);
    const inConns = getHealthyIncoming(component.id, ctx);
    if (inConns.length > 0) {
      const conn = inConns[Math.floor(Math.random() * inConns.length)];
      ctx.spawnParticle({
        connectionId: conn.id,
        position: 1,
        speed: particle.speed,
        direction: 'response',
        status: 'flowing',
        sourceComponentId: particle.sourceComponentId,
        createdAt: particle.createdAt,
      });
    }
  }
}
