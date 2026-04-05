import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';

const CDN_HIT_RATE = 0.85; // 85% — CDNs are very effective for static content

/**
 * CDN: like a cache but for static content. Higher hit rate, lower latency.
 * On hit, responds immediately. On miss, forwards to origin (downstream).
 */
export function processCDN(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'request') {
    const hitRate = component.stats.hitRate ?? CDN_HIT_RATE;
    const isHit = Math.random() < hitRate;

    if (isHit) {
      // CDN hit — respond immediately
      ctx.removeParticle(particle.id);
      const conn = ctx.state.connections.find((c) => c.id === particle.connectionId);
      if (conn) {
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
    } else {
      // CDN miss — forward to origin server
      const outConns = ctx.getOutgoingConnections(component.id);
      ctx.removeParticle(particle.id);

      if (outConns.length > 0) {
        const conn = outConns[0];
        ctx.spawnParticle({
          connectionId: conn.id,
          position: 0,
          speed: particle.speed,
          direction: 'request',
          status: 'flowing',
          sourceComponentId: particle.sourceComponentId,
          createdAt: particle.createdAt,
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
    // Response from origin — forward back upstream
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
