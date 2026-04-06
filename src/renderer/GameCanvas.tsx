import { useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import { Application, Container } from 'pixi.js';
import type { GameEngine } from '../engine/GameEngine';
import type { LevelDefinition } from '../engine/types';
import { SimulationLoop } from '../engine/SimulationLoop';
import { GridSystem } from './GridSystem';
import { ComponentSprite } from './ComponentSprite';
import { ConnectionLine } from './ConnectionLine';
import { ParticleRenderer } from './ParticleSystem';
import { StatOverlay } from './StatOverlay';
import { HUD } from './HUD';
import { InputHandler } from './InputHandler';

interface GameCanvasProps {
  engine: GameEngine;
  onStateChange: () => void;
  inputHandlerRef?: MutableRefObject<InputHandler | null>;
  simLoopRef?: MutableRefObject<SimulationLoop | null>;
  level?: LevelDefinition;
}

export function GameCanvas({ engine, onStateChange, inputHandlerRef, simLoopRef: simLoopRefProp, level }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const inputRef = useRef<InputHandler | null>(null);
  const spritesRef = useRef<Map<string, ComponentSprite>>(new Map());
  const linesRef = useRef<Map<string, ConnectionLine>>(new Map());
  const overlaysRef = useRef<Map<string, StatOverlay>>(new Map());
  const componentLayerRef = useRef<Container | null>(null);
  const connectionLayerRef = useRef<Container | null>(null);
  const particleLayerRef = useRef<Container | null>(null);
  const overlayLayerRef = useRef<Container | null>(null);
  const hudRef = useRef<HUD | null>(null);
  const particleRendererRef = useRef<ParticleRenderer | null>(null);
  const simLoopRef = useRef<SimulationLoop>(new SimulationLoop());

  const syncVisuals = useCallback(() => {
    const state = engine.getState();
    const sprites = spritesRef.current;
    const lines = linesRef.current;
    const overlays = overlaysRef.current;
    const componentLayer = componentLayerRef.current;
    const connectionLayer = connectionLayerRef.current;
    const overlayLayer = overlayLayerRef.current;
    if (!componentLayer || !connectionLayer || !overlayLayer) return;

    // Sync components
    const currentIds = new Set(state.components.map((c) => c.id));

    for (const [id, sprite] of sprites) {
      if (!currentIds.has(id)) {
        sprite.destroy();
        sprites.delete(id);
      }
    }
    for (const [id, overlay] of overlays) {
      if (!currentIds.has(id)) {
        overlay.destroy();
        overlays.delete(id);
      }
    }

    for (const comp of state.components) {
      // Sprites
      let sprite = sprites.get(comp.id);
      if (!sprite) {
        sprite = new ComponentSprite(comp);
        sprites.set(comp.id, sprite);
        componentLayer.addChild(sprite.container);
      } else {
        sprite.update(comp);
      }

      // Stat overlays (only show during simulation)
      if (state.simulation.status === 'running' || state.simulation.status === 'paused') {
        let overlay = overlays.get(comp.id);
        if (!overlay) {
          overlay = new StatOverlay();
          overlays.set(comp.id, overlay);
          overlayLayer.addChild(overlay.container);
        }
        overlay.update(comp);
      } else {
        const overlay = overlays.get(comp.id);
        if (overlay) overlay.hide();
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

    // Update particles
    if (particleRendererRef.current) {
      particleRendererRef.current.update(state.particles, state.connections, state.components);
    }

    // Update HUD
    if (hudRef.current) {
      hudRef.current.update(state);
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

      // Layers (bottom to top)
      const connectionLayer = new Container();
      const particleLayer = new Container();
      const componentLayer = new Container();
      const overlayLayer = new Container();
      connectionLayerRef.current = connectionLayer;
      particleLayerRef.current = particleLayer;
      componentLayerRef.current = componentLayer;
      overlayLayerRef.current = overlayLayer;

      app.stage.addChild(grid.displayObject);
      app.stage.addChild(connectionLayer);
      app.stage.addChild(particleLayer);
      app.stage.addChild(componentLayer);
      app.stage.addChild(overlayLayer);

      // Particle renderer
      const particleRenderer = new ParticleRenderer();
      particleRendererRef.current = particleRenderer;
      particleLayer.addChild(particleRenderer.graphics);

      // HUD
      const hud = new HUD(grid.width);
      hudRef.current = hud;
      app.stage.addChild(hud.container);

      // Input handler
      const input = new InputHandler(grid, engine, spritesRef.current, syncVisuals);
      input.attachToStage(app.stage);
      inputRef.current = input;
      if (inputHandlerRef) inputHandlerRef.current = input;
      if (simLoopRefProp) simLoopRefProp.current = simLoopRef.current;

      // Load level events if in level mode
      if (level) {
        simLoopRef.current.loadLevel(level, engine.getState());
      }

      // Game loop — runs every frame
      let lastTime = performance.now();
      app.ticker.add(() => {
        const now = performance.now();
        const delta = now - lastTime;
        lastTime = now;

        // Run simulation tick
        simLoopRef.current.tick(engine.getState(), delta);

        // Sync visuals every frame
        syncVisuals();
      });

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
  }, [engine, syncVisuals, inputHandlerRef, simLoopRefProp]);

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      style={{ border: '1px solid #333', borderRadius: 8 }}
    />
  );
}
