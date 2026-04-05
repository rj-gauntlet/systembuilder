import { Graphics } from 'pixi.js';
import { GRID_CELL_SIZE, GRID_COLS, GRID_ROWS } from '../engine/componentDefs';
import type { GridPosition } from '../engine/types';

export class GridSystem {
  private graphics: Graphics;
  readonly cellSize = GRID_CELL_SIZE;
  readonly cols = GRID_COLS;
  readonly rows = GRID_ROWS;

  constructor() {
    this.graphics = new Graphics();
    this.draw();
  }

  get displayObject(): Graphics {
    return this.graphics;
  }

  get width(): number {
    return this.cols * this.cellSize;
  }

  get height(): number {
    return this.rows * this.cellSize;
  }

  private draw(): void {
    const g = this.graphics;
    g.clear();

    // Grid background
    g.rect(0, 0, this.width, this.height);
    g.fill({ color: 0x1a1a2e });

    // Grid lines
    for (let col = 0; col <= this.cols; col++) {
      const x = col * this.cellSize;
      g.moveTo(x, 0);
      g.lineTo(x, this.height);
    }
    for (let row = 0; row <= this.rows; row++) {
      const y = row * this.cellSize;
      g.moveTo(0, y);
      g.lineTo(this.width, y);
    }
    g.stroke({ color: 0x2a2a4a, width: 1, alpha: 0.5 });
  }

  /** Convert pixel position to grid position (snap) */
  pixelToGrid(px: number, py: number): GridPosition {
    return {
      col: Math.max(0, Math.min(this.cols - 1, Math.floor(px / this.cellSize))),
      row: Math.max(0, Math.min(this.rows - 1, Math.floor(py / this.cellSize))),
    };
  }

  /** Convert grid position to pixel center */
  gridToPixel(pos: GridPosition): { x: number; y: number } {
    return {
      x: pos.col * this.cellSize + this.cellSize / 2,
      y: pos.row * this.cellSize + this.cellSize / 2,
    };
  }

  /** Check if a grid cell is within bounds */
  isInBounds(pos: GridPosition): boolean {
    return pos.col >= 0 && pos.col < this.cols && pos.row >= 0 && pos.row < this.rows;
  }
}
