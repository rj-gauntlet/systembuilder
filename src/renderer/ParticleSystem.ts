import { Graphics } from 'pixi.js';
import type { Particle, Connection, Component } from '../engine/types';
import { ConnectionLine } from './ConnectionLine';

const REQUEST_COLOR = 0x3b82f6;   // blue
const RESPONSE_COLOR = 0x22c55e;  // green
const DROPPED_COLOR = 0xef4444;   // red
const PARTICLE_RADIUS = 3;
const OFFSET = 4; // pixel offset above/below the line

export class ParticleRenderer {
  readonly graphics: Graphics;

  constructor() {
    this.graphics = new Graphics();
  }

  update(
    particles: Particle[],
    connections: Connection[],
    components: Component[],
  ): void {
    this.graphics.clear();

    for (const particle of particles) {
      if (particle.stuckInComponent) continue; // don't render queued particles on wire

      const conn = connections.find((c) => c.id === particle.connectionId);
      if (!conn) continue;

      const path = ConnectionLine.getPath(conn, components);
      if (!path) continue;

      // Interpolate position along the path
      const pos = particle.direction === 'request'
        ? particle.position
        : 1 - particle.position; // response travels visually in reverse

      const point = this.interpolatePath(path, pos);
      if (!point) continue;

      // Calculate offset perpendicular to the path segment
      const normal = this.getPathNormal(path, pos);

      // Requests ride slightly above/left, responses below/right
      const sign = particle.direction === 'request' ? -1 : 1;
      const px = point.x + normal.x * OFFSET * sign;
      const py = point.y + normal.y * OFFSET * sign;

      // Color based on status
      let color = particle.direction === 'request' ? REQUEST_COLOR : RESPONSE_COLOR;
      let alpha = 1;
      if (particle.status === 'dropped') {
        color = DROPPED_COLOR;
        alpha = 0.6;
      }

      this.graphics.circle(px, py, PARTICLE_RADIUS);
      this.graphics.fill({ color, alpha });
    }
  }

  private interpolatePath(
    path: { x: number; y: number }[],
    t: number,
  ): { x: number; y: number } | null {
    if (path.length < 2) return null;

    // Calculate total path length
    let totalLength = 0;
    const segLengths: number[] = [];
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      segLengths.push(len);
      totalLength += len;
    }

    if (totalLength === 0) return path[0];

    // Find which segment t falls on
    let targetDist = t * totalLength;
    for (let i = 0; i < segLengths.length; i++) {
      if (targetDist <= segLengths[i]) {
        const segT = segLengths[i] > 0 ? targetDist / segLengths[i] : 0;
        return {
          x: path[i].x + (path[i + 1].x - path[i].x) * segT,
          y: path[i].y + (path[i + 1].y - path[i].y) * segT,
        };
      }
      targetDist -= segLengths[i];
    }

    return path[path.length - 1];
  }

  private getPathNormal(
    path: { x: number; y: number }[],
    t: number,
  ): { x: number; y: number } {
    if (path.length < 2) return { x: 0, y: -1 };

    // Find the segment at position t
    let totalLength = 0;
    const segLengths: number[] = [];
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      segLengths.push(Math.sqrt(dx * dx + dy * dy));
      totalLength += segLengths[segLengths.length - 1];
    }

    let targetDist = t * totalLength;
    for (let i = 0; i < segLengths.length; i++) {
      if (targetDist <= segLengths[i] || i === segLengths.length - 1) {
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        const len = segLengths[i] || 1;
        // Normal is perpendicular to direction
        return { x: -dy / len, y: dx / len };
      }
      targetDist -= segLengths[i];
    }

    return { x: 0, y: -1 };
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
