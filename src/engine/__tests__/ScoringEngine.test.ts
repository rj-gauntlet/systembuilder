import { describe, it, expect } from 'vitest';
import { GameEngine } from '../GameEngine';
import { ScoringEngine } from '../ScoringEngine';
import { urlShortener } from '../../levels/beginner/url-shortener';

describe('ScoringEngine', () => {
  const scorer = new ScoringEngine();

  it('awards 3 stars for perfect performance', () => {
    const engine = new GameEngine(300);
    engine.addComponent('client', { col: 0, row: 0 });
    const server = engine.addComponent('server', { col: 2, row: 0 })!;

    const state = engine.getState();
    state.simulation.totalRequests = 1000;
    state.simulation.droppedRequests = 5;
    state.budget.monthlySpent = 150;
    server.stats.requestsPerSecond = 100;
    server.stats.latencyMs = 20;

    const score = scorer.calculateScore(state, urlShortener);
    expect(score.uptime).toBeGreaterThan(98);
    expect(score.stars).toBe(3);
  });

  it('awards 0 stars for terrible performance', () => {
    const engine = new GameEngine(300);
    engine.addComponent('client', { col: 0, row: 0 });
    const server = engine.addComponent('server', { col: 2, row: 0 })!;
    server.health = 'failed';

    const state = engine.getState();
    state.simulation.totalRequests = 100;
    state.simulation.droppedRequests = 80;
    state.budget.monthlySpent = 500;
    server.stats.requestsPerSecond = 10;
    server.stats.latencyMs = 500;

    const score = scorer.calculateScore(state, urlShortener);
    expect(score.stars).toBe(0);
  });

  it('calculates uptime correctly', () => {
    const engine = new GameEngine(300);
    const state = engine.getState();
    state.simulation.totalRequests = 200;
    state.simulation.droppedRequests = 20;

    const score = scorer.calculateScore(state, urlShortener);
    expect(score.uptime).toBe(90);
  });

  it('tracks survival based on failed components', () => {
    const engine = new GameEngine(300);
    const server = engine.addComponent('server', { col: 0, row: 0 })!;
    server.health = 'failed';

    const state = engine.getState();
    state.simulation.totalRequests = 100;
    state.simulation.droppedRequests = 0;

    const score = scorer.calculateScore(state, urlShortener);
    expect(score.survival).toBe(false);
  });
});
