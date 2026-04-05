import type { HintRule } from '../types';

export const rateLimiterRules: HintRule[] = [
  {
    id: 'ddos-no-rate-limiter',
    condition: (s) => {
      const hasRL = s.components.some((c) => c.type === 'rate-limiter');
      const ddosActive = s.events.some((e) => e.active && (e.type === 'ddos-attack'));
      return !hasRL && ddosActive;
    },
    variants: [
      'You\'re under DDoS attack with no rate limiting. What component throttles excessive requests?',
      'Malicious traffic is flooding your system. What sits at the edge to filter out abuse?',
      'DDoS attack in progress — your servers are taking the full brunt. What could protect them?',
      'Without rate limiting, a DDoS hits your servers directly. What component would help?',
      'Your system has no defense against traffic floods. What component limits request rates?',
      'DDoS attack and no protection. A rate limiter at the front would throttle the malicious traffic.',
      'Malicious traffic is overwhelming your architecture. What\'s the first line of defense?',
      'Under attack with no throttling. What component would you add to protect your infrastructure?',
    ],
    relatedComponentType: 'rate-limiter',
    cooldownMs: 15000,
  },
  {
    id: 'traffic-spike-no-protection',
    condition: (s) => {
      const hasRL = s.components.some((c) => c.type === 'rate-limiter');
      const hasMQ = s.components.some((c) => c.type === 'message-queue');
      const spikeActive = s.events.some((e) => e.active && (e.type === 'traffic-spike' || e.type === 'viral-content'));
      const serversStrained = s.components.some((c) => c.type === 'server' && c.load > 0.7);
      return !hasRL && !hasMQ && spikeActive && serversStrained;
    },
    variants: [
      'Traffic spike with no buffering or throttling. Your servers are absorbing the full surge.',
      'What components help smooth out sudden traffic bursts?',
      'Your servers are taking a traffic spike head-on. Two components can help: one throttles, one buffers.',
      'Sudden traffic increase with no protection. How do production systems handle viral moments?',
      'Traffic surging and servers straining. A rate limiter or message queue could help — how?',
      'Your architecture has no shock absorbers for traffic spikes. What would you add?',
      'Servers overloaded from a traffic spike. What component buffers requests for async processing?',
      'No rate limiter or message queue to handle the surge. Your servers are on their own.',
    ],
    cooldownMs: 20000,
  },
];
