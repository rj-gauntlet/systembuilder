import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';

/**
 * Load Balancer: distributes requests round-robin across outgoing connections.
 * Responses are routed back to the connection the request came from.
 */
let roundRobinIndex = 0;

export function processLoadBalancer(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'request') {
    const outConns = ctx.getOutgoingConnections(component.id);
    if (outConns.length === 0) {
      // No downstream — drop
      particle.status = 'dropped';
      ctx.state.simulation.droppedRequests++;
      return;
    }

    // Round-robin distribution
    const conn = outConns[roundRobinIndex % outConns.length];
    roundRobinIndex++;

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

    component.stats.requestsPerSecond = Math.min(
      component.stats.throughputLimit,
      component.stats.requestsPerSecond + 1,
    );
  } else {
    // Response — forward back upstream
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
