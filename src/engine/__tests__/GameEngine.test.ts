import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../GameEngine';

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(500);
  });

  describe('getState', () => {
    it('returns a valid initial GameState', () => {
      const state = engine.getState();
      expect(state.components).toEqual([]);
      expect(state.connections).toEqual([]);
      expect(state.particles).toEqual([]);
      expect(state.budget).toEqual({ monthlyLimit: 500, monthlySpent: 0, remaining: 500 });
      expect(state.simulation.status).toBe('building');
      expect(state.score.stars).toBe(0);
    });
  });

  describe('addComponent', () => {
    it('adds a component and returns it', () => {
      const comp = engine.addComponent('server', { col: 2, row: 3 });
      expect(comp).not.toBeNull();
      expect(comp!.type).toBe('server');
      expect(comp!.position).toEqual({ col: 2, row: 3 });
      expect(engine.getState().components).toHaveLength(1);
    });

    it('deducts cost from budget', () => {
      engine.addComponent('server', { col: 0, row: 0 }); // $50
      expect(engine.getState().budget.monthlySpent).toBe(50);
      expect(engine.getState().budget.remaining).toBe(450);
    });

    it('returns null if budget insufficient', () => {
      const engine2 = new GameEngine(30); // only $30 budget
      const comp = engine2.addComponent('server', { col: 0, row: 0 }); // costs $50
      expect(comp).toBeNull();
      expect(engine2.getState().components).toHaveLength(0);
    });

    it('adds a free client component', () => {
      const comp = engine.addComponent('client', { col: 0, row: 0 });
      expect(comp).not.toBeNull();
      expect(comp!.monthlyCost).toBe(0);
      expect(engine.getState().budget.remaining).toBe(500);
    });
  });

  describe('removeComponent', () => {
    it('removes a component and refunds budget', () => {
      const comp = engine.addComponent('server', { col: 0, row: 0 })!;
      expect(engine.getState().budget.remaining).toBe(450);

      engine.removeComponent(comp.id);
      expect(engine.getState().components).toHaveLength(0);
      expect(engine.getState().budget.remaining).toBe(500);
    });

    it('returns false for non-existent component', () => {
      expect(engine.removeComponent('fake_id')).toBe(false);
    });
  });

  describe('moveComponent', () => {
    it('moves a component to a new position', () => {
      const comp = engine.addComponent('server', { col: 0, row: 0 })!;
      engine.moveComponent(comp.id, { col: 5, row: 5 });
      expect(engine.getComponent(comp.id)!.position).toEqual({ col: 5, row: 5 });
    });
  });

  describe('connect', () => {
    it('creates a connection between two components', () => {
      const a = engine.addComponent('client', { col: 0, row: 0 })!;
      const b = engine.addComponent('server', { col: 2, row: 0 })!;

      const conn = engine.connect(
        a.id,
        { side: 'right', index: 0 },
        b.id,
        { side: 'left', index: 0 },
      );

      expect(conn).not.toBeNull();
      expect(engine.getState().connections).toHaveLength(1);
    });

    it('rejects self-connections', () => {
      const a = engine.addComponent('server', { col: 0, row: 0 })!;
      const conn = engine.connect(
        a.id,
        { side: 'right', index: 0 },
        a.id,
        { side: 'left', index: 0 },
      );
      expect(conn).toBeNull();
    });

    it('rejects duplicate connections on same ports', () => {
      const a = engine.addComponent('client', { col: 0, row: 0 })!;
      const b = engine.addComponent('server', { col: 2, row: 0 })!;

      engine.connect(a.id, { side: 'right', index: 0 }, b.id, { side: 'left', index: 0 });
      const dup = engine.connect(a.id, { side: 'right', index: 0 }, b.id, { side: 'left', index: 0 });
      expect(dup).toBeNull();
    });
  });

  describe('disconnect', () => {
    it('removes a connection', () => {
      const a = engine.addComponent('client', { col: 0, row: 0 })!;
      const b = engine.addComponent('server', { col: 2, row: 0 })!;
      const conn = engine.connect(a.id, { side: 'right', index: 0 }, b.id, { side: 'left', index: 0 })!;

      engine.disconnect(conn.id);
      expect(engine.getState().connections).toHaveLength(0);
    });
  });

  describe('simulation control', () => {
    it('starts simulation from building state', () => {
      engine.startSimulation();
      expect(engine.getState().simulation.status).toBe('running');
      expect(engine.phase).toBe('running');
    });

    it('pauses running simulation', () => {
      engine.startSimulation();
      engine.pauseSimulation();
      expect(engine.getState().simulation.status).toBe('paused');
    });

    it('resumes paused simulation', () => {
      engine.startSimulation();
      engine.pauseSimulation();
      engine.startSimulation();
      expect(engine.getState().simulation.status).toBe('running');
    });

    it('completes simulation', () => {
      engine.startSimulation();
      engine.completeSimulation();
      expect(engine.getState().simulation.status).toBe('complete');
      expect(engine.phase).toBe('debrief');
    });
  });

  describe('reset', () => {
    it('resets to clean state', () => {
      engine.addComponent('server', { col: 0, row: 0 });
      engine.startSimulation();
      engine.reset(1000);

      const state = engine.getState();
      expect(state.components).toHaveLength(0);
      expect(state.budget.monthlyLimit).toBe(1000);
      expect(state.simulation.status).toBe('building');
    });
  });
});
