import { Graphics } from 'pixi.js';
import type { HealthStatus } from '../engine/types';

/**
 * Per-component-type drawing functions for the retro data center aesthetic.
 * Each function draws into a Graphics object centered at (0,0).
 * frameCount is used for LED flicker animations.
 */

// ============================================================
// Color Palettes per Health State
// ============================================================

interface Palette {
  border: number;
  bg: number;
  bgDark: number;
  led1: number;
  led2: number;
  accent: number;
  text: number;
}

const PALETTES: Record<HealthStatus, Palette> = {
  healthy:  { border: 0x7c3aed, bg: 0x1a1040, bgDark: 0x110830, led1: 0x22c55e, led2: 0xa78bfa, accent: 0x22c55e, text: 0x60a5fa },
  strained: { border: 0xca8a04, bg: 0x2a1a10, bgDark: 0x1a1008, led1: 0xeab308, led2: 0xeab308, accent: 0xeab308, text: 0xeab308 },
  critical: { border: 0xdc2626, bg: 0x2a1010, bgDark: 0x1a0808, led1: 0xef4444, led2: 0xef4444, accent: 0xef4444, text: 0xef4444 },
  failed:   { border: 0x333333, bg: 0x0a0a0a, bgDark: 0x050505, led1: 0xef4444, led2: 0x111111, accent: 0x222222, text: 0x333333 },
};

// Component-specific border colors when healthy
const TYPE_BORDERS: Record<string, number> = {
  client: 0x2563eb,
  server: 0x7c3aed,
  'load-balancer': 0x0891b2,
  database: 0xd97706,
  cache: 0x059669,
  cdn: 0x0ea5e9,
  'message-queue': 0xea580c,
  'rate-limiter': 0xdb2777,
};

const TYPE_BG: Record<string, number> = {
  client: 0x0a1628,
  server: 0x1a1040,
  'load-balancer': 0x0a2a35,
  database: 0x3a2a0f,
  cache: 0x0f3a2a,
  cdn: 0x0c3a50,
  'message-queue': 0x3a1f0f,
  'rate-limiter': 0x1a0a15,
};

function getBorder(type: string, health: HealthStatus): number {
  return health === 'healthy' ? (TYPE_BORDERS[type] ?? 0x7c3aed) : PALETTES[health].border;
}

function getBg(type: string, health: HealthStatus): number {
  return health === 'healthy' ? (TYPE_BG[type] ?? 0x1a1040) : PALETTES[health].bg;
}

function ledOn(g: Graphics, x: number, y: number, color: number, size: number = 4): void {
  g.circle(x, y, size / 2);
  g.fill({ color, alpha: 1 });
}

function ledOff(g: Graphics, x: number, y: number, size: number = 4): void {
  g.circle(x, y, size / 2);
  g.fill({ color: 0x222222, alpha: 0.6 });
}

function flickerLed(g: Graphics, x: number, y: number, color: number, frame: number, rate: number, size: number = 4): void {
  const on = Math.sin(frame * rate) > 0;
  if (on) {
    ledOn(g, x, y, color, size);
  } else {
    g.circle(x, y, size / 2);
    g.fill({ color, alpha: 0.3 });
  }
}

function ventLines(g: Graphics, x: number, y: number, w: number, h: number, color: number, alpha: number = 0.5): void {
  for (let i = 0; i < w; i += 4) {
    g.rect(x + i, y, 2, h);
  }
  g.fill({ color, alpha });
}

// ============================================================
// SERVER — Stacked rack units with LEDs and vents
// ============================================================

