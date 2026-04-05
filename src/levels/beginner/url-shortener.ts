import type { LevelDefinition } from '../../engine/types';

export const urlShortener: LevelDefinition = {
  id: 'url-shortener',
  name: 'URL Shortener',
  tier: 'beginner',
  briefing: {
    system: 'URL Shortener',
    description:
      'Build a URL shortening service like bit.ly. Users create short links and get redirected to the original URL. Read-heavy traffic — most requests are redirects, not link creation.',
    objectives: [
      'Handle steady read-heavy traffic without dropping requests',
      'Keep average latency under 100ms',
      'Stay within the monthly budget',
      'Survive a traffic spike when a popular link goes viral',
    ],
    monthlyBudget: 300,
    expectedTraffic: '~200 requests/second, 90% reads',
  },
  scriptedEvents: [
    {
      triggerTime: 20,
      event: {
        id: '',
        type: 'traffic-spike',
        title: 'Viral Link!',
        description: 'Someone shared a shortened link on social media. Traffic is surging!',
        effects: [{ type: 'multiply-traffic', multiplier: 3, durationMs: 15000 }],
      },
    },
    {
      triggerTime: 50,
      event: {
        id: '',
        type: 'node-failure',
        title: 'Server Down!',
        description: 'One of your servers has crashed under the load.',
        effects: [{ type: 'disable-component', targetComponentType: 'server', durationMs: 12000 }],
      },
    },
  ],
  randomEventPool: ['traffic-spike', 'slow-query'],
  optimalBenchmark: {
    uptime: 99.5,
    avgLatency: 30,
    monthlyCost: 155,
    componentCount: 5,
  },
  starThresholds: {
    oneStar: { minUptime: 80, maxLatency: 200, maxCostRatio: 300, mustSurvive: false },
    twoStar: { minUptime: 92, maxLatency: 100, maxCostRatio: 200, mustSurvive: true },
    threeStar: { minUptime: 98, maxLatency: 50, maxCostRatio: 150, mustSurvive: true },
  },
  simulationDuration: 90,
};
