import { Graphics } from 'pixi.js';
import type { Particle, Connection, Component } from '../engine/types';
import { ConnectionLine } from './ConnectionLine';

const READ_REQUEST_COLOR = 0x38bdf8;   // sky blue
const WRITE_REQUEST_COLOR = 0x818cf8;  // indigo
const RESPONSE_COLOR = 0x22c55e;       // green
const DROPPED_COLOR = 0xef4444;        // red
const PARTICLE_RADIUS = 3;
const OFFSET = 4; // pixel offset above/below the line
const DROP_ANIM_FRAMES = 20;

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
      // Dropped particles animate in place (red flash + expand)
      if (particle.status === 'dropped') {
        this.renderDropped(particle, connections, components);
        continue;
      }

      if (particle.stuckInComponent) continue;

      const conn = connections.find((c) => c.id === particle.connectionId);
      if (!conn) continue;

      const path = ConnectionLine.getPath(conn, components);
      if (!path) continue;

      const pos = particle.position;
      const point = this.interpolatePath(path, pos);
      if (!point) continue;

      const normal = this.getPathNormal(path, pos);
      const sign = particle.direction === 'request' ? -1 : 1;
      const px = point.x + normal.x * OFFSET * sign;
      const py = point.y + normal.y * OFFSET * sign;

      let color: number;
      if (particle.direction === 'response') {
        color = RESPONSE_COLOR;
      } else {
        color = particle.kind === 'write' ? WRITE_REQUEST_COLOR : READ_REQUEST_COLOR;
      }

      this.graphics.circle(px, py, PARTICLE_RADIUS);
      this.graphics.fill({ color, alpha: 1 });
    }
  }

  private renderDropped(
    particle: Particle,
    connections: Connection[],
    components: Component[],
  ): void {
    const age = particle.droppedAge ?? 0;
    if (age >= DROP_ANIM_FRAMES) return;

    const conn = connections.find((c) => c.id === particle.connectionId);
    if (!conn) return;

    const path = ConnectionLine.getPath(conn, components);
    if (!path) return;

    const point = this.interpolatePath(path, particle.position);
    if (!point) return;

    // Expand and fade
    const t = age / DROP_ANIM_FRAMES;
    const radius = PARTICLE_RADIUS + t * 8;
    const alpha = 1 - t;

    this.graphics.circle(point.x, point.y, radius);
    this.graphics.fill({ color: DROPPED_COLOR, alpha });
  }

  private interpolatePath(
    path: { x: number; y: number }[],
    t: number,
  ): { x: number; y: number } | null {
    if (path.length < 2) return null;

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
