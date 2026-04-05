import type { ComponentType, PortPosition, PortSide, GridPosition } from '../engine/types';
import { COMPONENT_DEFS, GRID_CELL_SIZE } from '../engine/componentDefs';

export interface PortPixelPosition {
  x: number;
  y: number;
  side: PortSide;
  index: number;
}

const COMPONENT_SIZE = GRID_CELL_SIZE * 0.8; // component visual size within cell

/**
 * Calculate pixel positions for all ports on a component.
 * Ports are evenly distributed along the side of the component.
 */
export function getPortPositions(
  type: ComponentType,
  gridPos: GridPosition,
): PortPixelPosition[] {
  const def = COMPONENT_DEFS[type];
  if (!def) return [];

  const cx = gridPos.col * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
  const cy = gridPos.row * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
  const half = COMPONENT_SIZE / 2;

  const ports: PortPixelPosition[] = [];

  for (const portConfig of def.ports) {
    for (let i = 0; i < portConfig.count; i++) {
      const t = (i + 1) / (portConfig.count + 1); // evenly space along side

      let x: number;
      let y: number;

      switch (portConfig.side) {
        case 'top':
          x = cx - half + t * COMPONENT_SIZE;
          y = cy - half;
          break;
        case 'bottom':
          x = cx - half + t * COMPONENT_SIZE;
          y = cy + half;
          break;
        case 'left':
          x = cx - half;
          y = cy - half + t * COMPONENT_SIZE;
          break;
        case 'right':
          x = cx + half;
          y = cy - half + t * COMPONENT_SIZE;
          break;
      }

      ports.push({ x, y, side: portConfig.side, index: i });
    }
  }

  return ports;
}

/**
 * Get pixel position for a specific port
 */
export function getPortPixelPosition(
  type: ComponentType,
  gridPos: GridPosition,
  port: PortPosition,
): { x: number; y: number } | null {
  const allPorts = getPortPositions(type, gridPos);
  const match = allPorts.find((p) => p.side === port.side && p.index === port.index);
  return match ? { x: match.x, y: match.y } : null;
}

/**
 * Find the nearest port to a pixel position
 */
export function findNearestPort(
  type: ComponentType,
  gridPos: GridPosition,
  px: number,
  py: number,
  maxDistance: number = 20,
): PortPosition | null {
  const ports = getPortPositions(type, gridPos);
  let nearest: PortPixelPosition | null = null;
  let nearestDist = maxDistance;

  for (const port of ports) {
    const dx = port.x - px;
    const dy = port.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = port;
    }
  }

  return nearest ? { side: nearest.side, index: nearest.index } : null;
}

export const PORT_RADIUS = 5;
