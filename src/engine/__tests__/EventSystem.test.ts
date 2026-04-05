import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../GameEngine';
import { EventSystem } from '../EventSystem';
import { urlShortener } from '../../levels/beginner/url-shortener';

describe('EventSystem', () => {
  let engine: GameEngine;
  let eventSystem: EventSystem;

  beforeEach(() => {
    engine = new GameEngine(300);
    eventSystem = new EventSystem();
    eventSystem.loadLevel(urlShortener);
  });

  it('fires scripted events at the correct time', () => {
    const state = engine.getState();
    state.simulation.status = 'running';

    // Before trigger time — no events
    state.simulation.elapsedTime = 10;
    eventSystem.update(state);
    expect(state.events.filter((e) => e.active)).toHaveLength(0);

    // At first trigger time (20s) — first event fires
    state.simulation.elapsedTime = 21;
    eventSystem.update(state);
    expect(state.events.filter((e) => e.active)).toHaveLength(1);
    expect(state.events[0].title).toBe('Viral Link!');
  });

  it('fires second scripted event at its trigger time', () => {
    const state = engine.getState();
    state.simulation.status = 'running';

    state.simulation.elapsedTime = 51;
    eventSystem.update(state);

    const activeEvents = state.events.filter((e) => e.active);
    expect(activeEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('does not fire events when simulation is not running', () => {
    const state = engine.getState();
    state.simulation.status = 'paused';
    state.simulation.elapsedTime = 25;
    eventSystem.update(state);
    expect(state.events).toHaveLength(0);
  });

  it('deactivates events after their duration expires', () => {
    const state = engine.getState();
    state.simulation.status = 'running';

    state.simulation.elapsedTime = 21;
    eventSystem.update(state);
    expect(state.events[0].active).toBe(true);

    // Tick until timeRemaining runs out
    for (let i = 0; i < 1000; i++) {
      eventSystem.update(state);
    }
    expect(state.events[0].active).toBe(false);
  });

  it('resets cleanly', () => {
    eventSystem.reset();
    const state = engine.getState();
    state.simulation.status = 'running';
    state.simulation.elapsedTime = 25;
    eventSystem.update(state);
    // No events loaded after reset
    expect(state.events).toHaveLength(0);
  });
});
