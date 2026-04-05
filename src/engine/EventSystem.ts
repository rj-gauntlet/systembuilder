import type { GameState, GameEvent, EventType, LevelDefinition, ScriptedEvent } from './types';

let nextEventId = 1;
function eventUid(): string {
  return `evt_${nextEventId++}`;
}

const RANDOM_EVENT_MIN_INTERVAL = 15; // seconds between random events
const RANDOM_EVENT_MAX_INTERVAL = 30;

export class EventSystem {
  private scriptedEvents: ScriptedEvent[] = [];
  private firedScripted: Set<number> = new Set();
  private randomPool: EventType[] = [];
  private nextRandomTime = 0;
  private scriptedComplete = false;
  private disabledByEvent: Map<string, string> = new Map(); // eventId → componentId
  private baseThroughputs: Map<string, number> = new Map(); // componentId → original throughputLimit
  private baseWriteRatio: number | null = null;

  loadLevel(level: LevelDefinition): void {
    this.scriptedEvents = [...level.scriptedEvents];
    this.randomPool = [...level.randomEventPool];
    this.firedScripted = new Set();
    this.scriptedComplete = false;
    this.nextRandomTime = 0;
    nextEventId = 1;
  }

  update(state: GameState): void {
    if (state.simulation.status !== 'running') return;

    const elapsed = state.simulation.elapsedTime;

    // Fire scripted events
    for (let i = 0; i < this.scriptedEvents.length; i++) {
      if (this.firedScripted.has(i)) continue;
      const scripted = this.scriptedEvents[i];
      if (elapsed >= scripted.triggerTime) {
        this.firedScripted.add(i);
        const event: GameEvent = {
          ...scripted.event,
          id: eventUid(),
          active: true,
          timeRemaining: scripted.event.effects.reduce(
            (max, e) => Math.max(max, e.durationMs / 1000),
            10,
          ),
        };
        state.events.push(event);
      }
    }

    // Check if all scripted events have fired
    if (!this.scriptedComplete && this.firedScripted.size >= this.scriptedEvents.length) {
      this.scriptedComplete = true;
      this.nextRandomTime = elapsed + this.randomInterval();
    }

    // Fire random events after scripted sequence completes
    if (this.scriptedComplete && this.randomPool.length > 0 && elapsed >= this.nextRandomTime) {
      const type = this.randomPool[Math.floor(Math.random() * this.randomPool.length)];
      const event = this.createRandomEvent(type);
      state.events.push(event);
      this.nextRandomTime = elapsed + this.randomInterval();
    }

    // Tick active events
    for (const event of state.events) {
      if (!event.active) continue;
      event.timeRemaining -= 1 / 60; // assuming 60fps tick
      if (event.timeRemaining <= 0) {
        event.active = false;

        // Restore components disabled by this event
        const disabledId = this.disabledByEvent.get(event.id);
        if (disabledId) {
          const comp = state.components.find((c) => c.id === disabledId);
          if (comp && comp.health === 'failed') {
            comp.health = 'healthy';
          }
          this.disabledByEvent.delete(event.id);
        }
      }
    }

    // Apply active event effects
    this.applyEffects(state);
  }

