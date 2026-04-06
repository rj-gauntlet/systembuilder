import type { GameState, Particle, Connection, LevelDefinition } from './types';
import { COMPONENT_DEFS } from './componentDefs';
import { processBehavior } from './components/BehaviorRegistry';
import { EventSystem } from './EventSystem';
import { ScoringEngine } from './ScoringEngine';

let nextParticleId = 1;
function particleUid(): string {
  return `p_${nextParticleId++}`;
}

const TICK_RATE = 1 / 60;          // 60 ticks per second
// Converts simulation seconds to display milliseconds.
// Particle travel speed is for visual clarity, not latency accuracy.
// Scale factor calibrated so: cache hit ~25ms, full chain ~100ms.
export const LATENCY_SCALE = 15;
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
  private eventSystem = new EventSystem();
  private scoringEngine = new ScoringEngine();
  private level: LevelDefinition | null = null;
  private drainStartTime = 0;
  private static readonly DRAIN_DURATION = 5; // seconds

  loadLevel(level: LevelDefinition, state: GameState): void {
    this.level = level;
    state.writeRatio = level.writeRatio;
    this.eventSystem.loadLevel(level);
  }

  tick(state: GameState, deltaMs: number): void {
    if (state.simulation.status !== 'running' && state.simulation.status !== 'draining') return;

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
    const isDraining = state.simulation.status === 'draining';

    // 1. Spawn request particles from clients (skip during drain)
    if (!isDraining) {
      this.spawnClientRequests(ctx);
    }

    // 2. Move flowing particles along connections
    this.moveParticles(ctx);

    // 3. Process arrived particles through component behaviors
    this.processArrivedParticles(ctx);

    // 4. Update component stats and health (sets load-based latency)
    this.updateComponentStats(ctx);

    // 5. Apply events (multiplies on top of load-based stats)
    this.eventSystem.update(state);

    // 6. Update score
    this.updateScore(state);

    // 7. Check if simulation duration is reached — enter drain phase
    if (!isDraining && this.level && state.simulation.elapsedTime >= this.level.simulationDuration) {
      state.simulation.status = 'draining';
      this.drainStartTime = this.simTime;
    }

    // 8. Check if drain phase is complete
    if (isDraining) {
      const drainElapsed = this.simTime - this.drainStartTime;
      const particlesInFlight = state.particles.length;

      // Complete when all particles resolved OR drain timeout reached
      if (particlesInFlight === 0 || drainElapsed >= SimulationLoop.DRAIN_DURATION) {
        // Count remaining in-flight particles as dropped (weighted)
        if (particlesInFlight > 0) {
          const remainingWeight = state.particles.reduce((sum, p) => sum + (p.weight ?? 1), 0);
          state.simulation.droppedRequests += remainingWeight;
          state.particles = [];
        }
        state.simulation.status = 'complete';
        if (this.level) {
          state.score = this.scoringEngine.calculateScore(state, this.level);
        }
      }
    }
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

      // Visual spawn rate: scales with throughput but capped for readability
      // More particles during spikes for visual impact
      const spawnRate = Math.min(10, 2 + (client.stats.throughputLimit / 300));
      const interval = 60 / spawnRate; // ticks between spawns
      const timer = (this.clientTimers.get(client.id) ?? 0) + 1;
      this.clientTimers.set(client.id, timer);

      if (timer >= interval) {
        this.clientTimers.set(client.id, 0);

        // Each particle represents multiple real requests
        // weight = throughput / visual_rate so the product = actual req/s
        const weight = Math.max(1, Math.round(client.stats.throughputLimit / (spawnRate * 6)));

        const conn = outConns[Math.floor(Math.random() * outConns.length)];
        const kind = Math.random() < ctx.state.writeRatio ? 'write' as const : 'read' as const;
        ctx.spawnParticle({
          connectionId: conn.id,
          position: 0,
          speed: PARTICLE_BASE_SPEED,
          direction: 'request',
          kind,
          status: 'flowing',
          sourceComponentId: client.id,
          createdAt: ctx.simTime,
          passedServer: false,
          weight,
        });
        ctx.state.simulation.totalRequests += weight;
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
        const conn = ctx.state.connections.find((c) => c.id === particle.connectionId);
        if (conn) {
          // Check if the destination component is failed — drop the response
          const dest = ctx.state.components.find((c) => c.id === conn.fromComponentId);
          if (dest && dest.health === 'failed') {
            particle.status = 'dropped';
            ctx.state.simulation.droppedRequests += particle.weight ?? 1;
            continue;
          }
          particle.status = 'queued';
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

      // Check capacity using weighted load
      const weightHere = ctx.state.particles
        .filter((p) => p.stuckInComponent === component.id)
        .reduce((sum, p) => sum + (p.weight ?? 1), 0);
      const capacityRatio = weightHere / Math.max(1, def.throughputLimit * 0.3);
      component.load = Math.min(1, capacityRatio);

      for (const particle of queued) {
        if (component.health === 'failed') {
          // Failed components drop all requests
          particle.status = 'dropped';
          ctx.state.simulation.droppedRequests += particle.weight ?? 1;
          continue;
        }

        // Check if over throughput limit
        if (component.load >= 1 && component.type !== 'client') {
          // Random chance to drop based on overload
          if (Math.random() < 0.3) {
            particle.status = 'dropped';
            ctx.state.simulation.droppedRequests += particle.weight ?? 1;
            continue;
          }
        }

        // Process through component behavior
        processBehavior(component, particle, ctx);
      }
    }

    // Animate dropped particles (red flash + expand) then remove
    const dropped = ctx.state.particles.filter((p) => p.status === 'dropped');
    for (const p of dropped) {
      p.stuckInComponent = undefined; // free from component so renderer can show it
      p.droppedAge = (p.droppedAge ?? 0) + 1;
      if (p.droppedAge > 20) {
        ctx.removeParticle(p.id);
      }
    }
  }

  // ---- Stats & Health ----

  private updateComponentStats(ctx: SimulationContext): void {
    for (const component of ctx.state.components) {
      const def = COMPONENT_DEFS[component.type];

      // Sum the weight of particles in/targeting this component
      const weightHere = ctx.state.particles
        .filter((p) => p.stuckInComponent === component.id)
        .reduce((sum, p) => sum + (p.weight ?? 1), 0);

      // Load = conceptual requests vs throughput capacity
      component.load = Math.min(1, weightHere / Math.max(1, def.throughputLimit * 0.3));

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
      component.stats.latencyMs = def.defaultLatencyMs * (1 + component.load * 1.5);
    }
  }

  private updateScore(state: GameState): void {
    const total = state.simulation.totalRequests;
    if (total === 0) return;

    state.score.uptime = (state.simulation.completedRequests / total) * 100;

    // Cost efficiency: ratio of budget used
    if (state.budget.monthlyLimit > 0) {
      state.score.costEfficiency = Math.max(
        0,
        100 - (state.budget.monthlySpent / state.budget.monthlyLimit) * 100,
      );
    }

    // Check if any component is failed
    state.score.survival = !state.components.some((c) => c.health === 'failed');

    // Average round-trip latency from actual particle measurements
    // Converted from simulation seconds to milliseconds for display
    const completed = state.simulation.completedRequests;
    if (completed > 0) {
      state.score.avgLatency = (state.simulation.totalLatency / completed) * LATENCY_SCALE;
    }
  }

  reset(): void {
    this.accumulator = 0;
    this.simTime = 0;
    this.clientTimers.clear();
    this.eventSystem.reset();
    this.level = null;
    nextParticleId = 1;
  }
}
