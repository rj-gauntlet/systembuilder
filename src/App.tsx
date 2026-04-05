import { useState } from 'react';
import type { LevelDefinition, Score } from './engine/types';
import { LevelSelect } from './ui/screens/LevelSelect';
import { Briefing } from './ui/screens/Briefing';
import { GameScreen } from './ui/screens/GameScreen';
import { Debrief } from './ui/screens/Debrief';
import { ProgressStore } from './storage/ProgressStore';

type Screen =
  | { type: 'menu' }
  | { type: 'level-select' }
  | { type: 'briefing'; level: LevelDefinition }
  | { type: 'game'; level: LevelDefinition }
  | { type: 'game-sandbox' }
  | { type: 'debrief'; level: LevelDefinition; score: Score };

const store = new ProgressStore();

export default function App() {
  const [screen, setScreen] = useState<Screen>({ type: 'menu' });
  const [gameKey, setGameKey] = useState(0);

  function handleLevelComplete(level: LevelDefinition, score: Score) {
    store.saveLevelResult(level.id, score);

    // Check tier unlocks: need min 1 star on every beginner level to unlock intermediate
    const progress = store.getProgress();
    const beginnerLevels = ['url-shortener', 'paste-bin', 'chat-app'];
    const allBeginnerCleared = beginnerLevels.every(
      (id) => (progress.levels[id]?.bestStars ?? 0) >= 1,
    );
    if (allBeginnerCleared) {
      store.unlockTier('intermediate');
    }

    setScreen({ type: 'debrief', level, score });
  }

  if (screen.type === 'menu') {
    return (
      <div style={styles.menuContainer}>
        <h1 style={styles.menuTitle}>SystemBuilder</h1>
        <p style={styles.menuSubtitle}>SimCity for Distributed Systems</p>
        <div style={styles.menuButtons}>
          <button
            onClick={() => setScreen({ type: 'level-select' })}
            style={styles.primaryButton}
          >
            Play Levels
          </button>
          <button
            onClick={() => { setGameKey((k) => k + 1); setScreen({ type: 'game-sandbox' }); }}
            style={styles.secondaryButton}
          >
            Sandbox Mode
          </button>
        </div>
        <div style={styles.menuStars}>
          Total Stars: {store.getProgress().totalStars}
        </div>
      </div>
    );
  }

  if (screen.type === 'level-select') {
    return (
      <LevelSelect
        onSelectLevel={(level) => setScreen({ type: 'briefing', level })}
        onBack={() => setScreen({ type: 'menu' })}
      />
    );
  }

  if (screen.type === 'briefing') {
    return (
      <Briefing
        level={screen.level}
        onStart={() => {
          setGameKey((k) => k + 1);
          setScreen({ type: 'game', level: screen.level });
        }}
        onBack={() => setScreen({ type: 'level-select' })}
      />
    );
  }

  if (screen.type === 'game') {
    return (
      <GameScreen
        key={gameKey}
        level={screen.level}
        onExit={() => setScreen({ type: 'level-select' })}
        onComplete={(score) => handleLevelComplete(screen.level, score)}
      />
    );
  }

  if (screen.type === 'game-sandbox') {
    return (
      <GameScreen
        key={gameKey}
        onExit={() => setScreen({ type: 'menu' })}
      />
    );
  }

  if (screen.type === 'debrief') {
    return (
      <Debrief
        score={screen.score}
        level={screen.level}
        onRetry={() => {
          setGameKey((k) => k + 1);
          setScreen({ type: 'game', level: screen.level });
        }}
        onLevelSelect={() => setScreen({ type: 'level-select' })}
      />
    );
  }

  return null;
}

const styles: Record<string, React.CSSProperties> = {
  menuContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0f0f23',
    color: '#e2e8f0',
    gap: 16,
  },
  menuTitle: {
    fontSize: 56,
    fontWeight: 900,
    margin: 0,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  menuSubtitle: {
    fontSize: 18,
    color: '#64748b',
    margin: 0,
  },
  menuButtons: {
    display: 'flex',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    padding: '14px 36px',
    border: 'none',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '14px 36px',
    border: '1px solid #334155',
    borderRadius: 10,
    background: 'transparent',
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
  menuStars: {
    marginTop: 16,
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: 700,
  },
};
