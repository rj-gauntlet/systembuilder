# SystemBuilder — Project Plan

> Generated from PRD review on 2026-04-04

## 1. Product Overview

### Vision
SystemBuilder is a gamified, interactive system design learning platform modeled after SimCity and RollerCoaster Tycoon. Players design real-world distributed systems by placing infrastructure components on a visual canvas within a budget, watch animated traffic flow through their architecture in real-time, and survive dynamic stress events (traffic spikes, DDoS attacks, node failures). AI provides contextual help and Socratic hints. The learning happens by seeing the immediate visual impact of every architectural decision.

### Target Users
Junior-to-mid-level software engineers, bootcamp graduates, and self-taught developers studying system design — particularly those preparing for system design interviews at tech companies. These users learn best through hands-on experience rather than reading, and currently lack tools that let them practice system design through interactive simulation.

### Key Outcomes
- Engineers develop intuitive understanding of system design through hands-on simulation rather than passive reading
- Visual, immediate feedback on architectural decisions replaces abstract theoretical study
- Portfolio piece demonstrating full-stack engineering, game development, and AI integration skills
- Organic growth in developer communities through shareability and word of mouth

---

## 2. Requirements Summary

### Functional Requirements

| ID    | Domain            | Requirement                      | Priority    |
|-------|-------------------|----------------------------------|-------------|
| FR-01 | Core Simulation   | Component Canvas                 | Must-have   |
| FR-02 | Core Simulation   | Animated Traffic Flow            | Must-have   |
| FR-03 | Core Simulation   | Budget System                    | Must-have   |
| FR-04 | Core Simulation   | Dynamic Events                   | Must-have   |
| FR-05 | Core Simulation   | Component Behavior               | Must-have   |
| FR-06 | Gamification      | Levels & Scenarios               | Must-have   |
| FR-07 | Gamification      | Scoring & Feedback               | Must-have   |
| FR-08 | Gamification      | Progression System               | Should-have |
| FR-09 | Gamification      | Easy / Hard Mode                 | Should-have |
| FR-10 | AI                | Chat Assistant                   | Must-have   |
| FR-11 | AI                | Socratic Hint System             | Must-have   |
| FR-12 | AI                | Architecture Reviewer            | Should-have |
| FR-13 | AI                | Dynamic Event Narrator           | Should-have |
| FR-14 | AI                | Adaptive Difficulty              | Could-have  |
| FR-15 | AI                | "What If" Simulator              | Could-have  |
| FR-16 | AI                | Interview Prep Mode              | Could-have  |
| FR-17 | AI                | Custom Scenario Generator        | Could-have  |
| FR-18 | Data Layer (Hard) | Schema Designer                  | Should-have |
| FR-19 | Data Layer (Hard) | API Designer                     | Should-have |
| FR-20 | Data Layer (Hard) | Database Type Selection          | Should-have |
| FR-21 | Data Layer (Hard) | Live Query Visualization         | Could-have  |
| FR-22 | Data Layer (Hard) | Schema Migration Events          | Could-have  |
| FR-23 | Monetization      | Branded/Sponsored Components     | Could-have  |
| FR-24 | Onboarding        | Interactive Tutorial             | Must-have   |
| FR-25 | Platform          | Progress Saving (localStorage)   | Must-have   |
| FR-26 | Platform          | Shareable Results                | Could-have  |

### Non-Functional Requirements

| ID     | Category    | Requirement                                         | Target                                                      |
|--------|-------------|-----------------------------------------------------|-------------------------------------------------------------|
| NFR-01 | Performance | Smooth animation with many components and particles | 60fps with 50+ components and hundreds of request particles |
| NFR-02 | Platform    | Desktop-first modern browser support                | Chrome, Firefox, Edge, Safari (latest 2 versions)           |
| NFR-03 | Storage     | Client-side progress persistence                    | localStorage — no backend required for saving progress      |
| NFR-04 | Rendering   | High-fidelity simulation visuals                    | PixiJS v8 WebGL/WebGPU rendering                            |
| NFR-05 | Mobile      | Mobile responsiveness                               | Deferred — desktop-first, mobile planned for future         |

### Assumptions
- Solo developer with two-week timeline
- No backend infrastructure beyond a thin Cloudflare Worker proxy for AI API calls
- 8 component types are sufficient for MVP to teach core system design concepts
- GPT-4o-mini provides adequate quality for contextual chat assistance
- localStorage is sufficient for progress persistence without user accounts
- Players have modern desktop browsers with WebGL support
- OpenAI API will remain available at current pricing ($0.15/1M input, $0.60/1M output)

### Open Questions
- Which specific systems to design for the 2-3 MVP levels? (URL Shortener, Chat App, and TikTok-lite are candidates)
- Component cost/throughput balancing — needs playtesting to feel right
- Event timing — how frequently should random bonus events fire after scripted events complete?
- Simulation speed — should players be able to fast-forward during the events phase?
- Optimal star thresholds — what percentage of optimal benchmark earns 2 vs 3 stars?

---

## 3. Architecture

### System Overview

