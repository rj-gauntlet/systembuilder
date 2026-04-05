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
      }
    }

    // Apply active event effects
    this.applyEffects(state);
  }

  private applyEffects(state: GameState): void {
    // Reset any event-modified state first
    // (effects are re-applied each tick while active)
    for (const event of state.events) {
      if (!event.active) continue;

      for (const effect of event.effects) {
        switch (effect.type) {
          case 'multiply-traffic': {
            // Increase client throughput temporarily
            const clients = state.components.filter((c) => c.type === 'client');
            for (const client of clients) {
              client.stats.throughputLimit = Math.round(
                client.stats.throughputLimit * (effect.multiplier ?? 2),
              );
            }
            break;
          }
          case 'disable-component': {
            if (effect.targetComponentId) {
              const comp = state.components.find((c) => c.id === effect.targetComponentId);
              if (comp) comp.health = 'failed';
            } else if (effect.targetComponentType) {
              // Disable a random component of this type
              const candidates = state.components.filter(
                (c) => c.type === effect.targetComponentType && c.health !== 'failed',
              );
              if (candidates.length > 0) {
                const target = candidates[Math.floor(Math.random() * candidates.length)];
                target.health = 'failed';
              }
            }
            break;
          }
          case 'increase-latency': {
            const targets = effect.targetComponentType
              ? state.components.filter((c) => c.type === effect.targetComponentType)
              : state.components;
            for (const comp of targets) {
              comp.stats.latencyMs *= effect.multiplier ?? 3;
            }
            break;
          }
          case 'flood-requests': {
            // Handled by multiply-traffic on clients — flood is a more extreme version
            const clients = state.components.filter((c) => c.type === 'client');
            for (const client of clients) {
              client.stats.throughputLimit = Math.round(
                client.stats.throughputLimit * (effect.multiplier ?? 5),
              );
            }
            break;
          }
        }
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
    nextEventId = 1;
  }
}
