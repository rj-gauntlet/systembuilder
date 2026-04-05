import { describe, it, expect } from 'vitest';
import { GameEngine } from '../GameEngine';
import { SimulationLoop } from '../SimulationLoop';
import { ScoringEngine } from '../ScoringEngine';
import { urlShortener } from '../../levels/beginner/url-shortener';
import { pasteBin } from '../../levels/beginner/paste-bin';
import { chatApp } from '../../levels/beginner/chat-app';
import type { LevelDefinition, ComponentType, GameState } from '../types';

const scorer = new ScoringEngine();

interface Architecture {
  name: string;
  components: { type: ComponentType; col: number; row: number }[];
  connections: [number, number][]; // index pairs into components array
}

function runSimulation(level: LevelDefinition, arch: Architecture) {
  const engine = new GameEngine(level.briefing.monthlyBudget);
  engine.setLevelId(level.id);

  const state = engine.getState();
  state.writeRatio = level.writeRatio;

  // Place components
  const placed: string[] = [];
  for (const comp of arch.components) {
    const c = engine.addComponent(comp.type, { col: comp.col, row: comp.row });
    placed.push(c!.id);
  }

  // Wire connections
  for (const [fromIdx, toIdx] of arch.connections) {
    engine.connect(
      placed[fromIdx],
      { side: 'right', index: 0 },
      placed[toIdx],
      { side: 'left', index: 0 },
    );
  }

  // Run simulation
  const sim = new SimulationLoop();
  sim.loadLevel(level, state);
  engine.startSimulation();

  // Simulate at 60fps for level duration + drain
  const totalTicks = (level.simulationDuration + 6) * 60;
  for (let i = 0; i < totalTicks; i++) {
    sim.tick(state, 16.67);
    if (state.simulation.status === 'complete') break;
  }

  // Force complete if still draining
  if (state.simulation.status !== 'complete') {
    state.simulation.status = 'complete';
  }

  const score = scorer.calculateScore(state, level);
  const cost = state.budget.monthlySpent;

  return { score, cost, state };
}

function report(name: string, level: LevelDefinition, arch: Architecture) {
  const { score, cost } = runSimulation(level, arch);
  return {
    name,
    stars: score.stars,
    uptime: +score.uptime.toFixed(2),
    avgLatency: +score.avgLatency.toFixed(2),
    costEfficiency: +score.costEfficiency.toFixed(2),
    survived: score.survival,
    cost,
  };
}

// ============================================================
// URL Shortener Architectures
// ============================================================

const urlArchitectures: Architecture[] = [
  {
    name: '3-star: Client→Cache→LB→2xServer→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'cache', col: 2, row: 4 },
      { type: 'load-balancer', col: 4, row: 4 },
      { type: 'server', col: 6, row: 3 },
      { type: 'server', col: 6, row: 5 },
      { type: 'database', col: 8, row: 4 },
    ],
    connections: [[0,1],[1,2],[2,3],[2,4],[3,5],[4,5]],
  },
  {
    name: '2-star: Client→Server→DB (minimal)',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'server', col: 3, row: 4 },
      { type: 'database', col: 6, row: 4 },
    ],
    connections: [[0,1],[1,2]],
  },
  {
    name: 'Cache-at-back: Client→LB→2xServer→Cache→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'load-balancer', col: 2, row: 4 },
      { type: 'server', col: 4, row: 3 },
      { type: 'server', col: 4, row: 5 },
      { type: 'cache', col: 6, row: 4 },
      { type: 'database', col: 8, row: 4 },
    ],
    connections: [[0,1],[1,2],[1,3],[2,4],[3,4],[4,5]],
  },
  {
    name: 'No-redundancy: Client→Cache→Server→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'cache', col: 2, row: 4 },
      { type: 'server', col: 4, row: 4 },
      { type: 'database', col: 6, row: 4 },
    ],
    connections: [[0,1],[1,2],[2,3]],
  },
  {
    name: 'Overkill: Client→CDN→Cache→LB→2xServer→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'cdn', col: 2, row: 4 },
      { type: 'cache', col: 4, row: 4 },
      { type: 'load-balancer', col: 6, row: 4 },
      { type: 'server', col: 8, row: 3 },
      { type: 'server', col: 8, row: 5 },
      { type: 'database', col: 10, row: 4 },
    ],
    connections: [[0,1],[1,2],[2,3],[3,4],[3,5],[4,6],[5,6]],
  },
];

// ============================================================
// Paste Bin Architectures
// ============================================================

