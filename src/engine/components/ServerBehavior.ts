import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';
import { getHealthyIncoming } from './routeUtils';

/**
 * Server: processes requests, forwards to downstream or sends response back.
 * If connected to downstream components (DB, cache), forwards the request.
 * If no downstream, generates a response directly.
 */
export function processServer(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'request') {
    // Try to forward to a downstream component
    const outConns = ctx.getOutgoingConnections(component.id);
    if (outConns.length > 0) {
      // Forward to a downstream connection
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
    } else {
      // No downstream — generate response on the incoming connection
      ctx.removeParticle(particle.id);
      const inConn = ctx.state.connections.find((c) => c.id === particle.connectionId);
      if (inConn) {
        ctx.spawnParticle({
          connectionId: inConn.id,
          position: 1,
          speed: particle.speed,
          direction: 'response',
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
    // Response coming back from downstream — forward back upstream
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
