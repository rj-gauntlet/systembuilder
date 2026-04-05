import { Graphics } from 'pixi.js';
import type { Connection, Component } from '../engine/types';
import { getPortPixelPosition } from './PortSystem';

const CONNECTION_COLOR = 0x64748b;
const CONNECTION_WIDTH = 2;

export class ConnectionLine {
  readonly graphics: Graphics;
  readonly connectionId: string;

  constructor(connection: Connection, components: Component[]) {
    this.connectionId = connection.id;
    this.graphics = new Graphics();
    this.update(connection, components);
  }

  update(connection: Connection, components: Component[]): void {
    const from = components.find((c) => c.id === connection.fromComponentId);
    const to = components.find((c) => c.id === connection.toComponentId);
    if (!from || !to) return;

    const fromPos = getPortPixelPosition(from.type, from.position, connection.fromPort);
    const toPos = getPortPixelPosition(to.type, to.position, connection.toPort);
    if (!fromPos || !toPos) return;

    this.graphics.clear();

    // Orthogonal routing: horizontal to midpoint, then vertical, then horizontal
    const midX = (fromPos.x + toPos.x) / 2;

    this.graphics.moveTo(fromPos.x, fromPos.y);
    this.graphics.lineTo(midX, fromPos.y);
    this.graphics.lineTo(midX, toPos.y);
    this.graphics.lineTo(toPos.x, toPos.y);
    this.graphics.stroke({ color: CONNECTION_COLOR, width: CONNECTION_WIDTH, alpha: 0.8 });
  }

  /** Get the path waypoints for particle interpolation */
  static getPath(
    connection: Connection,
    components: Component[],
  ): { x: number; y: number }[] | null {
    const from = components.find((c) => c.id === connection.fromComponentId);
    const to = components.find((c) => c.id === connection.toComponentId);
    if (!from || !to) return null;

    const fromPos = getPortPixelPosition(from.type, from.position, connection.fromPort);
    const toPos = getPortPixelPosition(to.type, to.position, connection.toPort);
    if (!fromPos || !toPos) return null;

    const midX = (fromPos.x + toPos.x) / 2;
    return [
      fromPos,
      { x: midX, y: fromPos.y },
      { x: midX, y: toPos.y },
      toPos,
    ];
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
