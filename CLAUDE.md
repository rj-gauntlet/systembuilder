# SystemBuilder — Project Context

## What This Is
SystemBuilder is a gamified, interactive system design learning platform — SimCity/RollerCoaster Tycoon for distributed systems. Players build architectures on a visual canvas, watch animated traffic flow, and survive dynamic stress events. AI provides contextual help and Socratic hints.

## Current Status
- **PRD.md** — Complete. 26 functional requirements, 5 non-functional requirements, 3 user types.
- **PROJECT_PLAN.md** — Complete. 6 phases, 53 tasks, 14-day timeline (Apr 5-18).
- **DASHBOARD.html** — Generated. Pipeline at Presearch complete, ready for /implement.
- **Code** — Not started yet. Next step is `/implement` to begin Phase 1.

## Key Decisions Made (Do NOT revisit — these are locked in)

### Architecture
- **Engine/Renderer separation** — Game engine is pure TypeScript with zero rendering knowledge. Renderer (PixiJS) reads `GameState` from engine and draws everything. React handles UI outside the canvas. The contract between them is a typed `GameState` interface.
- **Three layers:** Game Engine (logic) → Renderer (canvas visuals) → Frontend (React UI)
- **HUD lives inside the canvas** (game-style, SimCity aesthetic) — budget bar, event banners, stat overlays are rendered by PixiJS, NOT React

### Tech Stack
| Layer           | Technology           |
|-----------------|----------------------|
| Game Engine     | Pure TypeScript      |
| Renderer        | PixiJS v8            |
| Frontend        | React 19 + Vite      |
| AI Provider     | GPT-4o-mini          |
| Hosting         | Cloudflare Pages     |
| API Proxy       | Cloudflare Workers   |
| Storage         | localStorage         |
| Language        | TypeScript 5.x       |

### Core Simulation Mechanics
- **8 MVP components:** Client, Server, Load Balancer, Database, Cache, CDN, Message Queue, Rate Limiter
- **Connections:** Manual draw with snap-to-grid, auto-routing orthogonal wires, connection ports on each component
- **All connections allowed** — no validation/rejection. The simulation teaches through consequences (ineffective placements show visible impact). Only physically nonsensical connections are blocked.
- **Particle system:** Requests flow as particles at constant speed between components. Particles stack/queue INSIDE overloaded components (not slower between them). Components show health colors (green → yellow → red). Dropped requests visually shatter/fade.
- **Stat overlays:** Each component shows real-time metrics (req/s, latency, hit rate, queue depth)
- **Budget:** Monthly cost model ($X/month per component). Build + operate cost model (CapEx + OpEx) deferred to Hard Mode.

### Events
- **Scripted + random:** Each level has scripted core events (fire at specific timestamps) for teaching, then random bonus events from a pool after scripted sequence completes
- **AI-driven events (Option D)** deferred to post-MVP (when Dynamic Event Narrator FR-13 is built)

### Gamification
- **Level flow:** Briefing → Build → Go Live → Events → Debrief
- **3-star scoring** against optimal benchmark metrics (uptime, latency, cost efficiency, survival)
- **Star-gated tier progression:** Total star accumulation to unlock next tier + minimum 1 star on every level (no skipping)
- **Easy Mode (MVP) / Hard Mode (later):** Easy = component placement only. Hard = adds schema design, API design, query performance.

### AI Integration
- **Chat assistant** (React panel) — GPT-4o-mini with full game state snapshot as context. Behind an `AIProvider` interface for swapping models later.
- **Socratic hint system** (canvas toast notifications) — ALGORITHMIC, not AI. Rules engine with 8 randomized variants per rule. Zero token cost.
- **"Ask about this" button** on hints — passes hint context into the chat panel for deeper discussion
- **Cloudflare Worker proxy** hides API key server-side. User can provide their own key as fallback.
- **Rate limit:** 50 chat messages per day per user (localStorage tracked)

### Monetization
- Branded/sponsored components (e.g., "Amazon DynamoDB" instead of generic "Database") — deferred until user base exists

