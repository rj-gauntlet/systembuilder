import type { Container, FederatedPointerEvent } from 'pixi.js';
import type { GameEngine } from '../engine/GameEngine';
import type { ComponentType, GridPosition, PortPosition } from '../engine/types';
import { GridSystem } from './GridSystem';
import { findNearestPort } from './PortSystem';

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
  }

  private onPointerDown(e: FederatedPointerEvent): void {
    const pos = e.global;
    const gridPos = this.grid.pixelToGrid(pos.x, pos.y);

    if (this.state.mode === 'place' && this.state.placingType) {
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

    if (this.state.mode === 'connect') {
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