  private applyEffects(state: GameState): void {
    // Snapshot base throughput on first call (events modify it, need to reset each tick)
    for (const comp of state.components) {
      if (!this.baseThroughputs.has(comp.id)) {
        this.baseThroughputs.set(comp.id, comp.stats.throughputLimit);
      }
    }

    // Reset throughput and writeRatio to base before applying active effects
    for (const comp of state.components) {
      comp.stats.throughputLimit = this.baseThroughputs.get(comp.id) ?? comp.stats.throughputLimit;
    }
    if (this.baseWriteRatio === null) {
      this.baseWriteRatio = state.writeRatio;
    }
    state.writeRatio = this.baseWriteRatio;

    // Accumulate multipliers from all active effects, then apply once
    const throughputMultipliers: Map<string, number> = new Map();
    const latencyMultipliers: Map<string, number> = new Map();

    for (const event of state.events) {
      if (!event.active) continue;

      for (const effect of event.effects) {
        switch (effect.type) {
          case 'multiply-traffic':
          case 'flood-requests': {
            const clients = state.components.filter((c) => c.type === 'client');
            for (const client of clients) {
              const current = throughputMultipliers.get(client.id) ?? 1;
              throughputMultipliers.set(client.id, current * (effect.multiplier ?? 2));
            }
            break;
          }
          case 'disable-component': {
            // Lock target on first tick — don't re-roll each tick
            const alreadyTargeted = this.disabledByEvent.get(event.id);
            if (alreadyTargeted) {
              // Keep the already-targeted component failed
              const comp = state.components.find((c) => c.id === alreadyTargeted);
              if (comp) comp.health = 'failed';
            } else if (effect.targetComponentId) {
              const comp = state.components.find((c) => c.id === effect.targetComponentId);
              if (comp) {
                comp.health = 'failed';
                this.disabledByEvent.set(event.id, comp.id);
              }
            } else if (effect.targetComponentType) {
              const candidates = state.components.filter(
                (c) => c.type === effect.targetComponentType && c.health !== 'failed',
              );
              if (candidates.length > 0) {
                const target = candidates[Math.floor(Math.random() * candidates.length)];
                target.health = 'failed';
                this.disabledByEvent.set(event.id, target.id);
              }
            }
            break;
          }
          case 'increase-latency': {
            const targets = effect.targetComponentType
              ? state.components.filter((c) => c.type === effect.targetComponentType)
              : state.components;
            for (const comp of targets) {
              const current = latencyMultipliers.get(comp.id) ?? 1;
              latencyMultipliers.set(comp.id, current * (effect.multiplier ?? 3));
            }
            break;
          }
          case 'write-storm': {
            // Temporarily push write ratio very high — caches become useless
            state.writeRatio = Math.min(0.95, state.writeRatio + (effect.multiplier ?? 0.3));
            break;
          }
        }
      }
    }

    // Apply accumulated multipliers from base values (not compounding)
    for (const comp of state.components) {
      const tm = throughputMultipliers.get(comp.id);
      if (tm) {
        const base = this.baseThroughputs.get(comp.id) ?? comp.stats.throughputLimit;
        comp.stats.throughputLimit = Math.round(base * tm);
      }
      const lm = latencyMultipliers.get(comp.id);
      if (lm) {
        comp.stats.latencyMs *= lm;
      }
    }
  }

  private createRandomEvent(type: EventType): GameEvent {
    const templates: Record<EventType, { title: string; description: string; effects: GameEvent['effects'] }> = {
      'traffic-spike': {
        title: 'Traffic Spike!',
        description: 'A sudden surge of users is hitting your system.',
        effects: [{ type: 'multiply-traffic', multiplier: 3, durationMs: 10000 }],
      },
      'ddos-attack': {
        title: 'DDoS Attack!',
        description: 'Malicious traffic is flooding your infrastructure.',
        effects: [{ type: 'flood-requests', multiplier: 5, durationMs: 12000 }],
      },
      'node-failure': {
        title: 'Node Failure!',
        description: 'One of your servers has crashed.',
        effects: [{ type: 'disable-component', targetComponentType: 'server', durationMs: 15000 }],
      },
      'viral-content': {
        title: 'Viral Content!',
        description: 'Your app is trending. Traffic is steadily climbing.',
        effects: [{ type: 'multiply-traffic', multiplier: 4, durationMs: 20000 }],
      },
      'region-outage': {
        title: 'Region Outage!',
        description: 'A cloud region is experiencing issues.',
        effects: [{ type: 'disable-component', targetComponentType: 'server', durationMs: 18000 }],
      },
      'slow-query': {
        title: 'Slow Queries!',
        description: 'Database queries are taking much longer than usual.',
        effects: [{ type: 'increase-latency', targetComponentType: 'database', multiplier: 4, durationMs: 12000 }],
      },
      'write-storm': {
        title: 'Write Storm!',
        description: 'A massive burst of write operations is flooding your system. Caches can\'t help with writes.',
        effects: [{ type: 'write-storm', multiplier: 0.35, durationMs: 15000 }],
      },
    };

    const template = templates[type];
    return {
      id: eventUid(),
      type,
      title: template.title,
      description: template.description,
      active: true,
      timeRemaining: template.effects[0].durationMs / 1000,
      effects: template.effects,
    };
  }

  private randomInterval(): number {
    return RANDOM_EVENT_MIN_INTERVAL + Math.random() * (RANDOM_EVENT_MAX_INTERVAL - RANDOM_EVENT_MIN_INTERVAL);
  }

  reset(): void {
    this.scriptedEvents = [];
    this.firedScripted.clear();
    this.randomPool = [];
    this.scriptedComplete = false;
    this.nextRandomTime = 0;
    this.disabledByEvent.clear();
    this.baseThroughputs.clear();
    this.baseWriteRatio = null;
    nextEventId = 1;
  }
}
