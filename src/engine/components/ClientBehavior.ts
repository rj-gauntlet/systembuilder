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
    // Response arrived back at client — record latency and consume
    ctx.removeParticle(particle.id);
  }
  // Requests arriving at a client (shouldn't happen normally) — just consume
  if (particle.direction === 'request') {
    ctx.removeParticle(particle.id);
  }
}
