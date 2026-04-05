import { useEffect, useRef, useCallback } from 'react';
import { Application, Container } from 'pixi.js';
import type { GameEngine } from '../engine/GameEngine';
import type { ComponentType } from '../engine/types';
import { GridSystem } from './GridSystem';
import { ComponentSprite } from './ComponentSprite';
import { ConnectionLine } from './ConnectionLine';
import { InputHandler } from './InputHandler';

interface GameCanvasProps {
  engine: GameEngine;
  onStateChange: () => void;
}

export function GameCanvas({ engine, onStateChange }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const inputRef = useRef<InputHandler | null>(null);
  const spritesRef = useRef<Map<string, ComponentSprite>>(new Map());
  const linesRef = useRef<Map<string, ConnectionLine>>(new Map());
  const componentLayerRef = useRef<Container | null>(null);
  const connectionLayerRef = useRef<Container | null>(null);

  const syncVisuals = useCallback(() => {
    const state = engine.getState();
    const sprites = spritesRef.current;
    const lines = linesRef.current;
    const componentLayer = componentLayerRef.current;
    const connectionLayer = connectionLayerRef.current;
    if (!componentLayer || !connectionLayer) return;

    // Sync components
    const currentIds = new Set(state.components.map((c) => c.id));

    // Remove sprites for deleted components
    for (const [id, sprite] of sprites) {
      if (!currentIds.has(id)) {
        sprite.destroy();
        sprites.delete(id);
      }
    }

    // Add/update sprites
    for (const comp of state.components) {
      let sprite = sprites.get(comp.id);
      if (!sprite) {
        sprite = new ComponentSprite(comp);
        sprites.set(comp.id, sprite);
        componentLayer.addChild(sprite.container);
      } else {
        sprite.update(comp);
      }
    }

    // Sync connections
    const currentConnIds = new Set(state.connections.map((c) => c.id));

    for (const [id, line] of lines) {
      if (!currentConnIds.has(id)) {
        line.destroy();
        lines.delete(id);
      }
    }

    for (const conn of state.connections) {
      let line = lines.get(conn.id);
      if (!line) {
        line = new ConnectionLine(conn, state.components);
        lines.set(conn.id, line);
        connectionLayer.addChild(line.graphics);
      } else {
        line.update(conn, state.components);
      }
    }

    onStateChange();
  }, [engine, onStateChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new Application();
    let destroyed = false;

    const init = async () => {
      const grid = new GridSystem();

      await app.init({
        width: grid.width,
        height: grid.height,
        backgroundColor: 0x0f0f23,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (destroyed) {
        app.destroy();
        return;
      }

      containerRef.current!.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      // Layers
      const connectionLayer = new Container();
      const componentLayer = new Container();
      connectionLayerRef.current = connectionLayer;
      componentLayerRef.current = componentLayer;

      app.stage.addChild(grid.displayObject);
      app.stage.addChild(connectionLayer);
      app.stage.addChild(componentLayer);

      // Input handler
      const input = new InputHandler(grid, engine, spritesRef.current, syncVisuals);
      input.attachToStage(app.stage);
      inputRef.current = input;

      // Initial sync
      syncVisuals();
    };

    init();

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [engine, syncVisuals]);

  return <div ref={containerRef} style={{ border: '1px solid #333', borderRadius: 8 }} />;
}

// Expose input handler control via ref-like pattern
export function useCanvasInput() {
  const inputRef = useRef<InputHandler | null>(null);

  return {
    setRef: (handler: InputHandler | null) => {
      inputRef.current = handler;
    },
    setPlacingMode: (type: ComponentType) => inputRef.current?.setPlacingMode(type),
    setSelectMode: () => inputRef.current?.setSelectMode(),
    setConnectMode: () => inputRef.current?.setConnectMode(),
  };
}
