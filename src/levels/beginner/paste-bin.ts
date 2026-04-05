import type { LevelDefinition } from '../../engine/types';

export const pasteBin: LevelDefinition = {
  id: 'paste-bin',
  name: 'Paste Bin',
  tier: 'beginner',
  briefing: {
    system: 'Paste Bin',
    description:
      'Build a text paste sharing service like Pastebin. Users create pastes and share links. Most pastes are read many times but written once. Static content is a great fit for edge caching.',
    objectives: [
      'Handle mixed read/write traffic efficiently',
      'Use a CDN to serve popular pastes from the edge',
      'Keep the database from getting overloaded',
      'Survive a viral paste that gets millions of views',
    ],
    monthlyBudget: 350,
    expectedTraffic: '~150 requests/second, 80% reads',
  },
  writeRatio: 0.2, // 80% reads — pastes are read many times, written once
  scriptedEvents: [
    {
      triggerTime: 25,
      event: {
        id: '',
        type: 'viral-content',
        title: 'Viral Paste!',
        description: 'A paste containing leaked game source code is going viral. Reads are exploding!',
        effects: [{ type: 'multiply-traffic', multiplier: 4, durationMs: 20000 }],
      },
    },
    {
      triggerTime: 55,
      event: {
        id: '',
        type: 'slow-query',
        title: 'Slow Queries!',
        description: 'The database is struggling with large paste lookups.',
        effects: [
          { type: 'increase-latency', targetComponentType: 'database', multiplier: 4, durationMs: 12000 },
        ],
      },
    },
  ],
  randomEventPool: ['traffic-spike', 'viral-content', 'slow-query'],
  // 3-star: Client → CDN → Server → Cache → DB ($175)
  // CDN intercepts 85% at the edge → avg ~34ms
  optimalBenchmark: {
    uptime: 95,
    avgLatency: 34,
    monthlyCost: 175,
    componentCount: 5,
  },
  starThresholds: {
    oneStar:   { minUptime: 40, maxLatency: 200, maxCostRatio: 300, mustSurvive: false },
    twoStar:   { minUptime: 65, maxLatency: 120, maxCostRatio: 200, mustSurvive: true },
    threeStar: { minUptime: 80, maxLatency: 65,  maxCostRatio: 175, mustSurvive: true },
  },
  simulationDuration: 90,
};
