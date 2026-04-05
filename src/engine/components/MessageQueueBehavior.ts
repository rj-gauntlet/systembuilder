import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';

/**
 * Message Queue: buffers incoming requests and drains them to downstream
 * at a steady rate. Smooths out traffic spikes. Sends an acknowledgement
 * response immediately (the producer doesn't wait for processing).
 */
export function processMessageQueue(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'request') {
    // Immediately ack back to sender (async pattern)
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

    // Forward to downstream consumer at a steady rate
    const outConns = ctx.getOutgoingConnections(component.id);
    if (outConns.length > 0) {
      const conn = outConns[Math.floor(Math.random() * outConns.length)];
      ctx.spawnParticle({
        connectionId: conn.id,
        position: 0,
        speed: particle.speed * 0.7, // slightly slower — buffered delivery
        direction: 'request',
        status: 'flowing',
        sourceComponentId: particle.sourceComponentId,
        createdAt: particle.createdAt,
      });
    }

    ctx.removeParticle(particle.id);

    // Track queue depth
    component.stats.queueDepth = ctx.state.particles.filter(
      (p) => p.stuckInComponent === component.id,
    ).length;

    component.stats.requestsPerSecond = Math.min(
      component.stats.throughputLimit,
      component.stats.requestsPerSecond + 1,
    );
  } else {
    // Responses from downstream consumers — consume (ack already sent)
    ctx.removeParticle(particle.id);
  }
}
