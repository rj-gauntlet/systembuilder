import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';

/**
 * Client: receives response particles and records latency.
 * Requests are spawned by SimulationLoop, not by this behavior.
 */
export function processClient(
  _component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'response') {
    // Response completed the round trip — record latency and consume
    const roundTripTime = ctx.simTime - particle.createdAt;
    ctx.state.simulation.completedRequests++;
    ctx.state.simulation.totalLatency += roundTripTime;
    if (roundTripTime > ctx.state.simulation.maxLatency) {
      ctx.state.simulation.maxLatency = roundTripTime;
    }
    ctx.removeParticle(particle.id);
  }
  if (particle.direction === 'request') {
    ctx.removeParticle(particle.id);
  }
}