```
┌─────────────────────────────────────────────────────┐
│                   React App (Vite)                    │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Screens │  │  Chat    │  │  Toolbox Sidebar  │  │
│  │  (menu,  │  │  Panel   │  │  (components,     │  │
│  │  debrief,│  │          │  │   costs, drag)    │  │
│  │  levels) │  │          │  │                    │  │
│  └──────────┘  └────┬─────┘  └────────┬───────────┘  │
│                     │                 │               │
│              ┌──────┴─────────────────┴────────┐     │
│              │      PixiJS Canvas (Renderer)    │     │
│              │  ┌─────────────────────────────┐ │     │
│              │  │ Components + Connections     │ │     │
│              │  │ Particle System              │ │     │
│              │  │ HUD (budget, events, stats)  │ │     │
│              │  └─────────────────────────────┘ │     │
│              └──────────────┬───────────────────┘     │
│                             │                         │
│              ┌──────────────┴───────────────────┐     │
│              │      Game Engine (Pure TS)        │     │
│              │  ┌───────┐ ┌───────┐ ┌────────┐  │     │
│              │  │ Sim   │ │Events │ │Scoring │  │     │
│              │  │ Loop  │ │System │ │Engine  │  │     │
│              │  └───────┘ └───────┘ └────────┘  │     │
│              │  ┌───────┐ ┌───────┐ ┌────────┐  │     │
│              │  │Budget │ │Rules  │ │Level   │  │     │
│              │  │Manager│ │Engine │ │Loader  │  │     │
│              │  └───────┘ └───────┘ └────────┘  │     │
│              └──────────────────────────────────┘     │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │         AIProvider Interface                   │    │
│  │    ┌─────────────────────────────┐            │    │
│  │    │  GPT-4o-mini (swappable)    │            │    │
│  │    └─────────────────────────────┘            │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │         localStorage                          │    │
│  │    Progress, scores, level state              │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
  Cloudflare Pages               Cloudflare Worker
  (Static hosting)              (AI API proxy)
```

### Component Breakdown

#### Game Engine (`/src/engine/`)
- **Responsibility:** All game logic — simulation tick loop, component behavior, event system, budget math, scoring, level management. Zero rendering knowledge.
- **Key interfaces:** Exposes `GameEngine` class with methods: `addComponent()`, `removeComponent()`, `connect()`, `disconnect()`, `startSimulation()`, `pauseSimulation()`, `tick()`, `getState()`, `triggerEvent()`
- **Technology:** Pure TypeScript — no PixiJS or React imports

#### Renderer (`/src/renderer/`)
- **Responsibility:** Visual representation of the simulation. Reads `GameState` from the engine and draws everything on the PixiJS canvas: components on grid, connection lines with auto-routing, animated particles, stat overlays, health indicators, HUD elements (budget bar, event banners).
- **Key interfaces:** Consumes `GameState` interface. Handles canvas input (drag-and-drop placement, connection drawing) and translates to engine API calls.
- **Technology:** PixiJS v8 via `@pixi/react`

#### Frontend Shell (`/src/ui/`)
- **Responsibility:** Everything outside the game canvas — screens (level select, briefing, debrief), toolbox sidebar, chat panel, hint toasts, settings, tutorial overlays.
- **Key interfaces:** Reads `GameState` for UI updates. Calls `GameEngine` methods for user actions. Calls `AIProvider` for chat interactions.
- **Technology:** React 19 with TypeScript

#### AI Provider (`/src/ai/`)
- **Responsibility:** Abstraction layer for LLM communication. Serializes game state snapshots, manages conversation history, handles API calls.
- **Key interfaces:** `AIProvider` interface with `sendMessage(gameState, userMessage): Promise<string>`. Concrete implementation: `OpenAIProvider`.
- **Technology:** GPT-4o-mini via Cloudflare Worker proxy. User-provided API key as fallback.

#### Hint Rules Engine (`/src/hints/`)
- **Responsibility:** Algorithmic hint generation based on game state analysis. Each rule has 8 randomized Socratic question variants. Fires hints as toast notifications on the canvas.
- **Key interfaces:** `HintEngine.evaluate(gameState): Hint | null`. Each `HintRule` defines a condition function and 8 variant strings.
- **Technology:** Pure TypeScript

### Data Models

#### GameState (Engine ↔ Renderer contract)
```typescript
interface GameState {
  components: Component[]
  connections: Connection[]
  particles: Particle[]
  budget: Budget
  events: GameEvent[]
  score: Score
  simulation: SimulationState
}

interface Component {
  id: string
  type: ComponentType
  position: GridPosition
  load: number          // 0-1 (percentage of capacity)
  health: HealthStatus  // 'healthy' | 'strained' | 'critical' | 'failed'
  stats: ComponentStats
  monthlyCost: number
}

type ComponentType =
  | 'client'
  | 'server'
  | 'load-balancer'
  | 'database'
  | 'cache'
  | 'cdn'
  | 'message-queue'
  | 'rate-limiter'

interface ComponentStats {
  requestsPerSecond: number
  latencyMs: number
  hitRate?: number       // cache/CDN only
  queueDepth?: number   // message queue only
  throughputLimit: number
}

interface Connection {
  id: string
  fromComponentId: string
  fromPort: PortPosition
  toComponentId: string
  toPort: PortPosition
  trafficRate: number
}

interface Particle {
  id: string
  connectionId: string
  position: number       // 0-1 along the connection path
  speed: number          // constant between components
  stuckInComponent?: string  // component ID if queued inside
  status: 'flowing' | 'queued' | 'dropped'
}

interface Budget {
  monthlyLimit: number
  monthlySpent: number
  remaining: number
}

interface GameEvent {
  id: string
  type: EventType
  title: string
  description: string
  active: boolean
  timeRemaining: number
  effects: EventEffect[]
}

type EventType =
  | 'traffic-spike'
  | 'ddos-attack'
  | 'node-failure'
  | 'viral-content'
  | 'region-outage'
  | 'slow-query'

interface Score {
  uptime: number          // percentage
  avgLatency: number      // ms
  costEfficiency: number  // percentage of optimal
  survival: boolean       // survived all events
  stars: 0 | 1 | 2 | 3
}

interface SimulationState {
  status: 'building' | 'running' | 'paused' | 'complete'
  elapsedTime: number
  totalRequests: number
  droppedRequests: number
}
```