export function drawServer(g: Graphics, health: HealthStatus, frame: number): void {
  const border = getBorder('server', health);
  const bg = getBg('server', health);
  const p = PALETTES[health];
  const isFailed = health === 'failed';

  for (let row = 0; row < 3; row++) {
    const y = -27 + row * 20;

    // Unit body
    g.roundRect(-30, y, 60, 16, 2);
    g.fill({ color: bg });
    g.stroke({ color: border, width: 2 });

    // LEDs
    if (isFailed) {
      flickerLed(g, -22, y + 8, 0xef4444, frame, 0.5);
      ledOff(g, -15, y + 8);
    } else {
      const flickRate = health === 'critical' ? 0.8 : health === 'strained' ? 0.4 : 0.2;
      flickerLed(g, -22, y + 8, p.led1, frame + row * 10, flickRate);
      ledOn(g, -15, y + 8, p.led2);
    }

    // Vent
    ventLines(g, -8, y + 4, 28, 8, isFailed ? 0x111111 : p.bgDark, isFailed ? 0.2 : 0.5);

    // Handle
    g.rect(24, y + 3, 2, 10);
    g.fill({ color: isFailed ? 0x222222 : 0x555555 });
  }
}

// ============================================================
// CLIENT — CRT Monitor with keyboard
// ============================================================

export function drawClient(g: Graphics, health: HealthStatus, frame: number): void {
  const border = getBorder('client', health);
  const bg = getBg('client', health);
  const isFailed = health === 'failed';

  // Screen
  g.roundRect(-28, -30, 56, 36, 3);
  g.fill({ color: bg });
  g.stroke({ color: border, width: 3 });

  // Scanlines on screen
  if (!isFailed) {
    for (let sy = -28; sy < 4; sy += 4) {
      g.rect(-26, sy, 52, 1);
      g.fill({ color: border, alpha: 0.04 });
    }

    // Cursor blink
    const cursorOn = Math.floor(frame / 30) % 2 === 0;
    if (cursorOn) {
      const cursorColor = health === 'critical' ? 0xef4444 : health === 'strained' ? 0xeab308 : 0x60a5fa;
      g.rect(-22, -22, 4, 8);
      g.fill({ color: cursorColor });
    }
  }

  // Stand
  g.rect(-8, 6, 16, 5);
  g.fill({ color: isFailed ? 0x111111 : 0x1e3a5f });
  g.stroke({ color: border, width: 1 });

  // Base
  g.rect(-18, 11, 36, 4);
  g.fill({ color: isFailed ? 0x111111 : 0x1e3a5f });
  g.stroke({ color: border, width: 1 });

  // Keyboard
  g.roundRect(-22, 17, 44, 8, 1);
  g.fill({ color: isFailed ? 0x080808 : 0x0f2440 });
  g.stroke({ color: isFailed ? 0x222222 : 0x1e3a5f, width: 1 });

  // Keys
  for (let k = 0; k < 8; k++) {
    g.rect(-18 + k * 5, 19, 3, 3);
    g.fill({ color: isFailed ? 0x1a1a1a : border, alpha: isFailed ? 0.2 : 0.6 });
  }
}

// ============================================================
// LOAD BALANCER — Wide switch with port LEDs
// ============================================================

export function drawLoadBalancer(g: Graphics, health: HealthStatus, frame: number): void {
  const border = getBorder('load-balancer', health);
  const bg = getBg('load-balancer', health);
  const isFailed = health === 'failed';

  // Wider body
  g.roundRect(-38, -12, 76, 24, 2);
  g.fill({ color: bg });
  g.stroke({ color: border, width: 2 });

  // Port rows
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 8; col++) {
      const px = -32 + col * 8;
      const py = -7 + row * 10;

      g.rect(px, py, 5, 4);

      if (isFailed) {
        g.fill({ color: 0x0a0a0a });
        g.stroke({ color: 0x222222, width: 1 });
      } else {
        // More ports active as health degrades
        const activeThreshold = health === 'critical' ? 8 : health === 'strained' ? 6 : 4;
        const isActive = col < activeThreshold;

        if (isActive) {
          const portColor = health === 'critical' ? 0xef4444 : health === 'strained' ? 0xeab308 : 0x22d3ee;
          const blinkRate = health === 'critical' ? 0.6 : health === 'strained' ? 0.3 : 0.15;
          const on = Math.sin((frame + col * 7 + row * 13) * blinkRate) > -0.3;
          g.fill({ color: on ? portColor : 0x0a1a20, alpha: on ? 0.9 : 0.4 });
          g.stroke({ color: portColor, width: 1, alpha: on ? 0.8 : 0.3 });
        } else {
          g.fill({ color: 0x0a1a20 });
          g.stroke({ color: border, width: 1, alpha: 0.3 });
        }
      }
    }
  }
}

