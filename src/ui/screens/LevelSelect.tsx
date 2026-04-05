import { LevelLoader } from '../../engine/LevelLoader';
import { ProgressStore } from '../../storage/ProgressStore';
import type { LevelDefinition } from '../../engine/types';

interface LevelSelectProps {
  onSelectLevel: (level: LevelDefinition) => void;
  onBack: () => void;
}

const loader = new LevelLoader();

export function LevelSelect({ onSelectLevel, onBack }: LevelSelectProps) {
  const store = new ProgressStore();
  const progress = store.getProgress();
  const tiers = ['beginner', 'intermediate', 'advanced'] as const;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>Back</button>
        <h1 style={styles.title}>Select Level</h1>
        <div style={styles.totalStars}>
          Total Stars: {progress.totalStars}
        </div>
      </div>

      {tiers.map((tier) => {
        const levels = loader.getLevelsByTier(tier);
        if (levels.length === 0) return null;
        const unlocked = store.isTierUnlocked(tier);

        return (
          <div key={tier} style={styles.tierSection}>
            <h2 style={styles.tierTitle}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
              {!unlocked && <span style={styles.locked}> (Locked)</span>}
            </h2>
            <div style={styles.levelGrid}>
              {levels.map((level) => {
                const lp = progress.levels[level.id];
                const stars = lp?.bestStars ?? 0;

                return (
                  <button
                    key={level.id}
                    onClick={() => unlocked && onSelectLevel(level)}
                    disabled={!unlocked}
                    style={{
                      ...styles.levelCard,
                      ...(unlocked ? {} : styles.lockedCard),
                    }}
                  >
                    <div style={styles.levelName}>{level.name}</div>
                    <div style={styles.starRow}>
                      {[1, 2, 3].map((s) => (
                        <span
                          key={s}
                          style={{
                            ...styles.star,
                            color: s <= stars ? '#fbbf24' : '#334155',
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div style={styles.levelMeta}>
                      Budget: ${level.briefing.monthlyBudget}/mo
                    </div>
                    {lp && (
                      <div style={styles.levelMeta}>
                        Attempts: {lp.attempts}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0f0f23',
    color: '#e2e8f0',
    padding: 32,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  backButton: {
    padding: '8px 16px',
    border: '1px solid #334155',
    borderRadius: 6,
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 14,
  },
  title: {
    flex: 1,
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  totalStars: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fbbf24',
  },
  tierSection: {
    marginBottom: 32,
  },
  tierTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  locked: {
    fontSize: 14,
    color: '#475569',
    textTransform: 'none',
  },
  levelGrid: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  levelCard: {
    width: 200,
    padding: 20,
    border: '1px solid #334155',
    borderRadius: 12,
    background: '#1e293b',
    color: '#e2e8f0',
    cursor: 'pointer',
    textAlign: 'left' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    transition: 'border-color 0.2s',
  },
  lockedCard: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  levelName: {
    fontSize: 18,
    fontWeight: 700,
  },
  starRow: {
    display: 'flex',
    gap: 4,
  },
  star: {
    fontSize: 24,
  },
  levelMeta: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
};