#### Level Definition
```typescript
interface LevelDefinition {
  id: string
  name: string
  tier: 'beginner' | 'intermediate' | 'advanced'
  briefing: {
    system: string         // "URL Shortener"
    description: string
    objectives: string[]
    monthlyBudget: number
    expectedTraffic: string
  }
  scriptedEvents: ScriptedEvent[]
  randomEventPool: EventType[]
  optimalBenchmark: {
    uptime: number
    avgLatency: number
    monthlyCost: number
    componentCount: number
  }
  starThresholds: {
    oneStar: StarCriteria
    twoStar: StarCriteria
    threeStar: StarCriteria
  }
}

interface ScriptedEvent {
  triggerTime: number    // seconds after simulation starts
  event: GameEvent
}

interface StarCriteria {
  minUptime: number
  maxLatency: number
  maxCostRatio: number   // ratio of player cost to optimal cost
  mustSurvive: boolean
}
```

#### Progression State (localStorage)
```typescript
interface PlayerProgress {
  levels: Record<string, LevelProgress>
  totalStars: number
  unlockedTiers: string[]
  settings: PlayerSettings
}

interface LevelProgress {
  bestStars: 0 | 1 | 2 | 3
  bestScore: Score
  attempts: number
  lastPlayed: string     // ISO date
}

interface PlayerSettings {
  userApiKey?: string    // optional user-provided OpenAI key
  hintsEnabled: boolean
  soundEnabled: boolean
}
```

#### Hint Rule
```typescript
interface HintRule {
  id: string
  condition: (state: GameState) => boolean
  variants: [string, string, string, string, string, string, string, string]  // exactly 8
  relatedComponentId?: (state: GameState) => string  // for positioning the toast
  cooldownMs: number     // prevent spamming the same hint
}
```

### API Surface

| Method | Endpoint                  | Description                                  | Auth       |
|--------|---------------------------|----------------------------------------------|------------|
| POST   | /api/chat                 | Proxy chat message to OpenAI GPT-4o-mini     | Rate-limited |

This is the only server endpoint — the Cloudflare Worker proxy. Everything else is client-side.

**Request:**
```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "gameState": { ... }
}
```

**Response:**
```json
{
  "reply": "Your database is handling all reads directly. Have you considered what component could intercept frequently-requested data before it hits the database?"
}
```

### Tech Stack

| Layer           | Technology           | Rationale                                                                          |
|-----------------|----------------------|------------------------------------------------------------------------------------|
| Game Engine     | Pure TypeScript      | Renderer-agnostic, testable without browser, portable to server for future multiplayer |
| Renderer        | PixiJS v8            | WebGL/WebGPU hardware acceleration, 60fps with thousands of sprites, React integration |
| Frontend        | React 19 + Vite      | Familiar stack, fast HMR, `@pixi/react` for declarative canvas, component ecosystem  |
| AI Provider     | GPT-4o-mini          | 20x cheaper than alternatives, sufficient quality for contextual chat, behind interface |
| Hosting         | Cloudflare Pages     | Unlimited bandwidth, commercial use allowed, fastest CDN, generous free tier         |
| API Proxy       | Cloudflare Workers   | Hides API key server-side, ~20 lines of code, deploys alongside Pages               |
| Storage         | localStorage         | Zero infrastructure, offline-capable, sufficient for MVP without user accounts      |
| Language        | TypeScript 5.x       | Type safety across engine, renderer, and UI layers                                  |
| Package Manager | npm                  | Standard, reliable                                                                   |

### Detected Stack Constraints
Greenfield — no existing constraints.

### Shared Interfaces

| Interface       | Location                        | Purpose                                          | Depended on by                          |
|-----------------|---------------------------------|--------------------------------------------------|-----------------------------------------|
| `GameState`     | `/src/engine/types.ts`          | Contract between engine, renderer, and UI        | Renderer, Frontend, AI Provider, Hints  |
| `AIProvider`    | `/src/ai/types.ts`              | Abstraction for LLM communication                | Chat Panel, future AI features          |
| `LevelDefinition` | `/src/engine/types.ts`       | Level structure consumed by engine and UI         | Engine, Level Select, Briefing Screen   |
| `PlayerProgress` | `/src/storage/types.ts`       | Persistence schema for localStorage              | Storage module, Progression, Level Select |
| `HintRule`      | `/src/hints/types.ts`           | Hint rule definition consumed by hint engine      | Hint Engine, Hint Toast UI              |

---

## 4. Strategy

### Build vs. Buy

