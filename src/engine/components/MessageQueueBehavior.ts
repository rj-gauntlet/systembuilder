import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';

/**
 * Message Queue: buffers WRITE requests for async processing.
 * Sends immediate ack for writes. READ requests pass through unchanged.
 */
export function processMessageQueue(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  if (particle.direction === 'request') {
    if (particle.kind === 'read') {
      // Reads pass through — MQ doesn't buffer reads
      const outConns = ctx.getOutgoingConnections(component.id);
      ctx.removeParticle(particle.id);
      if (outConns.length > 0) {
        const conn = outConns[Math.floor(Math.random() * outConns.length)];
        ctx.spawnParticle({
          connectionId: conn.id,
          position: 0,
          speed: particle.speed,
          direction: 'request',
          kind: particle.kind,
          status: 'flowing',
          sourceComponentId: particle.sourceComponentId,
          createdAt: particle.createdAt,
          passedServer: particle.passedServer,
          weight: particle.weight ?? 1,
        });
      }
      component.stats.requestsPerSecond = Math.min(
        component.stats.throughputLimit,
        component.stats.requestsPerSecond + 1,
      );
      return;
    }

    // Write request — immediately ack back to sender
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
        passedServer: particle.passedServer,
        weight: particle.weight ?? 1,
      });
    }

    // Forward write to downstream at buffered rate
    const outConns = ctx.getOutgoingConnections(component.id);
    if (outConns.length > 0) {
      const conn = outConns[Math.floor(Math.random() * outConns.length)];
      ctx.spawnParticle({
        connectionId: conn.id,
        position: 0,
        speed: particle.speed * 0.7,
        direction: 'request',
        kind: particle.kind,
        status: 'flowing',
        sourceComponentId: particle.sourceComponentId,
        createdAt: particle.createdAt,
        passedServer: particle.passedServer,
        weight: particle.weight ?? 1,
      });
    }

    ctx.removeParticle(particle.id);

    component.stats.queueDepth = ctx.state.particles.filter(
      (p) => p.stuckInComponent === component.id,
    ).length;
    component.stats.requestsPerSecond = Math.min(
      component.stats.throughputLimit,
      component.stats.requestsPerSecond + 1,
    );
  } else {
    if (particle.kind === 'write') {
      // Write response from downstream — consume (ack already sent to client)
      ctx.removeParticle(particle.id);
    } else {
      // Read response from downstream — forward back upstream
      ctx.removeParticle(particle.id);
      const inConns = ctx.getIncomingConnections(component.id);
      const healthyConns = inConns.filter((c) => {
        const from = ctx.state.components.find((comp) => comp.id === c.fromComponentId);
        return from && from.health !== 'failed';
      });
      if (healthyConns.length > 0) {
        const conn = healthyConns[Math.floor(Math.random() * healthyConns.length)];
        ctx.spawnParticle({
          connectionId: conn.id,
          position: 1,
          speed: particle.speed,
          direction: 'response',
          kind: particle.kind,
          status: 'flowing',
          sourceComponentId: particle.sourceComponentId,
          createdAt: particle.createdAt,
          passedServer: particle.passedServer,
          weight: particle.weight ?? 1,
        });
      }
    }
  }
}
