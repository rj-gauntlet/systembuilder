import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';

/**
 * Database: terminal component. Processes reads and writes.
 * Writes are 1.5x slower than reads (persistence cost).
 * Rejects requests that haven't passed through a server.
 */
export function processDatabase(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'request') {
    // Reject requests that never passed through a server
    if (!particle.passedServer) {
      particle.status = 'dropped';
      ctx.state.simulation.droppedRequests++;
      return;
    }

    ctx.removeParticle(particle.id);

    const conn = ctx.state.connections.find((c) => c.id === particle.connectionId);
    if (conn) {
      const speedMultiplier = particle.kind === 'write' ? 0.65 : 1;
      const loadPenalty = 1 - component.load * 0.5;

      ctx.spawnParticle({
        connectionId: conn.id,
        position: 1,
        speed: particle.speed * speedMultiplier * loadPenalty,
        direction: 'response',
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
  } else {
    ctx.removeParticle(particle.id);
  }
}
