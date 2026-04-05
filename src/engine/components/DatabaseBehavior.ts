import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';

/**
 * Database: terminal component. Receives requests, sends responses back
 * on the same connection. Slow under load.
 */
export function processDatabase(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'request') {
    // Process and send response back on the same connection
    ctx.removeParticle(particle.id);

    const conn = ctx.state.connections.find((c) => c.id === particle.connectionId);
    if (conn) {
      ctx.spawnParticle({
        connectionId: conn.id,
        position: 1,
        speed: particle.speed * (1 - component.load * 0.5), // slower under load
        direction: 'response',
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
    // Responses shouldn't arrive at a DB — consume
    ctx.removeParticle(particle.id);
  }
}
