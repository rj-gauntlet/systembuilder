import type { GameState, Particle, Connection } from './types';
import { COMPONENT_DEFS } from './componentDefs';
import { processBehavior } from './components/BehaviorRegistry';

let nextParticleId = 1;
function particleUid(): string {
  return `p_${nextParticleId++}`;
}

const TICK_RATE = 1 / 60;          // 60 ticks per second
const PARTICLE_BASE_SPEED = 0.02;  // position units per tick (0-1 range)

export interface SimulationContext {
  state: GameState;
  spawnParticle: (particle: Omit<Particle, 'id'>) => void;
  removeParticle: (id: string) => void;
  getOutgoingConnections: (componentId: string) => Connection[];
  getIncomingConnections: (componentId: string) => Connection[];
  simTime: number;
}

export class SimulationLoop {
  private accumulator = 0;
  private simTime = 0;
  tick(state: GameState, deltaMs: number): void {
    if (state.simulation.status !== 'running') return;

    this.accumulator += deltaMs / 1000;

    while (this.accumulator >= TICK_RATE) {
      this.accumulator -= TICK_RATE;
      this.simTime += TICK_RATE;
      state.simulation.elapsedTime = this.simTime;
      this.step(state);
    }
  }

  private step(state: GameState): void {
    const ctx = this.createContext(state);

    // 1. Spawn request particles from clients
    this.spawnClientRequests(ctx);

    // 2. Move flowing particles along connections
    this.moveParticles(ctx);

    // 3. Process arrived particles through component behaviors
    this.processArrivedParticles(ctx);

    // 4. Update component stats and health
    this.updateComponentStats(ctx);

    // 5. Update score
    this.updateScore(state);
  }

  private createContext(state: GameState): SimulationContext {
    return {
      state,
      spawnParticle: (p) => {
        state.particles.push({ ...p, id: particleUid() });
      },
      removeParticle: (id) => {
        const idx = state.particles.findIndex((p) => p.id === id);
        if (idx !== -1) state.particles.splice(idx, 1);
      },
      getOutgoingConnections: (componentId) =>
        state.connections.filter((c) => c.fromComponentId === componentId),
      getIncomingConnections: (componentId) =>
        state.connections.filter((c) => c.toComponentId === componentId),
      simTime: this.simTime,
    };
  }

  // ---- Client Request Spawning ----

  private clientTimers: Map<string, number> = new Map();

  private spawnClientRequests(ctx: SimulationContext): void {
    const clients = ctx.state.components.filter((c) => c.type === 'client');

    for (const client of clients) {
      const outConns = ctx.getOutgoingConnections(client.id);
      if (outConns.length === 0) continue;

      // Spawn a request every N ticks based on throughput
      const interval = 1 / (client.stats.throughputLimit * TICK_RATE);
      const timer = (this.clientTimers.get(client.id) ?? 0) + 1;
      this.clientTimers.set(client.id, timer);

      if (timer >= interval) {
        this.clientTimers.set(client.id, 0);

        // Pick a random outgoing connection
        const conn = outConns[Math.floor(Math.random() * outConns.length)];
        ctx.spawnParticle({
          connectionId: conn.id,
          position: 0,
          speed: PARTICLE_BASE_SPEED,
          direction: 'request',
          status: 'flowing',
          sourceComponentId: client.id,
          createdAt: ctx.simTime,
        });
        ctx.state.simulation.totalRequests++;
        client.stats.requestsPerSecond = client.stats.throughputLimit;
      }
    }
  }

  // ---- Particle Movement ----

  private moveParticles(ctx: SimulationContext): void {
    const toRemove: string[] = [];

    for (const particle of ctx.state.particles) {
      if (particle.status !== 'flowing') continue;
      if (particle.stuckInComponent) continue;

      if (particle.direction === 'request') {
        particle.position += particle.speed;
      } else {
        // Response particles move backwards along the connection (1 → 0)
        particle.position -= particle.speed;
      }

      // Check if particle reached destination
      if (particle.direction === 'request' && particle.position >= 1) {
        particle.position = 1;
        particle.status = 'queued';
        // Find the destination component
        const conn = ctx.state.connections.find((c) => c.id === particle.connectionId);
        if (conn) {
          particle.stuckInComponent = conn.toComponentId;
        }
      } else if (particle.direction === 'response' && particle.position <= 0) {
        particle.position = 0;
        particle.status = 'queued';
        const conn = ctx.state.connections.find((c) => c.id === particle.connectionId);
        if (conn) {
          particle.stuckInComponent = conn.fromComponentId;
        }
      }
    }

    for (const id of toRemove) {
      ctx.removeParticle(id);
    }
  }