// ============================================================
// DATABASE — Cylinder with disk platters
// ============================================================

export function drawDatabase(g: Graphics, health: HealthStatus, frame: number): void {
  const border = getBorder('database', health);
  const bg = getBg('database', health);
  const p = PALETTES[health];
  const isFailed = health === 'failed';

  // Body (cylinder sides)
  g.rect(-24, -18, 48, 36);
  g.fill({ color: bg });
  g.stroke({ color: border, width: 2 });

  // Platters (horizontal lines)
  for (let i = 0; i < 3; i++) {
    const py = -10 + i * 10;
    g.moveTo(-22, py);
    g.lineTo(22, py);
    g.stroke({ color: isFailed ? 0x333333 : border, width: 1, alpha: isFailed ? 0.15 : 0.4 });
  }

  // Top ellipse
  g.ellipse(0, -18, 24, 8);
  g.fill({ color: isFailed ? 0x0f0f0f : bg });
  g.stroke({ color: border, width: 2 });

  // Inner ellipse (platter)
  g.ellipse(0, -18, 14, 4);
  g.fill({ color: isFailed ? 0x0a0a0a : 0x1f1507 });
  g.stroke({ color: isFailed ? 0x222222 : 0xb45309, width: 1 });

  // Bottom rounded
  g.roundRect(-24, 18, 48, 8, 3);
  g.fill({ color: isFailed ? 0x0d0d0d : 0x2a1f0a });
  g.stroke({ color: border, width: 2 });

  // LEDs at bottom
  if (isFailed) {
    flickerLed(g, -6, 22, 0xef4444, frame, 0.5, 3);
    ledOff(g, 6, 22, 3);
  } else {
    const flickRate = health === 'critical' ? 0.6 : health === 'strained' ? 0.3 : 0.15;
    flickerLed(g, -6, 22, p.led1, frame, flickRate, 3);
    ledOn(g, 6, 22, p.accent, 3);
  }
}

// ============================================================
// CACHE — Slim memory module with lightning bolt
// ============================================================

export function drawCache(g: Graphics, health: HealthStatus, frame: number): void {
  const border = getBorder('cache', health);
  const bg = getBg('cache', health);
  const isFailed = health === 'failed';

  // Main body
  g.roundRect(-26, -10, 52, 20, 2);
  g.fill({ color: bg });
  g.stroke({ color: border, width: 2 });

  // Memory chips
  for (let i = 0; i < 3; i++) {
    const cx = -18 + i * 12;
    g.rect(cx, -6, 8, 12);
    g.fill({ color: isFailed ? 0x0a0a0a : 0x0a2e20 });
    g.stroke({ color: isFailed ? 0x222222 : border, width: 1 });
  }

  // Lightning bolt (drawn as simple zigzag)
  if (!isFailed) {
    const boltAlpha = health === 'critical'
      ? (Math.sin(frame * 0.6) > 0 ? 1 : 0.3)
      : health === 'strained'
        ? 0.5 + Math.sin(frame * 0.15) * 0.3
        : 0.4 + Math.sin(frame * 0.08) * 0.2;
    const boltColor = health === 'critical' ? 0xef4444 : health === 'strained' ? 0xeab308 : 0x34d399;

    g.moveTo(18, -8);
    g.lineTo(14, -1);
    g.lineTo(19, -1);
    g.lineTo(14, 8);
    g.stroke({ color: boltColor, width: 2, alpha: boltAlpha });
  }

  // Speed lines below
  for (let i = 0; i < 3; i++) {
    const sx = -16 + i * 14;
    const alpha = isFailed ? 0.05 : (0.2 + Math.sin(frame * 0.1 + i * 2) * 0.15);
    const color = isFailed ? 0x222222 : health === 'critical' ? 0xef4444 : health === 'strained' ? 0xeab308 : 0x34d399;
    g.rect(sx, 14, 8, 2);
    g.fill({ color, alpha });
  }
}

