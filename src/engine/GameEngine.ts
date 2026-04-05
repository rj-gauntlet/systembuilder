import type {
  Component,
  ComponentType,
  Connection,
  GameState,
  GridPosition,
  PortPosition,
  Budget,
  Score,
  SimulationState,
  GameEvent,
  Particle,
  GamePhase,
} from './types';
import { COMPONENT_DEFS } from './componentDefs';

let nextId = 1;
function uid(prefix: string): string {
  return `${prefix}_${nextId++}`;
}

function createDefaultBudget(limit: number): Budget {
  return { monthlyLimit: limit, monthlySpent: 0, remaining: limit };
}

function createDefaultScore(): Score {
  return { uptime: 100, avgLatency: 0, costEfficiency: 100, survival: true, stars: 0 };
}

function createDefaultSimulation(): SimulationState {
  return { status: 'building', elapsedTime: 0, totalRequests: 0, completedRequests: 0, droppedRequests: 0 };
}

export class GameEngine {
  private state: GameState;
  private _phase: GamePhase = 'building';

  constructor(budgetLimit: number = 500) {
    this.state = {
      components: [],
      connections: [],
      particles: [],
      budget: createDefaultBudget(budgetLimit),
      events: [],
      score: createDefaultScore(),
      simulation: createDefaultSimulation(),
      levelId: null,
    };
  }

  // ---- State Access ----

  getState(): GameState {
    return this.state;
  }

  get phase(): GamePhase {
    return this._phase;
  }

  setPhase(phase: GamePhase): void {
    this._phase = phase;
  }

  // ---- Component Management ----

  addComponent(type: ComponentType, position: GridPosition): Component | null {
    const def = COMPONENT_DEFS[type];
    if (!def) return null;

    // Budget check
    if (this.state.budget.remaining < def.monthlyCost) return null;

    const component: Component = {
      id: uid('comp'),
      type,
      position,
      load: 0,
      health: 'healthy',
      stats: {
        requestsPerSecond: 0,
        latencyMs: def.defaultLatencyMs,
        throughputLimit: def.throughputLimit,
      },
      monthlyCost: def.monthlyCost,
    };

    this.state.components.push(component);
    this.state.budget.monthlySpent += def.monthlyCost;
    this.state.budget.remaining = this.state.budget.monthlyLimit - this.state.budget.monthlySpent;

    return component;
  }

  removeComponent(id: string): boolean {
    const idx = this.state.components.findIndex((c) => c.id === id);
    if (idx === -1) return false;

    const comp = this.state.components[idx];
    this.state.budget.monthlySpent -= comp.monthlyCost;
    this.state.budget.remaining = this.state.budget.monthlyLimit - this.state.budget.monthlySpent;

    // Remove associated connections
    this.state.connections = this.state.connections.filter(
      (c) => c.fromComponentId !== id && c.toComponentId !== id,
    );

    // Remove associated particles
    const removedConnIds = new Set(
      this.state.connections
        .filter((c) => c.fromComponentId === id || c.toComponentId === id)
        .map((c) => c.id),
    );
    this.state.particles = this.state.particles.filter(
      (p) => !removedConnIds.has(p.connectionId) && p.stuckInComponent !== id,
    );

    this.state.components.splice(idx, 1);
    return true;
  }

  moveComponent(id: string, position: GridPosition): boolean {
    const comp = this.state.components.find((c) => c.id === id);
    if (!comp) return false;
    comp.position = position;
    return true;
  }

  getComponent(id: string): Component | undefined {
    return this.state.components.find((c) => c.id === id);
  }

  // ---- Connection Management ----