  // ---- Component Processing ----

  private processArrivedParticles(ctx: SimulationContext): void {
    for (const component of ctx.state.components) {
      const queued = ctx.state.particles.filter(
        (p) => p.stuckInComponent === component.id && p.status === 'queued',
      );
      if (queued.length === 0) continue;

      const def = COMPONENT_DEFS[component.type];

      // Check capacity — drop if overloaded
      const processingCount = ctx.state.particles.filter(
        (p) => p.stuckInComponent === component.id,
      ).length;
      const capacityRatio = processingCount / Math.max(1, def.throughputLimit * 0.1);
      component.load = Math.min(1, capacityRatio);

      for (const particle of queued) {
        if (component.health === 'failed') {
          // Failed components drop all requests
          particle.status = 'dropped';
          ctx.state.simulation.droppedRequests++;
          continue;
        }

        // Check if over throughput limit
        if (component.load >= 1 && component.type !== 'client') {
          // Random chance to drop based on overload
          if (Math.random() < 0.3) {
            particle.status = 'dropped';
            ctx.state.simulation.droppedRequests++;
            continue;
          }
        }

        // Process through component behavior
        processBehavior(component, particle, ctx);
      }
    }

    // Clean up dropped particles after a brief visual delay
    const dropped = ctx.state.particles.filter((p) => p.status === 'dropped');
    for (const p of dropped) {
      // Remove dropped particles after they've been visible for a moment
      if (!p.stuckInComponent) {
        ctx.removeParticle(p.id);
      } else {
        // Mark for removal next tick
        p.stuckInComponent = undefined;
      }
    }
  }

  // ---- Stats & Health ----

  private updateComponentStats(ctx: SimulationContext): void {
    for (const component of ctx.state.components) {
      const def = COMPONENT_DEFS[component.type];

      // Count particles currently in/targeting this component
      const particlesHere = ctx.state.particles.filter(
        (p) => p.stuckInComponent === component.id,
      ).length;

      // Update load
      component.load = Math.min(1, particlesHere / Math.max(1, def.throughputLimit * 0.05));

      // Update health based on load
      if (component.health !== 'failed') {
        if (component.load < 0.5) {
          component.health = 'healthy';
        } else if (component.load < 0.8) {
          component.health = 'strained';
        } else {
          component.health = 'critical';
        }
      }

      // Update latency based on load
      component.stats.latencyMs = def.defaultLatencyMs * (1 + component.load * 3);
    }
  }

  private updateScore(state: GameState): void {
    const total = state.simulation.totalRequests;
    if (total === 0) return;

    const dropped = state.simulation.droppedRequests;
    state.score.uptime = ((total - dropped) / total) * 100;

    // Cost efficiency: ratio of budget used
    if (state.budget.monthlyLimit > 0) {
      state.score.costEfficiency = Math.max(
        0,
        100 - (state.budget.monthlySpent / state.budget.monthlyLimit) * 100,
      );
    }

    // Check if any component is failed
    state.score.survival = !state.components.some((c) => c.health === 'failed');

    // Avg latency from component stats
    const activeComponents = state.components.filter(
      (c) => c.type !== 'client' && c.stats.requestsPerSecond > 0,
    );
    if (activeComponents.length > 0) {
      state.score.avgLatency =
        activeComponents.reduce((sum, c) => sum + c.stats.latencyMs, 0) / activeComponents.length;
    }
  }

  reset(): void {
    this.accumulator = 0;
    this.simTime = 0;
    this.clientTimers.clear();
    nextParticleId = 1;
  }
}
