import type { HintRule } from '../types';

export const generalRules: HintRule[] = [
  {
    id: 'no-components',
    condition: (s) => {
      return s.components.length === 0 && s.simulation.status === 'building';
    },
    variants: [
      'Start by placing a Client component — that\'s where all user traffic originates.',
      'Every system starts with a Client. Drag one from the toolbox onto the canvas.',
      'Ready to build? Start with a Client component — it generates the requests your system will handle.',
      'First step: place a Client. It represents all the users hitting your system.',
      'Begin with a Client component on the left side. Traffic flows left to right.',
      'Place a Client first — it\'s the source of all traffic in your architecture.',
      'Your canvas is empty. Start with a Client on the left, then build the system to the right.',
      'Every architecture starts with users. Place a Client component to represent incoming traffic.',
    ],
    cooldownMs: 60000,
  },
  {
    id: 'client-no-connections',
    condition: (s) => {
      const clients = s.components.filter((c) => c.type === 'client');
      return clients.length > 0 && clients.every((client) => {
        return !s.connections.some((c) => c.fromComponentId === client.id);
      }) && s.simulation.status === 'building';
    },
    variants: [
      'Your client isn\'t connected to anything. Use Connect mode to wire it to your first component.',
      'Client placed but not connected. Click Connect, then click the client\'s port and a target port.',
      'Traffic can\'t flow yet — connect your client to the next component in your architecture.',
      'Your client is isolated. Connect it to where requests should go first.',
      'No connections from the client. What should user traffic hit first in your system?',
      'Wire up your client — it needs a connection to send requests into your architecture.',
      'Client is ready but has no outbound connections. What component should receive traffic first?',
      'Connect your client to get traffic flowing. What\'s the first stop for incoming requests?',
    ],
    cooldownMs: 30000,
  },
  {
    id: 'high-budget-usage',
    condition: (s) => {
      return s.budget.remaining < s.budget.monthlyLimit * 0.1 && s.simulation.status === 'building';
    },
    variants: [
      'You\'ve used over 90% of your budget. Could any components be removed without losing functionality?',
      'Budget is nearly exhausted. Is every component earning its keep?',
      'Running low on budget. Are there any redundant components that aren\'t contributing?',
      'Almost out of budget. Cost efficiency affects your star rating — is every dollar well spent?',
      'Budget critical. Review your architecture — is there a simpler design that achieves the same goals?',
      'Very little budget remaining. A cheaper architecture might score better on cost efficiency.',
      'You\'re nearly at your budget limit. Could you achieve similar performance with fewer components?',
      'Budget almost gone. Remember: cost efficiency is part of your score. Less can be more.',
    ],
    cooldownMs: 30000,
  },
  {
    id: 'many-drops',
    condition: (s) => {
      const total = s.simulation.totalRequests;
      return total > 20 && (s.simulation.droppedRequests / total) > 0.2;
    },
    variants: [
      'Over 20% of requests are being dropped. Something in your architecture can\'t handle the load.',
      'Lots of dropped requests. Look for the component with the highest load — that\'s your bottleneck.',
      'Requests are being lost. Check which components are red or yellow — they need help.',
      'High drop rate. Is there a component at capacity that could use a cache or load balancer in front of it?',
      'Too many dropped requests. Follow the traffic flow — where does it get stuck?',
      'Requests are failing. Your uptime score is suffering. Find the overloaded component.',
      'Significant request loss. Which component has the highest load percentage?',
      'Dropping lots of requests. The red and yellow health indicators show where the problems are.',
    ],
    cooldownMs: 20000,
  },
  {
    id: 'disconnected-component',
    condition: (s) => {
      return s.components.some((comp) => {
        if (comp.type === 'client') return false;
        const hasIn = s.connections.some((c) => c.toComponentId === comp.id);
        return !hasIn;
      }) && s.simulation.status === 'building' && s.components.length > 2;
    },
    variants: [
      'One of your components has no incoming connections. It won\'t receive any traffic.',
      'There\'s a disconnected component in your architecture. It\'s costing budget but doing nothing.',
      'A component has no connections leading to it. Check your wiring.',
      'You have a component that\'s isolated — no traffic can reach it. Connect it or remove it.',
      'An unreachable component is wasting budget. Wire it into the flow or right-click to delete.',
      'Check your connections — one component is completely disconnected from the traffic flow.',
      'A component with no incoming connections can\'t contribute. Connect or remove it.',
      'You\'re paying for a component that receives zero traffic. Check your architecture\'s wiring.',
    ],
    cooldownMs: 25000,
  },
];