// ============================================================
// CDN — Satellite dish with signal + base unit
// ============================================================

export function drawCDN(g: Graphics, health: HealthStatus, frame: number): void {
  const border = getBorder('cdn', health);
  const isFailed = health === 'failed';

  // Dish (arc)
  g.moveTo(-14, -8);
  g.quadraticCurveTo(0, -24, 14, -8);
  g.stroke({ color: isFailed ? 0x333333 : border, width: 2 });

  // Inner dish
  g.moveTo(-6, -10);
  g.quadraticCurveTo(0, -18, 6, -10);
  g.stroke({ color: isFailed ? 0x222222 : border, width: 1, alpha: 0.5 });

  // Signal dot
  if (!isFailed) {
    const signalAlpha = health === 'critical'
      ? (Math.floor(frame / 8) % 2 === 0 ? 1 : 0.2)
      : 0.5 + Math.sin(frame * 0.05) * 0.4;
    const signalColor = health === 'critical' ? 0xef4444 : health === 'strained' ? 0xeab308 : 0x38bdf8;
    g.circle(0, -20, 3);
    g.fill({ color: signalColor, alpha: signalAlpha });
  }

  // Mast
  g.rect(-2, -8, 4, 12);
  g.fill({ color: isFailed ? 0x111111 : 0x0c4a6e });
  g.stroke({ color: isFailed ? 0x222222 : border, width: 1 });

  // Base unit
  g.roundRect(-22, 4, 44, 14, 2);
  g.fill({ color: isFailed ? 0x0a0a0a : 0x0c3a50 });
  g.stroke({ color: isFailed ? 0x333333 : border, width: 2 });

  // Base LED
  if (isFailed) {
    ledOff(g, 0, 11, 3);
  } else {
    ledOn(g, 0, 11, PALETTES[health].led1, 3);
  }
}

// ============================================================
// MESSAGE QUEUE — Buffer display with fill indicators
// ============================================================

export function drawMessageQueue(g: Graphics, health: HealthStatus, frame: number, queueDepth: number = 0): void {
  const border = getBorder('message-queue', health);
  const bg = getBg('message-queue', health);
  const isFailed = health === 'failed';

  // Top body
  g.roundRect(-30, -20, 60, 16, 2);
  g.fill({ color: bg });
  g.stroke({ color: border, width: 2 });

  // Arrows
  if (!isFailed) {
    // In arrow
    g.moveTo(-34, -12);
    g.lineTo(-30, -12);
    g.stroke({ color: border, width: 2, alpha: 0.7 });
    // Out arrow
    g.moveTo(30, -12);
    g.lineTo(34, -12);
    g.stroke({ color: border, width: 2, alpha: 0.7 });
  }

  // Buffer display
  g.roundRect(-30, -2, 60, 14, 2);
  g.fill({ color: isFailed ? 0x050505 : 0x0a0500 });
  g.stroke({ color: isFailed ? 0x1a1a1a : 0x7c2d12, width: 2 });

  // Queue slots
  const totalSlots = 7;
  const filledSlots = isFailed ? 3 : Math.min(totalSlots, Math.max(0, Math.floor(queueDepth / 2)));
  const slotColor = health === 'critical' ? 0xef4444 : health === 'strained' ? 0xeab308 : 0xfb923c;

  for (let i = 0; i < totalSlots; i++) {
    const sx = -26 + i * 8;
    g.rect(sx, 1, 5, 8);

    if (i < filledSlots) {
      g.fill({ color: isFailed ? 0x333333 : slotColor });
    } else {
      g.fill({ color: 0x0a0500, alpha: 0.3 });
    }
    g.stroke({ color: isFailed ? 0x1a1a1a : 0x7c2d12, width: 1 });
  }

  // Drain bar
  g.roundRect(-30, 14, 60, 4, 1);
  g.fill({ color: isFailed ? 0x080808 : 0x1f1007 });
  g.stroke({ color: isFailed ? 0x1a1a1a : 0x7c2d12, width: 1 });

  if (!isFailed) {
    const drainWidth = 30 + Math.sin(frame * 0.05) * 15;
    const drainX = -28 + Math.sin(frame * 0.03) * 10;
    g.rect(Math.max(-28, drainX), 15, Math.min(drainWidth, 56), 2);
    g.fill({ color: slotColor, alpha: 0.7 });
  }
}

