import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Component, HealthStatus } from '../engine/types';
import { GRID_CELL_SIZE } from '../engine/componentDefs';
import { getPortPositions, PORT_RADIUS } from './PortSystem';
import { COMPONENT_DRAWERS } from './componentDrawers';

const TYPE_LABELS: Record<string, string> = {
  client: 'CLIENT',
  server: 'SERVER',
  'load-balancer': 'LOAD BAL',
  database: 'DATABASE',
  cache: 'CACHE',
  cdn: 'CDN',
  'message-queue': 'MSG QUEUE',
  'rate-limiter': 'RATE LIM',
};

const TYPE_LABEL_COLORS: Record<string, number> = {
  client: 0x60a5fa,
  server: 0xa78bfa,
  'load-balancer': 0x22d3ee,
  database: 0xfbbf24,
  cache: 0x34d399,
  cdn: 0x38bdf8,
  'message-queue': 0xfb923c,
  'rate-limiter': 0xf472b6,
};

const labelStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 7,
  fill: 0xffffff,
  fontWeight: 'bold',
  letterSpacing: 0.5,
});

export class ComponentSprite {
  readonly container: Container;
  private body: Graphics;
  private portGraphics: Graphics;
  private label: Text;
  private frameCount = 0;

  componentId: string;
  componentType: Component['type'];
  private lastHealth: HealthStatus = 'healthy';

  constructor(component: Component) {
    this.componentId = component.id;
    this.componentType = component.type;

    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    // Main body (drawn by type-specific drawer)
    this.body = new Graphics();
    this.container.addChild(this.body);

    // Port dots
    this.portGraphics = new Graphics();
    this.container.addChild(this.portGraphics);

    // Label below component
    const labelText = TYPE_LABELS[component.type] ?? '???';
    this.label = new Text({ text: labelText, style: labelStyle });
    this.label.anchor.set(0.5);
    this.label.position.set(0, 32);
    this.label.style.fill = TYPE_LABEL_COLORS[component.type] ?? 0xffffff;
    this.container.addChild(this.label);

    this.updatePosition(component);
    this.redraw(component);
    this.drawPorts(component);
  }

  private redraw(component: Component): void {
    this.body.clear();
    this.lastHealth = component.health;

    const drawer = COMPONENT_DRAWERS[component.type];
    if (drawer) {
      const extra = component.stats.queueDepth ?? 0;
      drawer(this.body, component.health, this.frameCount, extra);
    }

    // Update label color based on health
    if (component.health === 'failed') {
      this.label.style.fill = 0x333333;
    } else if (component.health === 'critical') {
      this.label.style.fill = 0xef4444;
    } else if (component.health === 'strained') {
      this.label.style.fill = 0xeab308;
    } else {
      this.label.style.fill = TYPE_LABEL_COLORS[component.type] ?? 0xffffff;
    }
  }

  private drawPorts(component: Component): void {
    const ports = getPortPositions(component.type, component.position);
    const cx = component.position.col * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
    const cy = component.position.row * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

    this.portGraphics.clear();
    for (const port of ports) {
      const rx = port.x - cx;
      const ry = port.y - cy;
      this.portGraphics.circle(rx, ry, PORT_RADIUS);
    }
    this.portGraphics.fill({ color: 0xffffff, alpha: 0.4 });
    this.portGraphics.stroke({ color: 0xffffff, width: 1, alpha: 0.6 });
  }

  updatePosition(component: Component): void {
    const x = component.position.col * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
    const y = component.position.row * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
    this.container.position.set(x, y);
    this.drawPorts(component);
  }

  update(component: Component): void {
    this.frameCount++;
    this.updatePosition(component);

    // Redraw every few frames for LED animations, or immediately on health change
    if (component.health !== this.lastHealth || this.frameCount % 4 === 0) {
      this.redraw(component);
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