  connect(
    fromComponentId: string,
    fromPort: PortPosition,
    toComponentId: string,
    toPort: PortPosition,
  ): Connection | null {
    // Verify both components exist
    let from = this.state.components.find((c) => c.id === fromComponentId);
    let to = this.state.components.find((c) => c.id === toComponentId);
    if (!from || !to) return null;

    // Don't allow self-connections
    if (fromComponentId === toComponentId) return null;

    // Auto-orient: infer direction so user click order doesn't matter.
    // Traffic flows from → to. Priority:
    //   1. Client is always "from" (traffic source)
    //   2. Database is always "to" (traffic sink)
    //   3. Otherwise, leftmost (then topmost) component is "from"
    if (this.shouldSwapDirection(from, to)) {
      [from, to] = [to, from];
      [fromComponentId, toComponentId] = [toComponentId, fromComponentId];
      [fromPort, toPort] = [toPort, fromPort];
    }

    // Check for duplicate connection between these two components (either direction)
    const duplicate = this.state.connections.find(
      (c) =>
        (c.fromComponentId === fromComponentId && c.toComponentId === toComponentId) ||
        (c.fromComponentId === toComponentId && c.toComponentId === fromComponentId),
    );
    if (duplicate) return null;

    const connection: Connection = {
      id: uid('conn'),
      fromComponentId,
      fromPort,
      toComponentId,
      toPort,
      trafficRate: 0,
    };

    this.state.connections.push(connection);
    return connection;
  }

  /** Returns true if from/to should be swapped to get natural traffic flow direction */
  private shouldSwapDirection(from: Component, to: Component): boolean {
    // Fixed roles: Client is always source, Database is always sink
    if (from.type === 'database' && to.type !== 'database') return true;
    if (to.type === 'client') return true;
    if (from.type === 'client' || to.type === 'database') return false;

    // Everything else: use spatial position (left-to-right, then top-to-bottom)
    // The user's grid placement reflects their intended traffic flow
    if (from.position.col !== to.position.col) {
      return from.position.col > to.position.col;
    }
    return from.position.row > to.position.row;
  }

  disconnect(connectionId: string): boolean {
    const idx = this.state.connections.findIndex((c) => c.id === connectionId);
    if (idx === -1) return false;

    // Remove particles on this connection
    this.state.particles = this.state.particles.filter(
      (p) => p.connectionId !== connectionId,
    );

    this.state.connections.splice(idx, 1);
    return true;
  }

  getConnectionsFor(componentId: string): Connection[] {
    return this.state.connections.filter(
      (c) => c.fromComponentId === componentId || c.toComponentId === componentId,
    );
  }

  // ---- Simulation Control ----

  startSimulation(): void {
    if (this.state.simulation.status !== 'building' && this.state.simulation.status !== 'paused') {
      return;
    }
    this.state.simulation.status = 'running';
    this._phase = 'running';
  }

  pauseSimulation(): void {
    if (this.state.simulation.status !== 'running') return;
    this.state.simulation.status = 'paused';
    this._phase = 'paused';
  }

  completeSimulation(): void {
    this.state.simulation.status = 'complete';
    this._phase = 'debrief';
  }

  // ---- Events ----

  addEvent(event: GameEvent): void {
    this.state.events.push(event);
  }

  removeEvent(eventId: string): void {
    this.state.events = this.state.events.filter((e) => e.id !== eventId);
  }

  getActiveEvents(): GameEvent[] {
    return this.state.events.filter((e) => e.active);
  }

  // ---- Particles ----

  addParticle(particle: Particle): void {
    this.state.particles.push(particle);
  }

  removeParticle(particleId: string): void {
    this.state.particles = this.state.particles.filter((p) => p.id !== particleId);
  }

  // ---- Budget ----

  getBudget(): Budget {
    return { ...this.state.budget };
  }

  setBudgetLimit(limit: number): void {
    this.state.budget.monthlyLimit = limit;
    this.state.budget.remaining = limit - this.state.budget.monthlySpent;
  }

  // ---- Level ----

  setLevelId(levelId: string): void {
    this.state.levelId = levelId;
  }

  // ---- Reset ----

  reset(budgetLimit: number = 500): void {
    this.state = {
      components: [],
      connections: [],
      particles: [],
      budget: createDefaultBudget(budgetLimit),
      events: [],
      score: createDefaultScore(),
      simulation: createDefaultSimulation(),
      levelId: null,
    };
    this._phase = 'building';
    nextId = 1;
  }
}
