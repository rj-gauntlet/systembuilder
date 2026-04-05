import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';
import { getHealthyIncoming } from './routeUtils';

const CDN_HIT_RATE = 0.85;

/**
 * CDN: like a cache but for static content. Only serves READ requests.
 * WRITE requests always pass through to the origin.
 */
export function processCDN(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'request') {
    if (particle.kind === 'write') {
      // Writes pass through to origin
      const outConns = ctx.getOutgoingConnections(component.id);
      ctx.removeParticle(particle.id);
      if (outConns.length > 0) {
        const conn = outConns[0];
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
          weight: particle.weight ?? 1,
        });
      }
      component.stats.requestsPerSecond = Math.min(
        component.stats.throughputLimit,
        component.stats.requestsPerSecond + 1,
      );
      return;
    }

    // Read request — check hit rate
    const hitRate = component.stats.hitRate ?? CDN_HIT_RATE;
    const isHit = Math.random() < hitRate;

    if (isHit) {
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
          weight: particle.weight ?? 1,
        });
      }
    } else {
      const outConns = ctx.getOutgoingConnections(component.id);
      ctx.removeParticle(particle.id);
      if (outConns.length > 0) {
        const conn = outConns[0];
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
          weight: particle.weight ?? 1,
        });
      }
    }

    component.stats.hitRate =
      (component.stats.hitRate ?? CDN_HIT_RATE) * 0.99 + (isHit ? 1 : 0) * 0.01;
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
    }
  }
}
