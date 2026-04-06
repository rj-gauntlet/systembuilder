import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';
import { getHealthyIncoming } from './routeUtils';

// Per-component window tracking: counts weighted requests per 1-second window
const windowCounters: Map<string, number> = new Map();
const windowStartTimes: Map<string, number> = new Map();
const WINDOW_DURATION = 1; // 1 second window

export function processRateLimiter(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'request') {
    const weight = particle.weight ?? 1;

    // Reset window if 1 second has elapsed (based on simulation time)
    const windowStart = windowStartTimes.get(component.id) ?? 0;
    if (ctx.simTime - windowStart >= WINDOW_DURATION) {
      windowCounters.set(component.id, 0);
      windowStartTimes.set(component.id, ctx.simTime);
    }

    const count = windowCounters.get(component.id) ?? 0;

    if (count + weight > component.stats.throughputLimit) {
      // Throttled — rate limiter is doing its job.
      // Don't count as a drop (these are intentionally rejected).
      // Instead, remove from totalRequests so uptime isn't penalized.
      particle.status = 'dropped';
      particle.stuckInComponent = undefined;
      ctx.state.simulation.totalRequests = Math.max(
        0,
        ctx.state.simulation.totalRequests - weight,
      );
      return;
    }

    windowCounters.set(component.id, count + weight);

    const outConns = ctx.getOutgoingConnections(component.id);
    if (outConns.length > 0) {
      const conn = outConns[Math.floor(Math.random() * outConns.length)];
      ctx.removeParticle(particle.id);
      ctx.spawnParticle({
        connectionId: conn.id,
        position: 0,
        speed: particle.speed,
        direction: 'request',
        kind: particle.kind,
        status: 'flowing',
        sourceComponentId: particle.sourceComponentId,
        createdAt: particle.createdAt,
        passedServer: particle.passedServer,
        weight,
      });
    } else {
      // No downstream — request lost
      ctx.state.simulation.droppedRequests += weight;
      particle.status = 'dropped';
      particle.stuckInComponent = undefined;
    }

    component.stats.requestsPerSecond = Math.min(
      component.stats.throughputLimit,
      component.stats.requestsPerSecond + 1,
    );
  } else {
    ctx.removeParticle(particle.id);
    const inConns = getHealthyIncoming(component.id, ctx);
    if (inConns.length > 0) {
      const conn = inConns[Math.floor(Math.random() * inConns.length)];
      ctx.spawnParticle({
        connectionId: conn.id,
        position: 1,
        speed: particle.speed,
        direction: 'response',
        kind: particle.kind,
        status: 'flowing',
        sourceComponentId: particle.sourceComponentId,
        createdAt: particle.createdAt,
        passedServer: particle.passedServer,
        weight: particle.weight ?? 1,
      });
    } else {
      // No healthy upstream — response lost
      ctx.state.simulation.droppedRequests += particle.weight ?? 1;
    }
  }
}
