import type { HintRule } from '../types';

export const redundancyRules: HintRule[] = [
  {
    id: 'single-point-of-failure-server',
    condition: (s) => {
      const servers = s.components.filter((c) => c.type === 'server');
      return servers.length === 1 && s.simulation.elapsedTime > 10;
    },
    variants: [
      'You have one server. If it fails, your entire system goes down. How do you add redundancy?',
      'A single server is a single point of failure. What happens when the "Server Down" event fires?',
      'One server means zero fault tolerance. What\'s the standard way to protect against node failures?',
      'Your architecture has no server redundancy. What would a production system do differently?',
      'If your only server crashes, every request gets dropped. How do real systems prevent this?',
      'Single server = single point of failure. What two components work together to add redundancy?',
      'You\'re one node failure away from total downtime. What architectural pattern prevents this?',
      'No backup servers. When the failure event hits, how will your system handle traffic?',
    ],
    relatedComponentType: 'server',
    cooldownMs: 35000,
  },
  {
    id: 'server-failed-no-backup',
    condition: (s) => {
      const failedServers = s.components.filter((c) => c.type === 'server' && c.health === 'failed');
      const healthyServers = s.components.filter((c) => c.type === 'server' && c.health !== 'failed');
      return failedServers.length > 0 && healthyServers.length === 0;
    },
    variants: [
      'All your servers are down and there\'s no backup. This is why redundancy matters.',
      'Every server has failed. With multiple servers, some would still be handling traffic.',
      'Total server failure. A load balancer with 2+ servers would have kept you running.',
      'Your system is completely down. This is what happens without server redundancy.',
      'All servers failed — zero requests being processed. Redundancy prevents total outages.',
      'No healthy servers remain. In the future, consider having at least 2 servers behind a load balancer.',
      'Complete server failure. The lesson: never rely on a single instance of a critical component.',
      'Everything is down. Multiple servers with a load balancer would have maintained partial service.',
    ],
    relatedComponentType: 'server',
    cooldownMs: 15000,
  },
];