### Deployment
- **Cloudflare Pages** — unlimited bandwidth, commercial use allowed, fastest CDN
- Chosen over Vercel (commercial restriction on free tier, 100GB bandwidth limit)
- Godot was evaluated and rejected — web bundle too large (15-30MB vs 1-3MB), GDScript learning curve, poor React integration

## Post-MVP Roadmap (in order)
1. **v1.1** — 3-5 more levels across Intermediate and Advanced tiers
2. **v1.2** — Architecture Reviewer (AI post-level critique) + Dynamic Event Narrator (AI-generated events)
3. **v2.0** — Hard Mode (schema designer, API designer, DB type selection, build + operate costs)
4. **v2.1** — AI-driven event generation, adaptive difficulty
5. **v3.0** — Interview Prep Mode, custom scenario generator, shareable results
6. **v4.0** — Branded/sponsored components, mobile support

## Post-MVP Components (not in MVP)
API Gateway, Reverse Proxy, Search Index, Object Storage (S3), DNS/Domain Router, Firewall/WAF, Pub/Sub (Event Bus), Scheduler/Cron, Blob/File DB, Replication Node, Shard, Service Mesh/Sidecar

## Implementation Phases

### Phase 1: Foundation — Days 1-2 (Apr 5-6)
Project scaffolding, GameState types, GameEngine class, 8 component data models, PixiJS canvas with snap-to-grid, port system, localStorage skeleton.

### Phase 2: Wiring & Simulation — Days 3-5 (Apr 7-9)
Connection drawing with auto-routing, simulation tick loop, component behaviors, particle system, stat overlays, health visualization, budget system + HUD.

### Phase 3: Events & Levels — Days 6-8 (Apr 10-12)
Event system (scripted + random), event effects, 2-3 MVP levels (URL Shortener, Paste Bin, Chat App), level flow, 3-star scoring, debrief screen, level select, tier progression, progress persistence.

### Phase 4: AI & Hints — Days 9-10 (Apr 13-14)
AIProvider interface + OpenAIProvider, Cloudflare Worker proxy, game state serializer, chat panel, hint rules engine (40-60 rules × 8 variants), hint toasts with "Ask about this", user API key fallback, rate limiting.

### Phase 5: Progression & Polish — Days 11-12 (Apr 15-16)
Main menu, interactive tutorial, toolbox sidebar, component icons, visual polish, animations, settings screen, responsive layout.

### Phase 6: Deploy & Launch — Days 13-14 (Apr 17-18)
Cloudflare Pages + Worker deployment, playtesting, balancing, bug fixes, landing page, OG meta tags, README, performance profiling.

## Project Structure
See PROJECT_PLAN.md Section 5 for the full directory tree. Key paths:
- `/src/engine/` — Pure TS game engine (types.ts, GameEngine.ts, SimulationLoop.ts, components/)
- `/src/renderer/` — PixiJS rendering (GameCanvas.tsx, ParticleSystem.ts, ConnectionLine.ts, HUD.ts)
- `/src/ui/` — React screens and components (screens/, components/, layouts/)
- `/src/ai/` — AI provider abstraction (types.ts, OpenAIProvider.ts, stateSerializer.ts, prompts.ts)
- `/src/hints/` — Algorithmic hint system (HintEngine.ts, rules/)
- `/src/storage/` — localStorage persistence (ProgressStore.ts)
- `/src/levels/` — Level definitions (beginner/)
- `/worker/` — Cloudflare Worker AI proxy

## Data Models
See PROJECT_PLAN.md Section 3 "Data Models" for full TypeScript interfaces:
- `GameState` — engine/renderer contract
- `Component`, `Connection`, `Particle`, `Budget`, `Score`, `SimulationState`
- `LevelDefinition`, `ScriptedEvent`, `StarCriteria`
- `PlayerProgress`, `LevelProgress`, `PlayerSettings`
- `HintRule` — condition function + 8 variant strings + cooldown

## Pipeline Rules
After completing ANY pipeline skill (prd-generator, presearch, implement, review, test-qa, stunner, ship), MUST regenerate `DASHBOARD.html` by invoking the `/dashboard` skill before telling the user the stage is complete. Non-negotiable.
