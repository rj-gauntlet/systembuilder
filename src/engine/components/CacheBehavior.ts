import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';
import { getHealthyIncoming } from './routeUtils';

const BASE_HIT_RATE = 0.7;

/**
 * Cache: intercepts READ requests. On hit, responds immediately.
 * On miss, forwards downstream. WRITE requests always pass through.
 */
export function processCache(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'request') {
    if (particle.kind === 'write') {
      // Writes always pass through — caches don't intercept writes
      const outConns = ctx.getOutgoingConnections(component.id);
      ctx.removeParticle(particle.id);
      if (outConns.length > 0) {
        const conn = outConns[Math.floor(Math.random() * outConns.length)];
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
        });
      }
      component.stats.requestsPerSecond = Math.min(
        component.stats.throughputLimit,
        component.stats.requestsPerSecond + 1,
      );
      return;
    }

    // Read request — check hit rate
    const hitRate = component.stats.hitRate ?? BASE_HIT_RATE;
    const isHit = Math.random() < hitRate;

    if (isHit) {
      // Cache hit — respond immediately
      ctx.removeParticle(particle.id);
      const conn = ctx.state.connections.find((c) => c.id === particle.connectionId);
      if (conn) {
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
        });
      }
    } else {
      // Cache miss — forward downstream
      const outConns = ctx.getOutgoingConnections(component.id);
      ctx.removeParticle(particle.id);
      if (outConns.length > 0) {
        const conn = outConns[Math.floor(Math.random() * outConns.length)];
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
        });
      }
    }

    component.stats.hitRate =
      (component.stats.hitRate ?? BASE_HIT_RATE) * 0.99 + (isHit ? 1 : 0) * 0.01;
    component.stats.requestsPerSecond = Math.min(
      component.stats.throughputLimit,
      component.stats.requestsPerSecond + 1,
    );
  } else {
    // Response from downstream — forward back upstream
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
      });
    }
  }
}
