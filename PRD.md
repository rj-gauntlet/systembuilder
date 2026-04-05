# SystemBuilder — Product Requirements Document

> Generated on 2026-04-04

## 1. Product Overview

### Vision
SystemBuilder is a gamified, interactive system design learning platform modeled after simulation games like SimCity and RollerCoaster Tycoon. Players are tasked with designing real-world systems (TikTok, URL shorteners, chat apps) by placing infrastructure components on a visual canvas within a budget. Once a design goes "live," animated traffic flows through the architecture in real-time. Dynamic events — traffic spikes, DDoS attacks, node failures — stress-test the design and force players to adapt. AI is deeply integrated for hints, architecture review, adaptive difficulty, and custom scenario generation. The learning happens by *seeing* the immediate visual impact of architectural decisions.

### Problem Statement
System design is taught mostly through reading text. Engineers are interviewed on these concepts that they know theoretically from study, but don't really have the opportunity to gain experience implementing them. This lack of hands-on experience makes it difficult to develop an intuitive sense of when to use different design components and principles. Current solutions (books, video courses, static diagram tools) are passive — learners read about load balancers but never see one in action under a traffic spike. There is no product that lets you build a system, watch it run, and stress-test it with realistic events.

### Target Audience
Junior-to-mid-level software engineers, bootcamp graduates, and self-taught developers studying system design — particularly those preparing for system design interviews at tech companies.

### Value Proposition
The only system design learning tool that lets you build, simulate, and stress-test distributed architectures in a gamified environment. Learn by doing, not by reading. See the immediate, visual consequences of every architectural decision — from adding a cache to surviving a DDoS attack.

---

## 2. Competitive Landscape

| Product                    | Approach                                                      | Strengths                                                        | Weaknesses                                                                       |
|----------------------------|---------------------------------------------------------------|------------------------------------------------------------------|----------------------------------------------------------------------------------|
| Codemia                    | Structured wizard for system design problems with AI feedback | 120+ problems, AI critiques scalability/bottlenecks, roadmap     | Static — no simulation, no live traffic, no events. A fancy form, not a game     |
| ArchSim (iOS)              | AI interrogator that challenges your design decisions         | AI asks follow-up questions, daily drills, realistic scenarios   | iOS/Mac only, no visual traffic simulation, no gamification loop (budget/events) |
| Joy of System Design       | Drag-and-drop fill-in-the-blank puzzle                        | Quick (under 10 min), visual, open source                        | Puzzle, not simulation — fill slots in a pre-built design, no dynamic events     |
| Supaboard                  | Whiteboard canvas with pre-built system design components     | Pre-built components, community gallery, requirements tracker    | Pure diagramming tool — no simulation, no AI, no feedback, no game mechanics     |
| Grokking System Design     | Text + embedded visuals course format                         | Comprehensive content, structured curriculum, well-known brand   | Reading-heavy, no interactivity beyond quizzes, no hands-on building             |

### Opportunity
No existing product combines simulation, gamification, and AI for system design learning. Every competitor is either a static practice tool (draw diagrams, get feedback) or passive educational content (read/watch). SystemBuilder fills this gap by bringing the builder-game genre to distributed systems engineering — the closest analog is SimCity applied to backend architecture, not another diagramming tool.

---

## 3. Users

| User Type          | Description                                                                     | Primary Goal                                                       | Key Pain Points                                                                        |
|--------------------|---------------------------------------------------------------------------------|--------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| Learner            | Junior-to-mid engineers, bootcamp grads, self-taught devs studying sys design   | Build intuitive understanding of system design through hands-on play | Learning is passive/text-heavy, no way to practice, concepts feel abstract             |
| Interview Prepper  | Engineers actively preparing for system design interviews at tech companies     | Practice designing systems under realistic constraints              | Existing tools are static diagrams, no feedback on whether a design would actually work |
| Admin/Creator      | Project owner and potential future content creators building levels/scenarios    | Create engaging, educational system design challenges               | Balancing game mechanics with educational accuracy                                     |

### User Journeys

#### Learner — First Level Experience
1. **Discovery** — finds SystemBuilder through social media, dev communities (Reddit, Twitter/X, LinkedIn), or word of mouth
2. **Onboarding** — picks a beginner scenario ("Design a URL Shortener"), gets an interactive tutorial on the canvas and component toolbox
3. **Core action** — places components within budget, launches the simulation, watches traffic flow, reacts to events (server overload, traffic spike), adds components to fix issues
4. **Outcome** — completes the level, sees a score and AI-generated review, and intuitively understands *why* a load balancer or cache was needed because they saw what happened without one

#### Interview Prepper — Timed Challenge
1. **Discovery** — searching for system design interview prep tools
2. **Onboarding** — selects Interview Prep Mode
3. **Core action** — AI presents a timed design challenge ("Design Twitter, 45 minutes"), player builds under time pressure, AI asks follow-up questions
4. **Outcome** — receives AI evaluation comparing their solution to real-world patterns, with specific feedback on gaps

