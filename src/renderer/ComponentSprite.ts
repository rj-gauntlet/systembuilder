import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Component, HealthStatus } from '../engine/types';
import { GRID_CELL_SIZE } from '../engine/componentDefs';
import { getPortPositions, PORT_RADIUS } from './PortSystem';

const COMPONENT_SIZE = GRID_CELL_SIZE * 0.8;

const HEALTH_COLORS: Record<HealthStatus, number> = {
  healthy: 0x22c55e,   // green
  strained: 0xeab308,  // yellow
  critical: 0xef4444,  // red
  failed: 0x6b7280,    // gray
};

const TYPE_COLORS: Record<string, number> = {
  client: 0x3b82f6,
  server: 0x8b5cf6,
  'load-balancer': 0x06b6d4,
  database: 0xf59e0b,
  cache: 0x10b981,
  cdn: 0x0ea5e9,
  'message-queue': 0xf97316,
  'rate-limiter': 0xec4899,
};

const TYPE_LABELS: Record<string, string> = {
  client: 'CLT',
  server: 'SRV',
  'load-balancer': 'LB',
  database: 'DB',
  cache: 'CHE',
  cdn: 'CDN',
  'message-queue': 'MQ',
  'rate-limiter': 'RL',
};

const labelStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 11,
  fill: 0xffffff,
  fontWeight: 'bold',
});

export class ComponentSprite {
  readonly container: Container;
  private body: Graphics;
  private healthRing: Graphics;
  private label: Text;
  private portGraphics: Graphics;

  componentId: string;
  componentType: Component['type'];

  constructor(component: Component) {
    this.componentId = component.id;
    this.componentType = component.type;

    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    // Health ring (behind body)
    this.healthRing = new Graphics();
    this.container.addChild(this.healthRing);

    // Main body
    this.body = new Graphics();
    this.container.addChild(this.body);

    // Port dots
    this.portGraphics = new Graphics();
    this.container.addChild(this.portGraphics);

    // Label
    this.label = new Text({ text: TYPE_LABELS[component.type] ?? '?', style: labelStyle });
    this.label.anchor.set(0.5);
    this.container.addChild(this.label);

    this.drawBody(component);
    this.updatePosition(component);
    this.updateHealth(component.health);
    this.drawPorts(component);
  }

  private drawBody(component: Component): void {
    const color = TYPE_COLORS[component.type] ?? 0x888888;
    const half = COMPONENT_SIZE / 2;

    this.body.clear();
    this.body.roundRect(-half, -half, COMPONENT_SIZE, COMPONENT_SIZE, 8);
    this.body.fill({ color, alpha: 0.9 });
    this.body.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
  }

  private drawPorts(component: Component): void {
    const ports = getPortPositions(component.type, component.position);
    const cx = component.position.col * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
    const cy = component.position.row * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

    this.portGraphics.clear();
    for (const port of ports) {
      // Position relative to container center
      const rx = port.x - cx;
      const ry = port.y - cy;
      this.portGraphics.circle(rx, ry, PORT_RADIUS);
    }
    this.portGraphics.fill({ color: 0xffffff, alpha: 0.6 });
    this.portGraphics.stroke({ color: 0xffffff, width: 1, alpha: 0.8 });
  }

  updatePosition(component: Component): void {
    const x = component.position.col * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
    const y = component.position.row * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
    this.container.position.set(x, y);
    this.drawPorts(component);
  }

  updateHealth(health: HealthStatus): void {
    const color = HEALTH_COLORS[health];
    const half = COMPONENT_SIZE / 2 + 3;

    this.healthRing.clear();
    this.healthRing.roundRect(-half, -half, half * 2, half * 2, 10);
    this.healthRing.stroke({ color, width: 2, alpha: 0.8 });
  }

  update(component: Component): void {
    this.updatePosition(component);
    this.updateHealth(component.health);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