| Capability              | Decision    | Rationale                                                                   |
|-------------------------|-------------|-----------------------------------------------------------------------------|
| 2D Rendering            | Open-source | PixiJS v8 — MIT license, industry standard, actively maintained             |
| React Framework         | Open-source | React 19 + Vite — standard web stack                                        |
| Game Engine Logic        | Build       | Custom pure TS engine — no existing engine fits this specific simulation model |
| AI Chat                 | Buy (API)   | GPT-4o-mini via OpenAI API — building an LLM is obviously not an option     |
| Hint System             | Build       | Algorithmic rules engine — 8 variants per rule, no API cost                 |
| Hosting                 | Buy (free)  | Cloudflare Pages free tier — no reason to self-host                         |
| Auto-routing (wires)    | Build       | Orthogonal path routing between component ports — small enough to implement |
| Particle System         | Build       | Custom on PixiJS — tailored to traffic flow visualization needs             |

### MVP Scope

**In MVP (2 weeks):**
- 8 component types with realistic behavior
- Snap-to-grid canvas with connection ports and auto-routing wires
- All connections allowed — simulation teaches through consequences, not validation
- Animated particle traffic flow (constant speed between components, stack inside)
- Component stat overlays and health visualization
- Monthly cost budget system
- 2-3 beginner levels with scripted events + random bonus events
- Briefing → Build → Go Live → Events → Debrief level flow
- 3-star scoring vs. optimal benchmark
- Star-gated tier progression (total accumulation + min 1 star per level)
- AI chat assistant via GPT-4o-mini with game state context
- Algorithmic Socratic hint toasts (8 variants per rule) with "Ask about this" button
- Interactive first-level tutorial
- Progress saving via localStorage
- Cloudflare Pages deployment with Worker proxy for AI calls

**Explicitly deferred:**
- Hard Mode (schema designer, API designer, database type selection)
- Architecture Reviewer (post-level AI critique)
- Dynamic Event Narrator (AI-generated events targeting weaknesses)
- Adaptive Difficulty
- "What If" Simulator
- Interview Prep Mode
- Custom Scenario Generator
- Schema Migration Events
- Live Query Visualization
- Branded/Sponsored Components
- Shareable Results
- Mobile responsiveness
- User accounts / authentication
- Build + operate cost model (CapEx + OpEx budget)
- AI-driven event generation (Option D from event trigger discussion)
- Post-MVP components (API Gateway, Reverse Proxy, Search Index, Object Storage, DNS, Firewall, Pub/Sub, Scheduler, Replication Node, Shard, Service Mesh)

### Iteration Approach
1. **MVP (Weeks 1-2):** Ship Easy Mode with 2-3 levels, core simulation, basic AI
2. **v1.1:** Add 3-5 more levels across Intermediate and Advanced tiers
3. **v1.2:** Architecture Reviewer (post-level AI critique) + Dynamic Event Narrator
4. **v2.0:** Hard Mode — schema designer, API designer, database type selection, build + operate cost model
5. **v2.1:** AI-driven event generation, adaptive difficulty
6. **v3.0:** Interview Prep Mode, custom scenario generator, shareable results
7. **v4.0:** Branded/sponsored components, mobile support

### Deployment Strategy
- **Hosting:** Cloudflare Pages — auto-deploys from GitHub on push to `main`
- **API Proxy:** Cloudflare Worker deployed alongside Pages
- **CI/CD:** GitHub → Cloudflare Pages (built-in, zero config)
- **Environment:** Single environment for MVP (no staging). Add preview deploys per PR post-launch.
- **Domain:** Custom domain via Cloudflare DNS (optional)

---

## 5. Project Structure

