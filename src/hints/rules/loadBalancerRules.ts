import type { HintRule } from '../types';

export const loadBalancerRules: HintRule[] = [
  {
    id: 'single-server-high-load',
    condition: (s) => {
      const servers = s.components.filter((c) => c.type === 'server');
      const hasLB = s.components.some((c) => c.type === 'load-balancer');
      return servers.length === 1 && servers[0].load > 0.7 && !hasLB;
    },
    variants: [
      'Your single server is under heavy load. What component distributes traffic across multiple servers?',
      'One server is handling everything. What happens if it goes down?',
      'Your server is strained. How do large-scale systems handle more traffic than one server can process?',
      'All traffic hits one server. What architectural pattern spreads the load?',
      'Your server is near capacity. What sits in front of servers to distribute requests evenly?',
      'A single server is a bottleneck and a single point of failure. What addresses both problems?',
      'Your server load is critical. What would happen if you had two servers sharing the work?',
      'One server handling all traffic — what component makes multiple servers work as a team?',
    ],
    relatedComponentType: 'load-balancer',
    cooldownMs: 30000,
  },
  {
    id: 'lb-one-server',
    condition: (s) => {
      const lbs = s.components.filter((c) => c.type === 'load-balancer');
      return lbs.some((lb) => {
        const outConns = s.connections.filter((c) => c.fromComponentId === lb.id);
        return outConns.length === 1;
      });
    },
    variants: [
      'Your load balancer is connected to only one server. That\'s not really balancing anything.',
      'A load balancer with one server is just an expensive passthrough. Add more servers to distribute to.',
      'The "balancing" in load balancer requires multiple targets. Right now it has one.',
      'Your LB has a single downstream server. What happens during a node failure event?',
      'One server behind a load balancer means zero redundancy. The LB has nothing to fail over to.',
      'A load balancer shines when it has 2+ servers to distribute across. Yours only has one.',
      'Your load balancer is connected to one server — it can\'t balance or provide redundancy.',
      'The load balancer needs multiple servers to be useful. With one, it\'s just adding latency.',
    ],
    relatedComponentType: 'load-balancer',
    cooldownMs: 25000,
  },
];
