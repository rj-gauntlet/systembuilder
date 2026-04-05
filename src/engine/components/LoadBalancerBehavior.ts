import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';
import { getHealthyIncoming } from './routeUtils';

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

    // Filter out connections to failed components
    const healthyConns = outConns.filter((c) => {
      const target = ctx.state.components.find((comp) => comp.id === c.toComponentId);
      return target && target.health !== 'failed';
    });

    if (healthyConns.length === 0) {
      // No healthy downstream — drop
      particle.status = 'dropped';
      ctx.state.simulation.droppedRequests++;
      return;
    }

    // Round-robin across healthy targets only
    const conn = healthyConns[roundRobinIndex % healthyConns.length];
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
