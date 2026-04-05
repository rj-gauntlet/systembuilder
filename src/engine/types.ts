// ============================================================
// GameState — the contract between Engine, Renderer, and UI
// ============================================================

export type ComponentType =
  | 'client'
  | 'server'
  | 'load-balancer'
  | 'database'
  | 'cache'
  | 'cdn'
  | 'message-queue'
  | 'rate-limiter';

export type HealthStatus = 'healthy' | 'strained' | 'critical' | 'failed';

export type PortSide = 'top' | 'right' | 'bottom' | 'left';

export interface GridPosition {
  col: number;
  row: number;
}

export interface PortPosition {
  side: PortSide;
  index: number; // which port on that side (0-based)
}

export interface ComponentStats {
  requestsPerSecond: number;
  latencyMs: number;
  hitRate?: number;       // cache/CDN only
  queueDepth?: number;    // message queue only
  throughputLimit: number;
}

export interface Component {
  id: string;
  type: ComponentType;
  position: GridPosition;
  load: number;           // 0-1 (percentage of capacity)
  health: HealthStatus;
  stats: ComponentStats;
  monthlyCost: number;
}

export interface Connection {
  id: string;
  fromComponentId: string;
  fromPort: PortPosition;
  toComponentId: string;
  toPort: PortPosition;
  trafficRate: number;
}

export type ParticleStatus = 'flowing' | 'queued' | 'dropped';
export type ParticleDirection = 'request' | 'response';
export type ParticleKind = 'read' | 'write';

export interface Particle {
  id: string;
  connectionId: string;
  position: number;        // 0-1 along the connection path (always from→to)
  speed: number;
  direction: ParticleDirection; // request flows from→to, response flows to→from
  kind: ParticleKind;          // read or write — affects cache/MQ/DB behavior
  stuckInComponent?: string;
  status: ParticleStatus;
  sourceComponentId: string;   // tracks origin for latency measurement
  createdAt: number;           // simulation time when spawned (for latency calc)
  droppedAge?: number;         // ticks since dropped (for drop animation)
  passedServer: boolean;       // has this request been processed by a server?
}

export interface Budget {
  monthlyLimit: number;
  monthlySpent: number;
  remaining: number;
}

export type EventType =
  | 'traffic-spike'
  | 'ddos-attack'
  | 'node-failure'
  | 'viral-content'
  | 'write-storm'
  | 'region-outage'
  | 'slow-query';

export interface EventEffect {
  type: 'multiply-traffic' | 'disable-component' | 'increase-latency' | 'flood-requests' | 'write-storm';
  targetComponentType?: ComponentType;
  targetComponentId?: string;
  multiplier?: number;
  durationMs: number;
}

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  active: boolean;
  timeRemaining: number;
  effects: EventEffect[];
}

export interface Score {
  uptime: number;
  avgLatency: number;
  costEfficiency: number;
  survival: boolean;
  stars: 0 | 1 | 2 | 3;
}

export type SimulationStatus = 'building' | 'running' | 'paused' | 'draining' | 'complete';

export interface SimulationState {
  status: SimulationStatus;
  elapsedTime: number;
  totalRequests: number;
  completedRequests: number; // round-trip: response received back at client
  droppedRequests: number;
  totalLatency: number;      // sum of all round-trip latencies (for averaging)
  maxLatency: number;        // worst single round-trip latency observed
}

export interface GameState {
  components: Component[];
  connections: Connection[];
  particles: Particle[];
  budget: Budget;
  events: GameEvent[];
  score: Score;
  simulation: SimulationState;
  levelId: string | null;
  writeRatio: number; // current write ratio (can be modified by events)
}

// ============================================================
// Level Definitions
// ============================================================

export interface StarCriteria {
  minUptime: number;
  maxLatency: number;
  maxCostRatio: number;
  mustSurvive: boolean;
}

export interface ScriptedEvent {
  triggerTime: number;
  event: Omit<GameEvent, 'active' | 'timeRemaining'>;
}

export interface LevelDefinition {
  id: string;
  name: string;
  tier: 'beginner' | 'intermediate' | 'advanced';
  briefing: {
    system: string;
    description: string;
    objectives: string[];
    monthlyBudget: number;
    expectedTraffic: string;
  };
  writeRatio: number; // 0-1, fraction of requests that are writes
  scriptedEvents: ScriptedEvent[];
  randomEventPool: EventType[];
  optimalBenchmark: {
    uptime: number;
    avgLatency: number;
    monthlyCost: number;
    componentCount: number;
  };
  starThresholds: {
    oneStar: StarCriteria;
    twoStar: StarCriteria;
    threeStar: StarCriteria;
  };
  simulationDuration: number; // seconds
}

// ============================================================
// Component Definitions (costs, throughput, port configs)
// ============================================================

export interface PortConfig {
  side: PortSide;
  count: number;
}

export interface ComponentDefinition {
  type: ComponentType;
  name: string;
  description: string;
  monthlyCost: number;
  throughputLimit: number; // requests per second
  ports: PortConfig[];
  defaultLatencyMs: number;
}

// ============================================================
// Game Engine API
// ============================================================

export type GamePhase = 'menu' | 'level-select' | 'briefing' | 'building' | 'running' | 'paused' | 'debrief';
