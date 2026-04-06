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
      'Keep average latency low — place caches where they intercept the most traffic',
      'Stay within the monthly budget',
      'Survive a traffic spike when a popular link goes viral',
    ],
    monthlyBudget: 300,
    expectedTraffic: '~200 requests/second, 90% reads',
  },
  writeRatio: 0.1,
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
  // 3-star: Client → CDN → Cache → LB → Server ×2 → DB ($255)
  // Double caching layer + redundancy for max resilience
  optimalBenchmark: {
    uptime: 95,
    avgLatency: 47,
    monthlyCost: 255,
    componentCount: 7,
  },
  starThresholds: {
    // Minimal (Srv→DB): ~60% → 1 star
    // No-redundancy (Cache→Srv→DB): ~85% → 2 stars
    // Good (Cache→LB→2xSrv→DB): ~85% → 2 stars
    // Optimal (CDN→Cache→LB→2xSrv→DB): ~95% → 3 stars
    oneStar:   { minUptime: 40, maxLatency: 200, maxCostRatio: 300, mustSurvive: false },
    twoStar:   { minUptime: 70, maxLatency: 100, maxCostRatio: 200, mustSurvive: true },
    threeStar: { minUptime: 91, maxLatency: 90,  maxCostRatio: 150, mustSurvive: true },
  },
  simulationDuration: 90,
};
