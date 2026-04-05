# Implementation Log

## Phase 1: Foundation — 2026-04-04
- **Status:** Complete
- **Deliverables:** 8/8 complete
- **Deviations:** None
- **Notes:** Used vanilla PixiJS v8 instead of `@pixi/react` declarative API — imperative approach gave better control over the game loop and layer management.

## Phase 2: Wiring & Simulation — 2026-04-04
- **Status:** Complete
- **Deliverables:** 12/12 complete
- **Deviations:**
  - Bidirectional port model instead of directional in/out ports (major — user approved). Round-trip particles with request/response direction instead of one-way flow. Teaches latency more accurately and creates visible traffic density differences for cache hit rates.
  - Auto-orient connections by component type priority hierarchy (minor). Prevents user click order from creating backwards connections. Client is always upstream, Database always downstream.
  - Right-click to delete components (minor addition, not in plan).
  - Editing allowed while paused (minor, user requested).
- **Notes:** Client throughput reduced from 1000 spawns/sec to ~4 visual particles/sec for readability. Particle render offset (requests above line, responses below) solves bidirectional wire clarity.

## Phase 3: Events & Levels — 2026-04-05
- **Status:** Complete
- **Deliverables:** 11/11 complete
- **Deviations:**
  - Added Sandbox Mode accessible from main menu (minor addition). Lets players experiment without level constraints.
  - Client port count reduced from 3 to 2, LB input ports increased from 2 to 4 (minor — user approved during design discussion).
- **Notes:** Event effects modify component state directly each tick while active. Star thresholds may need tuning during playtesting (Phase 6). Simulation duration set to 90 seconds for all beginner levels.

## Phase 4: AI & Hints — 2026-04-05
- **Status:** Complete
- **Deliverables:** 11/11 complete
- **Deviations:**
  - 14 hint rules instead of 40-60 (minor). Covers all major scenarios — can add more rules post-MVP without architectural changes.
- **Notes:** AI chat requires either a Cloudflare Worker proxy (not yet deployed) or user-provided API key. Chat works with direct OpenAI key. Hints are purely algorithmic — zero token cost.

## Phase 5: Progression & Polish — 2026-04-05
- **Status:** Complete
- **Deliverables:** 7/9 complete (2 deferred)
- **Deviations:**
  - Component drag from toolbox to canvas deferred (minor). Click-to-place works well enough for MVP.
  - Sound effects deferred (optional per plan).
  - Used emoji icons instead of custom SVG sprites (minor). Faster to implement, visually distinctive, cross-platform.
- **Notes:** Tutorial is 9 steps, shown on first visit. Inter font loaded via Google Fonts CDN. OG meta tags added for social sharing.
