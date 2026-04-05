import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';
import { getHealthyIncoming } from './routeUtils';

/**
 * Server: processes requests, forwards to downstream or sends response back.
 * Handles both reads and writes identically — it's the cache/MQ that differentiates.
 */
export function processServer(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'request') {
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
      });
    } else {
      // No downstream — generate response
      ctx.removeParticle(particle.id);
      const inConn = ctx.state.connections.find((c) => c.id === particle.connectionId);
      if (inConn) {
        ctx.spawnParticle({
          connectionId: inConn.id,
          position: 1,
          speed: particle.speed,
          direction: 'response',
          kind: particle.kind,
          status: 'flowing',
          sourceComponentId: particle.sourceComponentId,
          createdAt: particle.createdAt,
        });
      }
    }
    component.stats.requestsPerSecond = Math.min(
      component.stats.throughputLimit,
      component.stats.requestsPerSecond + 1,
    );
  } else {
    // Response — forward back upstream
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
      });
    }
  }
}
