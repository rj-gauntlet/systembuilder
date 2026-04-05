import type { LevelDefinition } from '../../engine/types';

export const chatApp: LevelDefinition = {
  id: 'chat-app',
  name: 'Chat App',
  tier: 'beginner',
  briefing: {
    system: 'Chat Application',
    description:
      'Build a real-time chat application like Slack or Discord. Messages must be delivered quickly to all participants. Write-heavy traffic with bursty patterns as conversations heat up.',
    objectives: [
      'Handle real-time bidirectional message traffic',
      'Use message queues to buffer bursty write traffic',
      'Protect your servers from a DDoS attack',
      'Keep latency low enough for real-time conversation',
    ],
    monthlyBudget: 400,
    expectedTraffic: '~300 requests/second, 60% writes',
  },
  scriptedEvents: [
    {
      triggerTime: 15,
      event: {
        id: '',
        type: 'traffic-spike',
        title: 'Lunch Rush!',
        description: 'Everyone is chatting during lunch break. Message volume doubles!',
        effects: [{ type: 'multiply-traffic', multiplier: 2, durationMs: 12000 }],
      },
    },
    {
      triggerTime: 40,
      event: {
        id: '',
        type: 'ddos-attack',
        title: 'DDoS Attack!',
        description: 'Bot accounts are flooding your chat with spam messages.',
        effects: [{ type: 'flood-requests', multiplier: 5, durationMs: 15000 }],
      },
    },
    {
      triggerTime: 65,
      event: {
        id: '',
        type: 'node-failure',
        title: 'Server Crash!',
        description: 'The DDoS aftermath caused a server to run out of memory.',
        effects: [{ type: 'disable-component', targetComponentType: 'server', durationMs: 10000 }],
      },
    },
  ],
  randomEventPool: ['traffic-spike', 'ddos-attack', 'node-failure'],
  optimalBenchmark: {
    uptime: 90,
    avgLatency: 90,
    monthlyCost: 260, // Client, Rate Limiter, LB, Server x2, MQ, Database
    componentCount: 7,
  },
  starThresholds: {
    oneStar: { minUptime: 35, maxLatency: 500, maxCostRatio: 300, mustSurvive: false },
    twoStar: { minUptime: 55, maxLatency: 250, maxCostRatio: 200, mustSurvive: true },
    threeStar: { minUptime: 75, maxLatency: 150, maxCostRatio: 175, mustSurvive: true },
  },
  simulationDuration: 90,
};
