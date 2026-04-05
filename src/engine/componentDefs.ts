import type { ComponentDefinition, ComponentType } from './types';

export const COMPONENT_DEFS: Record<ComponentType, ComponentDefinition> = {
  client: {
    type: 'client',
    name: 'Client',
    description: 'Generates user requests. The source of all traffic in the system.',
    monthlyCost: 0,
    throughputLimit: 1000,
    ports: [
      { side: 'right', count: 2, direction: 'out' },
      { side: 'bottom', count: 1, direction: 'out' },
    ],
    defaultLatencyMs: 0,
  },
  server: {
    type: 'server',
    name: 'Server',
    description: 'Processes requests. The backbone of your architecture.',
    monthlyCost: 50,
    throughputLimit: 200,
    ports: [
      { side: 'left', count: 2, direction: 'in' },
      { side: 'right', count: 2, direction: 'out' },
      { side: 'top', count: 1, direction: 'in' },
      { side: 'bottom', count: 1, direction: 'out' },
    ],
    defaultLatencyMs: 15,
  },
  'load-balancer': {
    type: 'load-balancer',
    name: 'Load Balancer',
    description: 'Distributes traffic evenly across multiple servers.',
    monthlyCost: 30,
    throughputLimit: 500,
    ports: [
      { side: 'left', count: 2, direction: 'in' },
      { side: 'right', count: 4, direction: 'out' },
    ],
    defaultLatencyMs: 2,
  },
  database: {
    type: 'database',
    name: 'Database',
    description: 'Stores and retrieves data. Persistent but slow under heavy load.',
    monthlyCost: 80,
    throughputLimit: 100,
    ports: [
      { side: 'left', count: 2, direction: 'in' },
      { side: 'top', count: 2, direction: 'in' },
    ],
    defaultLatencyMs: 30,
  },
  cache: {
    type: 'cache',
    name: 'Cache',
    description: 'Stores frequently accessed data in memory. Fast reads, limited capacity.',
    monthlyCost: 25,
    throughputLimit: 500,
    ports: [
      { side: 'left', count: 2, direction: 'in' },
      { side: 'right', count: 1, direction: 'out' },
      { side: 'bottom', count: 1, direction: 'out' },
    ],
    defaultLatencyMs: 2,
  },
  cdn: {
    type: 'cdn',
    name: 'CDN',
    description: 'Serves static content from edge locations close to users.',
    monthlyCost: 20,
    throughputLimit: 1000,
    ports: [
      { side: 'left', count: 2, direction: 'in' },
      { side: 'right', count: 1, direction: 'out' },
    ],
    defaultLatencyMs: 5,
  },
  'message-queue': {
    type: 'message-queue',
    name: 'Message Queue',
    description: 'Buffers requests for async processing. Smooths out traffic spikes.',
    monthlyCost: 35,
    throughputLimit: 300,
    ports: [
      { side: 'left', count: 2, direction: 'in' },
      { side: 'right', count: 2, direction: 'out' },
    ],
    defaultLatencyMs: 5,
  },
  'rate-limiter': {
    type: 'rate-limiter',
    name: 'Rate Limiter',
    description: 'Throttles excessive requests. Protects downstream components.',
    monthlyCost: 15,
    throughputLimit: 400,
    ports: [
      { side: 'left', count: 2, direction: 'in' },
      { side: 'right', count: 2, direction: 'out' },
    ],
    defaultLatencyMs: 1,
  },
};

export const GRID_CELL_SIZE = 80; // pixels per grid cell
export const GRID_COLS = 16;
export const GRID_ROWS = 10;