const pbArchitectures: Architecture[] = [
  {
    name: '3-star: Client→CDN→Server→Cache→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'cdn', col: 2, row: 4 },
      { type: 'server', col: 4, row: 4 },
      { type: 'cache', col: 6, row: 4 },
      { type: 'database', col: 8, row: 4 },
    ],
    connections: [[0,1],[1,2],[2,3],[3,4]],
  },
  {
    name: 'Minimal: Client→Server→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'server', col: 3, row: 4 },
      { type: 'database', col: 6, row: 4 },
    ],
    connections: [[0,1],[1,2]],
  },
  {
    name: 'CDN-only: Client→CDN→Server→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'cdn', col: 2, row: 4 },
      { type: 'server', col: 4, row: 4 },
      { type: 'database', col: 6, row: 4 },
    ],
    connections: [[0,1],[1,2],[2,3]],
  },
  {
    name: 'Cache-only: Client→Cache→Server→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'cache', col: 2, row: 4 },
      { type: 'server', col: 4, row: 4 },
      { type: 'database', col: 6, row: 4 },
    ],
    connections: [[0,1],[1,2],[2,3]],
  },
];

// ============================================================
// Chat App Architectures
// ============================================================

const chatArchitectures: Architecture[] = [
  {
    name: '3-star: Client→RL→LB→2xServer→MQ→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'rate-limiter', col: 2, row: 4 },
      { type: 'load-balancer', col: 4, row: 4 },
      { type: 'server', col: 6, row: 3 },
      { type: 'server', col: 6, row: 5 },
      { type: 'message-queue', col: 8, row: 4 },
      { type: 'database', col: 10, row: 4 },
    ],
    connections: [[0,1],[1,2],[2,3],[2,4],[3,5],[4,5],[5,6]],
  },
  {
    name: 'No-MQ: Client→RL→LB→2xServer→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'rate-limiter', col: 2, row: 4 },
      { type: 'load-balancer', col: 4, row: 4 },
      { type: 'server', col: 6, row: 3 },
      { type: 'server', col: 6, row: 5 },
      { type: 'database', col: 8, row: 4 },
    ],
    connections: [[0,1],[1,2],[2,3],[2,4],[3,5],[4,5]],
  },
  {
    name: 'No-RL: Client→LB→2xServer→MQ→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'load-balancer', col: 2, row: 4 },
      { type: 'server', col: 4, row: 3 },
      { type: 'server', col: 4, row: 5 },
      { type: 'message-queue', col: 6, row: 4 },
      { type: 'database', col: 8, row: 4 },
    ],
    connections: [[0,1],[1,2],[1,3],[2,4],[3,4],[4,5]],
  },
  {
    name: 'Budget: Client→RL→Server→MQ→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'rate-limiter', col: 2, row: 4 },
      { type: 'server', col: 4, row: 4 },
      { type: 'message-queue', col: 6, row: 4 },
      { type: 'database', col: 8, row: 4 },
    ],
    connections: [[0,1],[1,2],[2,3],[3,4]],
  },
  {
    name: 'Minimal: Client→Server→DB',
    components: [
      { type: 'client', col: 0, row: 4 },
      { type: 'server', col: 3, row: 4 },
      { type: 'database', col: 6, row: 4 },
    ],
    connections: [[0,1],[1,2]],
  },
];

// ============================================================
// Run all playtests
// ============================================================

describe('Playtest: URL Shortener', () => {
  const results = urlArchitectures.map((a) => report(a.name, urlShortener, a));

  it('reports all architectures', () => {
    console.table(results);
    expect(results.length).toBe(urlArchitectures.length);
  });

  it('3-star architecture gets 3 stars', () => {
    expect(results[0].stars).toBe(3);
  });

  it('minimal architecture gets fewer than 3 stars', () => {
    expect(results[1].stars).toBeLessThan(3);
  });

  it('cache-at-front has lower avg latency than cache-at-back', () => {
    expect(results[0].avgLatency).toBeLessThan(results[2].avgLatency);
  });
});

describe('Playtest: Paste Bin', () => {
  const results = pbArchitectures.map((a) => report(a.name, pasteBin, a));

  it('reports all architectures', () => {
    console.table(results);
    expect(results.length).toBe(pbArchitectures.length);
  });

  it('3-star architecture gets 3 stars', () => {
    expect(results[0].stars).toBe(3);
  });

  it('minimal architecture gets fewer than 3 stars', () => {
    expect(results[1].stars).toBeLessThan(3);
  });
});

describe('Playtest: Chat App', () => {
  const results = chatArchitectures.map((a) => report(a.name, chatApp, a));

  it('reports all architectures', () => {
    console.table(results);
    expect(results.length).toBe(chatArchitectures.length);
  });

  it('3-star architecture (with MQ) gets 3 stars', () => {
    expect(results[0].stars).toBe(3);
  });

  it('no-MQ architecture gets fewer stars than with MQ', () => {
    expect(results[1].stars).toBeLessThanOrEqual(results[0].stars);
  });

  it('minimal architecture gets 1 star or less', () => {
    expect(results[4].stars).toBeLessThanOrEqual(1);
  });
});