// ============================================================
// RATE LIMITER — Traffic light with barrier
// ============================================================

export function drawRateLimiter(g: Graphics, health: HealthStatus, frame: number): void {
  const border = getBorder('rate-limiter', health);
  const isFailed = health === 'failed';

  // Traffic light housing
  g.roundRect(-8, -28, 16, 34, 2);
  g.fill({ color: isFailed ? 0x0a0a0a : 0x1a0a15 });
  g.stroke({ color: isFailed ? 0x222222 : border, width: 2 });

  // Red light
  g.circle(0, -20, 4);
  if (isFailed) {
    g.fill({ color: 0x111111 });
  } else if (health === 'critical') {
    g.fill({ color: 0xef4444 });
  } else {
    g.fill({ color: 0x3a1515 });
  }

  // Yellow light
  g.circle(0, -10, 4);
  if (isFailed) {
    g.fill({ color: 0x111111 });
  } else if (health === 'strained') {
    g.fill({ color: 0xeab308 });
  } else {
    g.fill({ color: 0x3a3a15 });
  }

  // Green light
  g.circle(0, 0, 4);
  if (isFailed) {
    g.fill({ color: 0x111111 });
  } else if (health === 'healthy') {
    g.fill({ color: 0x22c55e });
  } else {
    g.fill({ color: 0x153a15 });
  }

  // Barrier stripes
  const barColor = isFailed ? 0x333333 : health === 'critical' ? 0xdc2626 : health === 'strained' ? 0xca8a04 : border;
  const barBg = isFailed ? 0x111111 : 0x1f0715;
  const barAlpha = (health === 'critical' && !isFailed) ? (Math.floor(frame / 10) % 2 === 0 ? 1 : 0.4) : 1;

  for (let i = 0; i < 6; i++) {
    const bx = -22 + i * 8;
    g.rect(bx, 9, 4, 3);
    g.fill({ color: i % 2 === 0 ? barColor : barBg, alpha: barAlpha });
  }

  // Counter box
  g.roundRect(-22, 15, 44, 10, 1);
  g.fill({ color: isFailed ? 0x050505 : 0x0a0508 });
  g.stroke({ color: isFailed ? 0x1a1a1a : 0x581c3f, width: 1 });
}

// ============================================================
// Registry
// ============================================================

export type DrawFunction = (g: Graphics, health: HealthStatus, frame: number, extra?: number) => void;

export const COMPONENT_DRAWERS: Record<string, DrawFunction> = {
  client: drawClient,
  server: drawServer,
  'load-balancer': drawLoadBalancer,
  database: drawDatabase,
  cache: drawCache,
  cdn: drawCDN,
  'message-queue': drawMessageQueue,
  'rate-limiter': drawRateLimiter,
};