---

## 4. Functional Requirements

| ID    | Domain            | Requirement                      | Description                                                                                    | Priority    | User Type         | Source    |
|-------|-------------------|----------------------------------|------------------------------------------------------------------------------------------------|-------------|-------------------|-----------|
| FR-01 | Core Simulation   | Component Canvas                 | Drag-and-drop canvas for placing system components (servers, DBs, caches, LBs, CDNs, queues)   | Must-have   | Learner           | User      |
| FR-02 | Core Simulation   | Animated Traffic Flow            | Real-time animated visualization of requests flowing through the architecture as particles      | Must-have   | Learner           | User      |
| FR-03 | Core Simulation   | Budget System                    | Limited budget for placing components, forcing real-world tradeoff decisions                    | Must-have   | Learner           | User      |
| FR-04 | Core Simulation   | Dynamic Events                   | Random events (traffic spikes, DDoS, node failures) that stress-test the player's design       | Must-have   | Learner           | User      |
| FR-05 | Core Simulation   | Component Behavior               | Each component type behaves realistically (LB distributes traffic, cache reduces DB hits, etc) | Must-have   | Learner           | User      |
| FR-06 | Gamification      | Levels & Scenarios               | Structured challenges ("Design TikTok", "Design URL Shortener") with clear objectives          | Must-have   | Learner           | User      |
| FR-07 | Gamification      | Scoring & Feedback               | Post-level score based on uptime, latency, cost efficiency, and components used                 | Must-have   | Learner           | User      |
| FR-08 | Gamification      | Progression System               | Unlock harder scenarios as you complete earlier ones                                            | Should-have | Learner           | Suggested |
| FR-09 | Gamification      | Easy / Hard Mode                 | Easy: component placement only. Hard: adds schema design, API design, query performance        | Should-have | Learner           | User      |
| FR-10 | AI                | Chat Assistant                   | Help guide for concepts, answers questions about system design topics in context                | Must-have   | Learner           | User      |
| FR-11 | AI                | Socratic Hint System             | Guides with questions instead of answers ("What sits between a server and a DB?")              | Must-have   | Learner           | User      |
| FR-12 | AI                | Architecture Reviewer            | Post-level AI critique of your design like a senior engineer would                             | Should-have | Learner           | User      |
| FR-13 | AI                | Dynamic Event Narrator           | AI generates events tailored to your specific architecture's weaknesses                        | Should-have | Learner           | User      |
| FR-14 | AI                | Adaptive Difficulty              | AI tracks mastered concepts and targets weak areas with tailored scenarios                      | Could-have  | Learner           | User      |
| FR-15 | AI                | "What If" Simulator              | Ask AI to narrate/animate cascade failures before committing a change                          | Could-have  | Learner           | User      |
| FR-16 | AI                | Interview Prep Mode              | Timed design challenges with AI playing interviewer and evaluating your solution               | Could-have  | Interview Prepper | User      |
| FR-17 | AI                | Custom Scenario Generator        | AI generates full levels from a prompt ("Design a multiplayer game backend")                   | Could-have  | Learner           | User      |
| FR-18 | Data Layer (Hard) | Schema Designer                  | Visual entity-relationship builder; schema choices affect simulation performance               | Should-have | Learner           | User      |
| FR-19 | Data Layer (Hard) | API Designer                     | Define endpoints with request/response shapes; missing endpoints cause feature failures        | Should-have | Learner           | User      |
| FR-20 | Data Layer (Hard) | Database Type Selection          | SQL vs NoSQL vs graph etc — choice affects simulation behavior and cost                        | Should-have | Learner           | User      |
| FR-21 | Data Layer (Hard) | Live Query Visualization         | Click a DB during simulation to see query load, slow queries highlighted in red                | Could-have  | Learner           | User      |
| FR-22 | Data Layer (Hard) | Schema Migration Events          | Mid-scenario events forcing live schema changes under pressure                                 | Could-have  | Learner           | User      |
| FR-23 | Monetization      | Branded/Sponsored Components     | Components labeled as real products (DynamoDB, Cloudflare CDN) via sponsorship deals           | Could-have  | Learner           | User      |
| FR-24 | Onboarding        | Interactive Tutorial             | Guided first-level walkthrough teaching canvas, components, and simulation basics              | Must-have   | Learner           | Suggested |
| FR-25 | Platform          | Progress Saving (localStorage)   | Persist completed levels, scores, in-progress designs, and progression in the browser          | Must-have   | Learner           | User      |
| FR-26 | Platform          | Shareable Results                | Share your completed design / score on social media                                            | Could-have  | Learner           | Suggested |

