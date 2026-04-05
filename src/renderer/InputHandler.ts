import type { Container, FederatedPointerEvent } from 'pixi.js';
import type { GameEngine } from '../engine/GameEngine';
import type { ComponentType, GridPosition, PortPosition } from '../engine/types';
import { GridSystem } from './GridSystem';
import { findNearestPort, getPortPixelPosition } from './PortSystem';

export type InputMode = 'select' | 'place' | 'connect';

export interface InputState {
  mode: InputMode;
  placingType: ComponentType | null;
  connectingFrom: { componentId: string; port: PortPosition } | null;
  draggingComponentId: string | null;
  hoverGrid: GridPosition | null;
}

export class InputHandler {
  private state: InputState = {
    mode: 'select',
    placingType: null,
    connectingFrom: null,
    draggingComponentId: null,
    hoverGrid: null,
  };

  private grid: GridSystem;
  private engine: GameEngine;
  private onStateChange: () => void;

  constructor(
    grid: GridSystem,
    engine: GameEngine,
    _sprites: Map<string, unknown>,
    onStateChange: () => void,
  ) {
    this.grid = grid;
    this.engine = engine;
    this.onStateChange = onStateChange;
  }

  getState(): InputState {
    return this.state;
  }

  setPlacingMode(type: ComponentType): void {
    this.state.mode = 'place';
    this.state.placingType = type;
    this.state.connectingFrom = null;
    this.state.draggingComponentId = null;
  }

  setSelectMode(): void {
    this.state.mode = 'select';
    this.state.placingType = null;
    this.state.connectingFrom = null;
    this.state.draggingComponentId = null;
  }

  setConnectMode(): void {
    this.state.mode = 'connect';
    this.state.placingType = null;
    this.state.connectingFrom = null;
    this.state.draggingComponentId = null;
  }

  attachToStage(stage: Container): void {
    stage.eventMode = 'static';
    stage.hitArea = { contains: () => true };

    stage.on('pointerdown', (e: FederatedPointerEvent) => this.onPointerDown(e));
    stage.on('pointermove', (e: FederatedPointerEvent) => this.onPointerMove(e));
    stage.on('pointerup', (e: FederatedPointerEvent) => this.onPointerUp(e));
    stage.on('rightclick', (e: FederatedPointerEvent) => this.onRightClick(e));
  }

  private isEditable(): boolean {
    const status = this.engine.getState().simulation.status;
    return status === 'building' || status === 'paused';
  }

  private onRightClick(e: FederatedPointerEvent): void {
    e.preventDefault();
    if (!this.isEditable()) return;

    const pos = e.global;
    const gridPos = this.grid.pixelToGrid(pos.x, pos.y);
    const comp = this.findComponentAt(gridPos);
    if (comp) {
      this.engine.removeComponent(comp.id);
      this.onStateChange();
      return;
    }

    // No component under cursor — try to find nearest connection to delete
    const nearestConn = this.findNearestConnection(pos.x, pos.y, 20);
    if (nearestConn) {
      this.engine.disconnect(nearestConn);
      this.onStateChange();
    }
  }

  private findNearestConnection(px: number, py: number, maxDist: number): string | null {
    const state = this.engine.getState();
    let bestId: string | null = null;
    let bestDist = maxDist;

    for (const conn of state.connections) {
      const from = state.components.find((c) => c.id === conn.fromComponentId);
      const to = state.components.find((c) => c.id === conn.toComponentId);
      if (!from || !to) continue;

      const fromPos = getPortPixelPosition(from.type, from.position, conn.fromPort);
      const toPos = getPortPixelPosition(to.type, to.position, conn.toPort);
      if (!fromPos || !toPos) continue;

      // Check distance to the orthogonal path segments
      const midX = (fromPos.x + toPos.x) / 2;
      const segments = [
        { x1: fromPos.x, y1: fromPos.y, x2: midX, y2: fromPos.y },
        { x1: midX, y1: fromPos.y, x2: midX, y2: toPos.y },
        { x1: midX, y1: toPos.y, x2: toPos.x, y2: toPos.y },
      ];

      for (const seg of segments) {
        const dist = this.distToSegment(px, py, seg.x1, seg.y1, seg.x2, seg.y2);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = conn.id;
        }
      }
    }

    return bestId;
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  }

  private onPointerDown(e: FederatedPointerEvent): void {
    const pos = e.global;
    const gridPos = this.grid.pixelToGrid(pos.x, pos.y);

    if (this.state.mode === 'place' && this.state.placingType && this.isEditable()) {
      // Check if cell is occupied
      const occupied = this.engine
        .getState()
        .components.some((c) => c.position.col === gridPos.col && c.position.row === gridPos.row);

      if (!occupied) {
        this.engine.addComponent(this.state.placingType, gridPos);
        this.onStateChange();
      }
      return;
    }

    if (this.state.mode === 'connect' && this.isEditable()) {
      // Find component under cursor
      const comp = this.findComponentAt(gridPos);
      if (comp) {
        const port = findNearestPort(comp.type, comp.position, pos.x, pos.y, 25);
        if (port) {
          if (!this.state.connectingFrom) {
            this.state.connectingFrom = { componentId: comp.id, port };
          } else {
            // Complete connection
            this.engine.connect(
              this.state.connectingFrom.componentId,
              this.state.connectingFrom.port,
              comp.id,
              port,
            );
            this.state.connectingFrom = null;
            this.onStateChange();
          }
        }
      } else {
        // Clicked empty space — cancel connection
        this.state.connectingFrom = null;
      }
      return;
    }

    if (this.state.mode === 'select') {
      const comp = this.findComponentAt(gridPos);
      if (comp) {
        this.state.draggingComponentId = comp.id;
      }
    }
  }

  private onPointerMove(e: FederatedPointerEvent): void {
    const pos = e.global;
    this.state.hoverGrid = this.grid.pixelToGrid(pos.x, pos.y);

    if (this.state.mode === 'select' && this.state.draggingComponentId) {
      const gridPos = this.grid.pixelToGrid(pos.x, pos.y);
      const occupied = this.engine
        .getState()
        .components.some(
          (c) =>
            c.id !== this.state.draggingComponentId &&
            c.position.col === gridPos.col &&
            c.position.row === gridPos.row,
        );
      if (!occupied) {
        this.engine.moveComponent(this.state.draggingComponentId, gridPos);
        this.onStateChange();
      }
    }
  }

  private onPointerUp(_e: FederatedPointerEvent): void {
    this.state.draggingComponentId = null;
  }

  private findComponentAt(gridPos: GridPosition) {
    return this.engine
      .getState()
      .components.find((c) => c.position.col === gridPos.col && c.position.row === gridPos.row);
  }
}
