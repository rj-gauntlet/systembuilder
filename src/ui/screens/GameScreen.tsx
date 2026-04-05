import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { GameEngine } from '../../engine/GameEngine';
import { GameCanvas } from '../../renderer/GameCanvas';
import { Toolbox } from '../components/Toolbox';
import { ChatPanel } from '../components/ChatPanel';
import { HintToast } from '../components/HintToast';
import { OpenAIProvider } from '../../ai/OpenAIProvider';
import { HintEngine } from '../../hints/HintEngine';
import { ProgressStore } from '../../storage/ProgressStore';
import type { ComponentType, LevelDefinition, Score } from '../../engine/types';
import type { ActiveHint } from '../../hints/types';
import { InputHandler } from '../../renderer/InputHandler';

interface GameScreenProps {
  level?: LevelDefinition;
  onExit?: () => void;
  onComplete?: (score: Score) => void;
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
  const [showChat, setShowChat] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [chatPrefill, setChatPrefill] = useState<string | undefined>();
  const [activeHint, setActiveHint] = useState<ActiveHint | null>(null);

  const completedRef = useRef(false);

  // AI provider — reads user API key from settings
  const aiProvider = useMemo(() => {
    const store = new ProgressStore();
    return new OpenAIProvider({ apiKey: store.getProgress().settings.userApiKey });
  }, []);

  // Hint engine
  const hintEngine = useMemo(() => new HintEngine(), []);

  const triggerUpdate = useCallback(() => {
    forceUpdate((n) => n + 1);
    const state = engine.getState();
    if (state.simulation.status === 'complete' && onComplete && !completedRef.current) {
      completedRef.current = true;
      onComplete(state.score);
    }
  }, [engine, onComplete]);

  // Evaluate hints periodically during simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const state = engine.getState();
      if (state.simulation.status === 'running' || state.simulation.status === 'building') {
        const hint = hintEngine.evaluate(state);
        if (hint) setActiveHint(hint);
      }
    }, 3000); // check every 3 seconds
    return () => clearInterval(interval);
  }, [engine, hintEngine]);

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

  const handleAskAboutThis = useCallback((text: string) => {
    setChatPrefill(`The hint system suggested: "${text}" — can you explain why this matters for my architecture?`);
    setShowChat(true);
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
            <button
              style={styles.briefingButton}
              onClick={() => setShowBriefing(!showBriefing)}
            >
              {showBriefing ? 'Hide' : 'Objectives'}
            </button>
          )}
          <button
            style={{
              ...styles.briefingButton,
              ...(showChat ? { background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' } : {}),
            }}
            onClick={() => setShowChat(!showChat)}
          >
            AI Chat
          </button>
          {level && (
            <span style={styles.timer}>
              {simStatus === 'draining'
                ? 'Draining...'
                : `${Math.max(0, Math.round(level.simulationDuration - state.simulation.elapsedTime))}s`}
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
      {showBriefing && level && (
        <div style={styles.briefingPanel}>
          <div style={styles.briefingContent}>
            <strong>{level.briefing.system}</strong> — {level.briefing.description}
            <ul style={styles.objectiveList}>
              {level.briefing.objectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
            <span style={styles.briefingMeta}>
              Budget: ${level.briefing.monthlyBudget}/mo · Traffic: {level.briefing.expectedTraffic} · Duration: {level.simulationDuration}s
            </span>
          </div>
        </div>
      )}
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
        <div style={styles.canvasArea}>
          <div style={styles.canvasWrapper}>
            <GameCanvas
              engine={engine}
              onStateChange={triggerUpdate}
              inputHandlerRef={inputRef}
              level={level}
            />
          </div>
          <HintToast hint={activeHint} onAskAboutThis={handleAskAboutThis} />
        </div>
        {showChat && (
          <ChatPanel
            provider={aiProvider}
            gameState={state}
            prefill={chatPrefill}
            onClearPrefill={() => setChatPrefill(undefined)}
          />
        )}
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
  briefingButton: {
    padding: '6px 12px',
    border: '1px solid #334155',
    borderRadius: 6,
    background: '#1e293b',
    color: '#60a5fa',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 12,
  },
  briefingPanel: {
    background: '#16162a',
    borderBottom: '1px solid #333',
    padding: '10px 16px',
  },
  briefingContent: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: '1.5',
    maxWidth: 800,
  },
  objectiveList: {
    margin: '6px 0',
    paddingLeft: 20,
    fontSize: 12,
    color: '#cbd5e1',
  },
  briefingMeta: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  canvasArea: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  canvasWrapper: {
    position: 'relative',
  },
};