```
systembuilder/
├── public/
│   └── assets/
│       ├── components/          # Component icons/sprites
│       └── sounds/              # Optional sound effects
├── src/
│   ├── engine/                  # Pure TypeScript game engine
│   │   ├── types.ts             # GameState, Component, Connection, etc.
│   │   ├── GameEngine.ts        # Main engine class
│   │   ├── SimulationLoop.ts    # Tick loop and traffic simulation
│   │   ├── BudgetManager.ts     # Monthly cost tracking
│   │   ├── EventSystem.ts       # Scripted + random event firing
│   │   ├── ScoringEngine.ts     # 3-star scoring vs optimal benchmark
│   │   ├── LevelLoader.ts       # Load level definitions
│   │   └── components/          # Per-component behavior
│   │       ├── ServerBehavior.ts
│   │       ├── DatabaseBehavior.ts
│   │       ├── CacheBehavior.ts
│   │       ├── LoadBalancerBehavior.ts
│   │       ├── CDNBehavior.ts
│   │       ├── MessageQueueBehavior.ts
│   │       ├── RateLimiterBehavior.ts
│   │       └── ClientBehavior.ts
│   ├── renderer/                # PixiJS rendering layer
│   │   ├── GameCanvas.tsx       # Main PixiJS canvas component
│   │   ├── ComponentSprite.ts   # Component visual representation
│   │   ├── ConnectionLine.ts    # Auto-routed wire rendering
│   │   ├── ParticleSystem.ts    # Traffic flow particles
│   │   ├── GridSystem.ts        # Snap-to-grid logic
│   │   ├── PortSystem.ts        # Connection port anchor points
│   │   ├── StatOverlay.ts       # Per-component stat display
│   │   ├── HUD.ts               # Budget bar, event banners in canvas
│   │   └── InputHandler.ts      # Drag-drop, connection drawing
│   ├── ui/                      # React UI components
│   │   ├── screens/
│   │   │   ├── MainMenu.tsx
│   │   │   ├── LevelSelect.tsx
│   │   │   ├── Briefing.tsx
│   │   │   ├── GameScreen.tsx   # Contains canvas + sidebar + chat
│   │   │   ├── Debrief.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── Toolbox.tsx      # Component palette sidebar
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── HintToast.tsx
│   │   │   ├── StarRating.tsx
│   │   │   ├── ScoreBreakdown.tsx
│   │   │   ├── TierProgress.tsx
│   │   │   └── Tutorial.tsx
│   │   └── layouts/
│   │       └── GameLayout.tsx   # Canvas + sidebar + chat layout
│   ├── ai/                      # AI provider abstraction
│   │   ├── types.ts             # AIProvider interface
│   │   ├── OpenAIProvider.ts    # GPT-4o-mini implementation
│   │   ├── stateSerializer.ts   # GameState → compact JSON for AI context
│   │   └── prompts.ts           # System prompts for chat assistant
│   ├── hints/                   # Algorithmic hint system
│   │   ├── types.ts             # HintRule interface
│   │   ├── HintEngine.ts        # Rule evaluation + random variant selection
│   │   └── rules/
│   │       ├── cacheRules.ts
│   │       ├── loadBalancerRules.ts
│   │       ├── databaseRules.ts
│   │       ├── redundancyRules.ts
│   │       ├── rateLimiterRules.ts
│   │       └── generalRules.ts
│   ├── storage/                 # localStorage persistence
│   │   ├── types.ts             # PlayerProgress interface
│   │   ├── ProgressStore.ts     # Save/load progress
│   │   └── migration.ts         # Schema versioning for future updates
│   ├── levels/                  # Level definitions (JSON/TS)
│   │   ├── beginner/
│   │   │   ├── url-shortener.ts
│   │   │   ├── paste-bin.ts
│   │   │   └── chat-app.ts
│   │   └── index.ts             # Level registry
│   ├── App.tsx                  # Root React component
│   ├── main.tsx                 # Entry point
│   └── router.tsx               # Screen routing
├── worker/                      # Cloudflare Worker (AI proxy)
│   ├── index.ts                 # ~20 line proxy function
│   └── wrangler.toml            # Worker config
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── PRD.md
├── PROJECT_PLAN.md
└── DASHBOARD.html
```

---

## 6. Implementation Plan

### Timeline
- **Start date:** 2026-04-05
- **Target completion:** 2026-04-18
- **Total estimated duration:** 14 days

---

### Phase 1: Foundation — Days 1-2 (Apr 5-6)

**Goal:** Project scaffolding, game engine core, typed interfaces, and basic canvas rendering with a component on a grid.

**Deliverables:**
- [x] Project scaffolding (React 19 + Vite + TypeScript + PixiJS v8 + `@pixi/react`)
- [x] `GameState` interface and all core type definitions (`/src/engine/types.ts`)
- [x] `GameEngine` class with `addComponent()`, `removeComponent()`, `connect()`, `getState()`
- [x] Component data models — 8 types with costs, throughput limits, behavior rules
- [x] Basic PixiJS canvas rendering — display a component on a snap-to-grid canvas
- [x] Grid system with snap-to-grid placement
- [x] Port system — defined input/output anchor points per component type
- [x] localStorage scaffolding — `ProgressStore` with save/load skeleton

**Key Tasks:**
1. Initialize Vite + React + TypeScript project with PixiJS v8 and `@pixi/react`
2. Define all TypeScript interfaces in `/src/engine/types.ts` — `GameState`, `Component`, `Connection`, `Particle`, `Budget`, `Score`, `LevelDefinition`
3. Implement `GameEngine` class with component management methods
4. Define component behavior configs (cost, throughput limit, type-specific properties) for all 8 types
5. Set up PixiJS canvas with grid rendering and snap-to-grid placement
6. Implement component port positions (input/output anchors) for each component type
7. Build basic drag-from-toolbox-to-canvas interaction
8. Set up localStorage `ProgressStore` with schema versioning

**Success Criteria:**
- Player can drag a component from a toolbox onto the canvas and it snaps to the grid
- All TypeScript interfaces compile with no errors
- `GameEngine.getState()` returns a valid `GameState` object
- Foundation supports the engine/renderer separation — no PixiJS imports in engine code

**Risks:**
- `@pixi/react` v8 integration quirks — mitigate by following official setup guides and keeping a vanilla PixiJS fallback plan

---

### Phase 2: Wiring & Simulation — Days 3-5 (Apr 7-9)

**Goal:** Connection drawing, traffic flow animation, and the core simulation loop — the product's defining feature.

**Deliverables:**
- [x] Connection drawing between component ports
- [x] Auto-routing algorithm for clean orthogonal wire paths
- [x] Wire re-routing when components are moved
- [x] Simulation tick loop in `GameEngine` (`SimulationLoop.ts`)
- [x] Component behavior implementations — each type processes traffic differently
- [x] Particle system — requests flow along connections at constant speed
- [x] Particles queue/stack inside overloaded components
- [x] Dropped request animation when components exceed capacity
- [x] Component stat overlays (req/s, latency, hit rate, queue depth)
- [x] Component health visualization (green → yellow → red based on load)
- [x] Budget system — monthly cost display, deducted on component placement
- [x] Budget HUD element in the canvas

