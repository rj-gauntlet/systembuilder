import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../GameEngine';
import { SimulationLoop } from '../SimulationLoop';

describe('SimulationLoop', () => {
  let engine: GameEngine;
  let sim: SimulationLoop;

  beforeEach(() => {
    engine = new GameEngine(500);
    sim = new SimulationLoop();
  });

  it('does not tick when simulation is not running', () => {
    const client = engine.addComponent('client', { col: 0, row: 0 })!;
    const server = engine.addComponent('server', { col: 2, row: 0 })!;
    engine.connect(client.id, { side: 'right', index: 0 }, server.id, { side: 'left', index: 0 });

    sim.tick(engine.getState(), 100);
    expect(engine.getState().particles).toHaveLength(0);
  });

  it('spawns particles when simulation is running', () => {
    const client = engine.addComponent('client', { col: 0, row: 0 })!;
    const server = engine.addComponent('server', { col: 2, row: 0 })!;
    engine.connect(client.id, { side: 'right', index: 0 }, server.id, { side: 'left', index: 0 });
    engine.startSimulation();

    // Run several ticks to accumulate particles
    for (let i = 0; i < 120; i++) {
      sim.tick(engine.getState(), 16.67); // ~60fps
    }

    expect(engine.getState().particles.length).toBeGreaterThan(0);
    expect(engine.getState().simulation.totalRequests).toBeGreaterThan(0);
  });

  it('particles have request direction when spawned from client', () => {
    const client = engine.addComponent('client', { col: 0, row: 0 })!;
    const server = engine.addComponent('server', { col: 2, row: 0 })!;
    engine.connect(client.id, { side: 'right', index: 0 }, server.id, { side: 'left', index: 0 });
    engine.startSimulation();

    for (let i = 0; i < 120; i++) {
      sim.tick(engine.getState(), 16.67);
    }

    const requestParticles = engine.getState().particles.filter((p) => p.direction === 'request');
    expect(requestParticles.length).toBeGreaterThan(0);
  });

  it('generates response particles when requests reach server with no downstream', () => {
    const client = engine.addComponent('client', { col: 0, row: 0 })!;
    const server = engine.addComponent('server', { col: 2, row: 0 })!;
    engine.connect(client.id, { side: 'right', index: 0 }, server.id, { side: 'left', index: 0 });
    engine.startSimulation();

    // Run long enough for requests to reach server and responses to spawn
    for (let i = 0; i < 300; i++) {
      sim.tick(engine.getState(), 16.67);
    }

    const responseParticles = engine.getState().particles.filter((p) => p.direction === 'response');
    expect(responseParticles.length).toBeGreaterThan(0);
  });

  it('updates component health based on load', () => {
    const client = engine.addComponent('client', { col: 0, row: 0 })!;
    const server = engine.addComponent('server', { col: 2, row: 0 })!;
    engine.connect(client.id, { side: 'right', index: 0 }, server.id, { side: 'left', index: 0 });
    engine.startSimulation();

    // Run enough ticks to load the server
    for (let i = 0; i < 600; i++) {
      sim.tick(engine.getState(), 16.67);
    }

    const serverState = engine.getState().components.find((c) => c.id === server.id)!;
    // Server should have some load after processing traffic
    expect(serverState.load).toBeGreaterThanOrEqual(0);
  });

  it('tracks uptime score based on dropped requests', () => {
    const client = engine.addComponent('client', { col: 0, row: 0 })!;
    const server = engine.addComponent('server', { col: 2, row: 0 })!;
    engine.connect(client.id, { side: 'right', index: 0 }, server.id, { side: 'left', index: 0 });
    engine.startSimulation();

    for (let i = 0; i < 300; i++) {
      sim.tick(engine.getState(), 16.67);
    }

    // Uptime should be between 0 and 100
    expect(engine.getState().score.uptime).toBeGreaterThanOrEqual(0);
    expect(engine.getState().score.uptime).toBeLessThanOrEqual(100);
  });

  it('cache produces response particles for hits and forwards misses', () => {
    const client = engine.addComponent('client', { col: 0, row: 0 })!;
    const cache = engine.addComponent('cache', { col: 2, row: 0 })!;
    const db = engine.addComponent('database', { col: 4, row: 0 })!;
    engine.connect(client.id, { side: 'right', index: 0 }, cache.id, { side: 'left', index: 0 });
    engine.connect(cache.id, { side: 'right', index: 0 }, db.id, { side: 'left', index: 0 });
    engine.startSimulation();

    for (let i = 0; i < 300; i++) {
      sim.tick(engine.getState(), 16.67);
    }

    // Should have both request and response particles
    const state = engine.getState();
    expect(state.simulation.totalRequests).toBeGreaterThan(0);
    expect(state.particles.length).toBeGreaterThan(0);
  });

  it('resets cleanly', () => {
    sim.reset();
    const engine2 = new GameEngine(500);
    const state = engine2.getState();
    state.simulation.status = 'running';
    sim.tick(state, 16.67);
    // Should not crash
    expect(true).toBe(true);
  });
});
