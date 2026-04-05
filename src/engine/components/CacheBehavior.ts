import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';

const BASE_HIT_RATE = 0.7; // 70% cache hit rate

/**
 * Cache: intercepts requests. On hit, sends response immediately.
 * On miss, forwards to downstream (e.g., database).
 * This creates the visual density difference: heavy traffic on the
 * server↔cache connection, sparse traffic on cache↔database.
 */
export function processCache(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'request') {
    const hitRate = component.stats.hitRate ?? BASE_HIT_RATE;
    const isHit = Math.random() < hitRate;

    if (isHit) {
      // Cache hit — send response back immediately on same connection
      ctx.removeParticle(particle.id);
      const conn = ctx.state.connections.find((c) => c.id === particle.connectionId);
      if (conn) {
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
    } else {
      // Cache miss — forward to downstream
      const outConns = ctx.getOutgoingConnections(component.id);
      ctx.removeParticle(particle.id);

      if (outConns.length > 0) {
        const conn = outConns[Math.floor(Math.random() * outConns.length)];
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
    }

    // Track hit rate via exponential moving average
    component.stats.hitRate =
      (component.stats.hitRate ?? BASE_HIT_RATE) * 0.99 + (isHit ? 1 : 0) * 0.01;

    component.stats.requestsPerSecond = Math.min(
      component.stats.throughputLimit,
      component.stats.requestsPerSecond + 1,
    );
  } else {
    // Response from downstream (DB) — forward back upstream
    ctx.removeParticle(particle.id);
    const inConns = ctx.getIncomingConnections(component.id);
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