**Key Tasks:**
1. Implement connection drawing — click port A, drag to port B, connection created
2. Build orthogonal auto-routing algorithm (A* or simple Manhattan routing avoiding component bounding boxes)
3. Implement `SimulationLoop.ts` — tick-based simulation running at fixed timestep
4. Build component behavior classes: `ServerBehavior` (process requests with throughput limit), `DatabaseBehavior` (handle queries with capacity), `CacheBehavior` (intercept reads, track hit rate), `LoadBalancerBehavior` (distribute across connected servers), `CDNBehavior` (serve static content), `MessageQueueBehavior` (buffer with queue depth), `RateLimiterBehavior` (throttle requests), `ClientBehavior` (generate requests)
5. Implement particle system — spawn particles at client, flow along connections, stack inside components proportional to processing time
6. Implement dropped particle visual (shatter/fade) when component capacity exceeded
7. Build stat overlay renderer — small data display on each component
8. Implement health color transitions based on load percentage
9. Build budget manager and HUD budget bar

**Success Criteria:**
- Player can place components, wire them together, and hit "Go Live"
- Traffic particles flow from client through the architecture
- Overloaded components visually accumulate particles and turn red
- Dropped requests are visible
- Stat overlays show real-time metrics on each component
- Budget updates when components are placed

**Risks:**
- Auto-routing complexity — mitigate by starting with simple Manhattan routing (horizontal then vertical) before optimizing for overlap avoidance
- Particle system performance — mitigate by using PixiJS `ParticleContainer` for batch rendering

---

### Phase 3: Events & Levels — Days 6-8 (Apr 10-12)

**Goal:** Dynamic events, structured levels with objectives, scoring, and the full game loop from briefing to debrief.

**Deliverables:**
- [x] Event system — `EventSystem.ts` with scripted event timeline + random event pool
- [x] Event notification banners in the HUD
- [x] Event effects on simulation (traffic multiplier, component failure, request flood)
- [x] 2-3 MVP level definitions with briefings, objectives, scripted events, and optimal benchmarks
- [x] Level flow: Briefing → Build → Go Live → Events → Debrief
- [x] Briefing screen with system description, objectives, budget
- [x] 3-star scoring engine — compare player metrics to optimal benchmark
- [x] Debrief screen with score breakdown, star rating, per-metric analysis
- [x] Level select screen with tier grouping
- [x] Star-gated progression — total star accumulation + minimum 1 star per level
- [x] Progress persistence — save stars, completion, unlocks to localStorage

**Key Tasks:**
1. Implement `EventSystem.ts` — schedule scripted events by timestamp, fire random events from pool after scripted sequence completes
2. Build event effect handlers — `traffic-spike` (multiply request rate), `ddos-attack` (flood from new source), `node-failure` (disable a random server), `viral-content` (sustained traffic increase)
3. Design MVP levels:
   - **URL Shortener (Beginner):** Teach caching, basic server scaling. Events: traffic spike, single node failure.
   - **Paste Bin (Beginner):** Teach read/write split, CDN for static content. Events: viral paste, slow queries.
   - **Chat App (Beginner):** Teach message queues, real-time traffic. Events: DDoS, user surge.
4. Define optimal benchmarks for each level (component layout, expected metrics)
5. Implement star threshold calculation in `ScoringEngine.ts`
6. Build Briefing screen (React) — display system, description, objectives, budget
7. Build Debrief screen (React) — star rating, metric breakdown, comparison to optimal
8. Build Level Select screen with tier cards, star counts, lock indicators
9. Implement tier unlock logic — check total stars + min 1 star per level
10. Wire up `ProgressStore` — save on level complete, load on app start

**Success Criteria:**
- Player can select a level, read the briefing, build a system, go live, survive events, and see their score
- Events visibly stress the system — traffic spikes cause overload, node failures cause dropped requests
- 3-star scoring produces differentiated ratings (brute-force solutions get 1 star, elegant solutions get 3)
- Completed levels persist across browser sessions
- Tier progression works — completing beginner levels unlocks intermediate

**Risks:**
- Level balancing — star thresholds may feel too easy or too hard. Mitigate with playtesting in Phase 6.
- Event timing — scripted events need to give players enough time to react. Start with generous windows, tighten later.

---

### Phase 4: AI & Hints — Days 9-10 (Apr 13-14)

**Goal:** Chat assistant with game state context, algorithmic hint system, and the bridge between them.

**Deliverables:**
- [ ] `AIProvider` interface + `OpenAIProvider` implementation
- [ ] Cloudflare Worker proxy for OpenAI API calls (`/worker/`)
- [ ] Game state serializer — compact JSON snapshot for AI context
- [ ] System prompt for chat assistant (system design tutor persona with game awareness)
- [ ] Chat panel UI (React) — message history, input, send button
- [ ] Hint rules engine — `HintEngine.ts` with rule evaluation and random variant selection
- [ ] 40-60 hint rules across all 8 component types (8 variants each)
- [ ] Hint toast notifications on canvas with "Ask about this" button
- [ ] "Ask about this" flow — hint context pre-filled into chat panel
- [ ] User API key fallback — settings page option to provide own OpenAI key
- [ ] Rate limiting — 50 chat messages per day per user (localStorage tracked)