**Source column:** "User" = explicitly requested. "Suggested" = agent-recommended based on research or product type norms.

### Priority Summary
- **Must-have:** 9 requirements
- **Should-have:** 8 requirements
- **Could-have:** 9 requirements
- **Won't-have:** 0 requirements (none explicitly deferred)

---

## 5. Non-Functional Requirements

| ID     | Category    | Requirement                                             | Target                                                          | Priority    |
|--------|-------------|---------------------------------------------------------|-----------------------------------------------------------------|-------------|
| NFR-01 | Performance | Smooth animation with many components and particles     | 60fps with 50+ components and hundreds of request particles     | Must-have   |
| NFR-02 | Platform    | Desktop-first modern browser support                    | Chrome, Firefox, Edge, Safari (latest 2 versions)               | Must-have   |
| NFR-03 | Storage     | Client-side progress persistence                        | localStorage — no backend required for saving progress          | Must-have   |
| NFR-04 | Rendering   | High-fidelity simulation visuals                        | HTML Canvas or WebGL for particle system and component rendering | Must-have   |
| NFR-05 | Mobile      | Mobile responsiveness                                   | Deferred — desktop-first, mobile planned for future release     | Won't-have  |

---

## 6. Platform & Constraints

### Platforms
| Platform | Required | Notes                                                      |
|----------|----------|------------------------------------------------------------|
| Web      | Yes      | Desktop-first, modern browsers, Canvas/WebGL rendering     |
| iOS      | No       | Deferred — potential future PWA                            |
| Android  | No       | Deferred — potential future PWA                            |

### Constraints
- **Team size:** Solo developer
- **Timeline:** Two-week MVP target
- **Infrastructure:** No backend for MVP beyond AI API calls (OpenAI or Claude)
- **Storage:** localStorage only — no database, no user accounts for MVP
- **Budget:** Portfolio/passion project — minimize infrastructure costs

---

## 7. Success Metrics

| Metric               | Target                                | How to Measure                                            |
|----------------------|---------------------------------------|-----------------------------------------------------------|
| User growth          | Organic traction in dev communities   | Unique visitors, GitHub stars (if open source), shares     |
| Engagement           | Users complete multiple levels         | Levels completed per user (localStorage analytics)        |
| Retention            | Users return after first session       | Return visit rate (tracked via localStorage timestamps)   |
| Learning outcomes    | Users report better design intuition   | Optional post-level survey, community feedback            |
| Portfolio impact     | Demonstrates full-stack + AI skills    | Interview callbacks, recruiter interest                   |

---

## 8. Key Decisions

| Decision                      | Choice                              | Reasoning                                                                                      |
|-------------------------------|-------------------------------------|------------------------------------------------------------------------------------------------|
| Platform                      | Web app (desktop-first)             | No install friction, shareable, canvas-heavy UI works well in browsers                         |
| Backend for MVP               | None (beyond AI API calls)          | Two-week timeline, solo dev — minimize infrastructure complexity                               |
| Progress saving               | localStorage                        | Zero infrastructure, works offline, sufficient for MVP without user accounts                   |
| Rendering engine              | HTML Canvas or WebGL                | Required for smooth 60fps particle animation at scale (50+ components, hundreds of particles)  |
| Difficulty model              | Easy Mode (MVP) / Hard Mode (later) | Easy Mode is shippable in two weeks; Hard Mode (schema, API design) layered in post-launch     |
| AI features for MVP           | Chat assistant + Socratic hints     | Core AI value with manageable scope; reviewer, adaptive difficulty, etc. come later            |
| Monetization                  | Branded/sponsored components        | Non-intrusive, adds educational value (real product names), deferred until user base exists    |
| Visualization approach        | Animated request particles on paths | Intuitive mapping to how engineers think about request flow; proven in simulation game genre    |

---

## 9. Open Questions

- **Which AI provider for MVP?** OpenAI GPT-4o-mini (cheap, fast) vs Claude 3.5 Sonnet (better reasoning) vs local model
- **How many levels for MVP?** 2-3 beginner scenarios seems right — which specific systems to design?
- **Component balancing:** How to set realistic costs and throughput limits for each component type? Needs playtesting
- **Canvas library:** Build custom Canvas2D renderer vs use a library (Pixi.js, Konva, Phaser)?
- **Event timing:** How frequently should dynamic events fire? Too frequent = frustrating, too rare = boring
- **Simulation speed:** Real-time vs accelerated time? Should players be able to fast-forward?
- **Scoring algorithm:** How to weight uptime vs latency vs cost efficiency in the final score?

---

## 10. Next Steps

1. Run `/presearch` on this PRD to generate a `PROJECT_PLAN.md`
2. Decide on canvas rendering library
3. Define the first 2-3 MVP scenarios with specific objectives and events
4. Design component behavior rules (throughput limits, costs, failure modes)
5. Build and ship
