import { useState, useCallback, useRef, useMemo } from 'react';
import { GameEngine } from '../../engine/GameEngine';
import { GameCanvas } from '../../renderer/GameCanvas';
import { Toolbox } from '../components/Toolbox';
import type { ComponentType, LevelDefinition } from '../../engine/types';
import { InputHandler } from '../../renderer/InputHandler';

interface GameScreenProps {
  level?: LevelDefinition;
  onExit?: () => void;
  onComplete?: (score: import('../../engine/types').Score) => void;
}

export function GameScreen({ level, onExit, onComplete }: GameScreenProps) {
  const budgetLimit = level?.briefing.monthlyBudget ?? 500;
  const engine = useMemo(() => {
    const e = new GameEngine(budgetLimit);
    if (level) e.setLevelId(level.id);
    return e;
  }, [budgetLimit, level]);

  const [, forceUpdate] = useState(0);
  const inputRef = useRef<InputHandler | null>(null);
  const [activeMode, setActiveMode] = useState<'select' | 'place' | 'connect'>('select');
  const [placingType, setPlacingType] = useState<ComponentType | null>(null);

  const completedRef = useRef(false);

  const triggerUpdate = useCallback(() => {
    forceUpdate((n) => n + 1);
    // Check if simulation completed (level mode)
    const state = engine.getState();
    if (state.simulation.status === 'complete' && onComplete && !completedRef.current) {
      completedRef.current = true;
      onComplete(state.score);
    }
  }, [engine, onComplete]);

  const handleSelectComponent = useCallback(
    (type: ComponentType) => {
      setActiveMode('place');
      setPlacingType(type);
      inputRef.current?.setPlacingMode(type);
    },
    [],
  );

  const handleSelectMode = useCallback(() => {
    setActiveMode('select');
    setPlacingType(null);
    inputRef.current?.setSelectMode();
  }, []);

  const handleConnectMode = useCallback(() => {
    setActiveMode('connect');
    setPlacingType(null);
    inputRef.current?.setConnectMode();
  }, []);

  const state = engine.getState();
  const simStatus = state.simulation.status;
  const isEditable = simStatus === 'building' || simStatus === 'paused';

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h2 style={styles.title}>
          {level ? level.briefing.system : 'SystemBuilder — Sandbox'}
        </h2>
        <div style={styles.simControls}>
          {level && (
            <span style={styles.timer}>
              {Math.max(0, Math.round((level.simulationDuration) - state.simulation.elapsedTime))}s
            </span>
          )}
          {simStatus === 'building' && (
            <button style={styles.goLiveButton} onClick={() => { engine.startSimulation(); triggerUpdate(); }}>
              Go Live
            </button>
          )}
          {simStatus === 'running' && (
            <button style={styles.pauseButton} onClick={() => { engine.pauseSimulation(); triggerUpdate(); }}>
              Pause
            </button>
          )}
          {simStatus === 'paused' && (
            <button style={styles.goLiveButton} onClick={() => { engine.startSimulation(); triggerUpdate(); }}>
              Resume
            </button>
          )}
          {onExit && (
            <button style={styles.exitButton} onClick={onExit}>
              Exit
            </button>
          )}
        </div>
      </div>
      <div style={styles.main}>
        <Toolbox
          onSelectComponent={handleSelectComponent}
          onSelectMode={handleSelectMode}
          onConnectMode={handleConnectMode}
          activeMode={activeMode}
          placingType={placingType}
          budget={state.budget}
          disabled={!isEditable}
        />
        <div style={styles.canvasWrapper}>
          <GameCanvas
            engine={engine}
            onStateChange={triggerUpdate}
            inputHandlerRef={inputRef}
            level={level}
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0f0f23',
    color: '#e2e8f0',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#16162a',
    borderBottom: '1px solid #333',
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  simControls: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  timer: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 700,
    color: '#fbbf24',
    minWidth: 40,
    textAlign: 'right' as const,
  },
  goLiveButton: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: 6,
    background: '#22c55e',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 13,
  },
  pauseButton: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: 6,
    background: '#eab308',
    color: '#000',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 13,
  },
  exitButton: {
    padding: '6px 16px',
    border: '1px solid #334155',
    borderRadius: 6,
    background: 'transparent',
    color: '#94a3b8',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  canvasWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
};