**Key Tasks:**
1. Implement `AIProvider` interface and `OpenAIProvider` class
2. Build Cloudflare Worker proxy — accept chat request, forward to OpenAI, return response. Include API key in environment variable.
3. Build `stateSerializer.ts` — convert `GameState` to compact JSON (~500-1000 tokens) focusing on component types, connections, current metrics, active events
4. Write system prompt — "You are a system design tutor observing a student's architecture. You can see their current design and metrics. Answer questions with Socratic guidance. Reference specific components and metrics in your responses."
5. Build React `ChatPanel` component — scrollable message history, text input, send button, loading state
6. Implement `HintEngine.ts` — iterate through rules, evaluate conditions against game state, select random variant, respect cooldown timers
7. Write hint rules for each component scenario:
   - Cache rules (not present when DB overloaded, positioned ineffectively, low hit rate, etc.)
   - Load balancer rules (single server under high load, uneven distribution, etc.)
   - Database rules (overloaded, no read replicas, etc.)
   - Rate limiter rules (DDoS active with no protection, etc.)
   - CDN rules (static content not cached, high bandwidth to servers, etc.)
   - Message queue rules (synchronous bottleneck, no buffering, etc.)
   - General rules (budget waste, redundancy gaps, single points of failure, etc.)
8. Build hint toast component — appears near relevant component on canvas, includes "Ask about this" button
9. Implement "Ask about this" flow — clicking button opens chat panel with pre-filled context message
10. Add API key input field to Settings screen
11. Implement client-side rate limiting with localStorage counter

**Success Criteria:**
- Player can open chat panel and ask system design questions with context-aware responses
- AI references the player's specific architecture in responses ("Your database is at 90% capacity...")
- Hint toasts appear proactively when the engine detects suboptimal design patterns
- Hints feel varied — same scenario doesn't produce the same wording
- "Ask about this" seamlessly bridges hints to deeper chat conversations
- API key is never exposed in client-side code (proxied through Worker)

**Risks:**
- Prompt engineering iteration — the system prompt may need tuning to get contextual responses right. Mitigate by testing with multiple game states.
- Cloudflare Worker setup — first-time Worker deployment may have configuration friction. Mitigate by following Cloudflare's Pages Functions guide.

---

### Phase 5: Progression & Polish — Days 11-12 (Apr 15-16)

**Goal:** Complete game shell, tutorial, and visual polish to make it feel like a real product.

**Deliverables:**
- [ ] Main menu screen with game title, start button, settings
- [ ] Interactive tutorial for first level — guided walkthrough of canvas, toolbox, connections, simulation
- [ ] Toolbox sidebar — component list with icons, names, descriptions, monthly costs
- [ ] Component drag interaction from toolbox to canvas
- [ ] Component icons/sprites for all 8 types
- [ ] Visual polish — animations, transitions, color palette, typography
- [ ] Sound effects (optional) — placement, connection, simulation start, event alerts, scoring
- [ ] Settings screen — hints toggle, sound toggle, API key input
- [ ] Responsive layout adjustments for common desktop resolutions

**Key Tasks:**
1. Design and build main menu screen
2. Build interactive tutorial — step-by-step overlay that highlights UI elements and guides through first placement, first connection, first simulation launch
3. Design toolbox sidebar — searchable/filterable component list with drag handle
4. Create or source component icons/sprites (server rack, database cylinder, cloud CDN, etc.)
5. Add micro-animations — component placement bounce, connection line draw, star reveal on debrief
6. Apply consistent color palette and typography across all screens
7. Optional: add subtle sound effects for key interactions
8. Build settings screen
9. Test on common resolutions (1920x1080, 1440x900, 1280x800)

**Success Criteria:**
- New player can launch the app, complete the tutorial, and understand how to play without external instructions
- The app feels polished — consistent visual language, smooth animations, no jarring transitions
- All screens are navigable and functional
- Game works on common desktop resolutions

**Risks:**
- Polish is a time sink — set hard time limits per visual task. Functionality over aesthetics if time runs short.
- Tutorial design requires the full game to be working — dependent on Phases 1-4 being complete.

---

### Phase 6: Deploy & Launch — Days 13-14 (Apr 17-18)

**Goal:** Production deployment, playtesting, balancing, and launch prep.

**Deliverables:**
- [ ] Cloudflare Pages deployment pipeline (GitHub → auto-deploy on push to main)
- [ ] Cloudflare Worker deployment with API key in environment variable
- [ ] Final playtesting — play through all levels, verify scoring, test edge cases
- [ ] Component cost and throughput balancing adjustments
- [ ] Star threshold tuning based on playtesting
- [ ] Event timing adjustments
- [ ] Bug fixes from playtesting
- [ ] Landing page / intro with product description
- [ ] Open Graph meta tags for social media sharing (title, description, preview image)
- [ ] README.md with project overview, tech stack, setup instructions
- [ ] Performance profiling — verify 60fps target with max component count

**Key Tasks:**
1. Set up Cloudflare Pages project — connect GitHub repo, configure build command (`npm run build`), set output directory (`dist`)
2. Deploy Cloudflare Worker — set `OPENAI_API_KEY` as environment secret
3. Playtest all levels start to finish — note any balance issues, bugs, or UX friction
4. Adjust component costs/throughput if gameplay feels too easy or too hard
5. Tune star thresholds — verify that 1-star is achievable, 3-star requires thought
6. Fix bugs discovered during playtesting
7. Add Open Graph tags to `index.html` for social sharing
8. Write README.md
9. Profile with browser DevTools — verify consistent 60fps
10. Final deploy and smoke test on production URL

