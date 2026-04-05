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
  writeRatio: 0.6,
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
      triggerTime: 35,
      event: {
        id: '',
        type: 'ddos-attack',
        title: 'DDoS Attack!',
        description: 'Bot accounts are flooding your chat with spam messages.',
        effects: [{ type: 'flood-requests', multiplier: 5, durationMs: 15000 }],
      },
    },
    {
      triggerTime: 55,
      event: {
        id: '',
        type: 'write-storm',
        title: 'Message History Sync!',
        description: 'Every user is syncing their full chat history. Write traffic explodes — caches can\'t help.',
        effects: [{ type: 'write-storm', multiplier: 0.3, durationMs: 15000 }],
      },
    },
    {
      triggerTime: 75,
      event: {
        id: '',
        type: 'node-failure',
        title: 'Server Crash!',
        description: 'The write storm caused a server to run out of memory.',
        effects: [{ type: 'disable-component', targetComponentType: 'server', durationMs: 10000 }],
      },
    },
  ],
  randomEventPool: ['traffic-spike', 'ddos-attack', 'write-storm'],
  // 3-star: Client → RL → LB → Server ×2 → MQ → DB ($260)
  // RL handles DDoS, MQ buffers write storm, LB+2 servers for redundancy
  optimalBenchmark: {
    uptime: 96,
    avgLatency: 110,
    monthlyCost: 260,
    componentCount: 7,
  },
  starThresholds: {
    // Minimal (Client→Server→DB): hammered by DDoS + write storm → very low uptime
    // No-MQ: can survive but writes back up → lower uptime + higher latency
    // Budget (Client→RL→Server→MQ→DB): no redundancy, server crash kills it
    // Optimal (RL→LB→2xSrv→MQ→DB): handles everything
    oneStar:   { minUptime: 25, maxLatency: 300, maxCostRatio: 300, mustSurvive: false },
    twoStar:   { minUptime: 42, maxLatency: 200, maxCostRatio: 200, mustSurvive: true },
    threeStar: { minUptime: 52, maxLatency: 140, maxCostRatio: 150, mustSurvive: true },
  },
  simulationDuration: 90,
};
