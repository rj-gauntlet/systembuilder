import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Component } from '../engine/types';
import { GRID_CELL_SIZE } from '../engine/componentDefs';

function r2(n: number): string {
  return n.toFixed(2);
}

const OVERLAY_WIDTH = 70;
const OVERLAY_HEIGHT = 36;

const statStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 9,
  fill: 0xd1d5db,
  lineHeight: 12,
});

export class StatOverlay {
  readonly container: Container;
  private bg: Graphics;
  private text: Text;

  constructor() {
    this.container = new Container();
    this.container.visible = false;

    this.bg = new Graphics();
    this.bg.roundRect(0, 0, OVERLAY_WIDTH, OVERLAY_HEIGHT, 4);
    this.bg.fill({ color: 0x000000, alpha: 0.75 });
    this.container.addChild(this.bg);

    this.text = new Text({ text: '', style: statStyle });
    this.text.position.set(4, 3);
    this.container.addChild(this.text);
  }

  update(component: Component): void {
    const stats = component.stats;
    const lines: string[] = [];

    lines.push(`${r2(stats.requestsPerSecond)} req/s`);

    if (stats.hitRate !== undefined) {
      lines.push(`hit: ${r2(stats.hitRate * 100)}%`);
    } else if (stats.queueDepth !== undefined) {
      lines.push(`q: ${stats.queueDepth}`);
    } else {
      lines.push(`${r2(stats.latencyMs)}ms`);
    }

    this.text.text = lines.join('\n');

    // Position below the component
    const x = component.position.col * GRID_CELL_SIZE + GRID_CELL_SIZE / 2 - OVERLAY_WIDTH / 2;
    const y = component.position.row * GRID_CELL_SIZE + GRID_CELL_SIZE / 2 + GRID_CELL_SIZE * 0.45;
    this.container.position.set(x, y);
    this.container.visible = true;
  }

  hide(): void {
    this.container.visible = false;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