**Success Criteria:**
- App is live on Cloudflare Pages with a production URL
- All levels are playable end-to-end with no game-breaking bugs
- AI chat works via Cloudflare Worker proxy
- Star ratings feel fair — brute force gets 1, thoughtful design gets 3
- Page loads in under 3 seconds on standard broadband
- Social media preview (Open Graph) displays correctly when link is shared

**Risks:**
- Playtesting reveals fundamental balance issues — mitigate by keeping level count small (2-3) and accepting that tuning is iterative
- Last-minute bugs — reserve Day 14 afternoon as pure bug-fix buffer

---

## 7. Cost Analysis

### Development Costs

| Phase                  | Effort Estimate | Paid Tools / Licenses | Phase Cost |
|------------------------|----------------|-----------------------|------------|
| Phase 1: Foundation    | 2 days          | None                  | $0         |
| Phase 2: Simulation    | 3 days          | None                  | $0         |
| Phase 3: Events/Levels | 3 days          | None                  | $0         |
| Phase 4: AI & Hints    | 2 days          | OpenAI API (~$1-5)    | ~$3        |
| Phase 5: Polish        | 2 days          | None                  | $0         |
| Phase 6: Deploy        | 2 days          | Domain (~$12/yr)      | ~$12       |
| **Total**              | **14 days**     |                       | **~$15**   |

### Operational Costs at Scale

**Per-session cost model:**
- Average 15 chat interactions per session
- ~2,000 tokens input per interaction (game state + message + system prompt)
- ~500 tokens output per interaction
- Cost per interaction: $0.0006
- Cost per session: ~$0.009

| Component              | 100 users/mo | 1K users/mo | 10K users/mo | 100K users/mo |
|------------------------|-------------|-------------|--------------|---------------|
| Cloudflare Pages       | $0          | $0          | $0           | $0            |
| Cloudflare bandwidth   | $0          | $0          | $0           | $0            |
| Cloudflare Worker      | $0          | $0          | $0           | $5/mo (paid)  |
| OpenAI API (chat)      | $0.90       | $9          | $90          | $900          |
| Domain                 | $1          | $1          | $1           | $1            |
| **Monthly total**      | **~$2**     | **~$10**    | **~$91**     | **~$906**     |

### Alternative Cost Comparison

#### AI Provider

| Option            | Cost @ 1K users/mo | Cost @ 100K users/mo | Notes                              |
|-------------------|--------------------|-----------------------|------------------------------------|
| **GPT-4o-mini**   | $9                 | $900                  | Selected — best cost/quality ratio |
| Claude 3.5 Sonnet | $52                | $5,200                | Better reasoning, 6x more expensive|
| Gemini 2.5 Flash  | $0 (free tier)     | ~$200                 | Free tier generous but rate-limited|

#### Hosting

| Option              | Cost @ 1K users/mo | Cost @ 100K users/mo | Notes                              |
|---------------------|--------------------|-----------------------|------------------------------------|
| **Cloudflare Pages** | $0                | $0                    | Selected — unlimited bandwidth     |
| Vercel (Hobby)      | $0                 | $0 (may hit 100GB)   | Commercial restriction on free tier|
| Vercel (Pro)        | $20                | $20+                  | Needed if commercial or over BW    |

### Cost Summary

| Category                         | Low Estimate | High Estimate |
|----------------------------------|-------------|---------------|
| Total development                | $1          | $20           |
| Monthly ops (@ 1K users)        | $10         | $15           |
| Monthly ops (@ 100K users)      | $900        | $1,200        |
| Annual ops (@ 1K users)         | $120        | $180          |
| Annual ops (@ 100K users)       | $10,800     | $14,400       |

---

## 8. Risks & Mitigations

| Risk                                       | Impact | Likelihood | Mitigation                                                                                   |
|--------------------------------------------|--------|------------|----------------------------------------------------------------------------------------------|
| PixiJS React integration issues            | High   | Medium     | Follow official `@pixi/react` v8 guides; keep vanilla PixiJS fallback plan                   |
| Auto-routing algorithm complexity          | Medium | Medium     | Start with simple Manhattan routing; optimize only if visual quality is unacceptable          |
| Particle system performance                | High   | Low        | Use PixiJS `ParticleContainer` for batch rendering; profile early in Phase 2                  |
| Level balancing feels wrong                | Medium | High       | Accept that balancing is iterative; ship with "good enough" and tune post-launch              |
| Two-week timeline too aggressive           | High   | Medium     | Phase 5 (polish) is the pressure valve — trim tutorial and visual polish first                |
| OpenAI API key exposure                    | High   | Low        | Cloudflare Worker proxy hides key server-side; never in client bundle                        |
| AI responses lack game context             | Medium | Medium     | Iterate on system prompt and state serializer; test with multiple game scenarios              |
| Hint rules feel repetitive                 | Low    | Medium     | 8 variants per rule + cooldown timers; expand variant count post-launch                       |
| localStorage data loss (browser clear)     | Medium | Low        | Accept for MVP; add optional export/import save feature post-launch                           |
| Scope creep during implementation          | High   | High       | Hard scope freeze — MVP features only. Track deferred features for v1.1+                      |

---

## 9. Next Steps

1. Run `/implement` to begin Phase 1 — project scaffolding and game engine core
2. Source or create component icons/sprites (can be placeholder boxes initially)
3. Define exact component stats — costs, throughput limits, and behavior parameters for all 8 types
4. Write the first level definition (URL Shortener) with scripted events and optimal benchmark
5. Set up Cloudflare Pages project and GitHub repo
