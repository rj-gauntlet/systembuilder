import type { LevelDefinition } from '../../engine/types';

interface BriefingProps {
  level: LevelDefinition;
  onStart: () => void;
  onBack: () => void;
}

export function Briefing({ level, onStart, onBack }: BriefingProps) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.tierBadge}>{level.tier}</div>
        <h1 style={styles.title}>{level.briefing.system}</h1>
        <p style={styles.description}>{level.briefing.description}</p>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Objectives</h3>
          <ul style={styles.objectiveList}>
            {level.briefing.objectives.map((obj, i) => (
              <li key={i} style={styles.objective}>{obj}</li>
            ))}
          </ul>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Budget</div>
            <div style={styles.statValue}>${level.briefing.monthlyBudget}/mo</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Expected Traffic</div>
            <div style={styles.statValue}>{level.briefing.expectedTraffic}</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Duration</div>
            <div style={styles.statValue}>{level.simulationDuration}s</div>
          </div>
        </div>

        <div style={styles.buttons}>
          <button onClick={onBack} style={styles.backButton}>Back</button>
          <button onClick={onStart} style={styles.startButton}>Start Building</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0f0f23',
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    maxWidth: 600,
    width: '100%',
    background: '#16162a',
    borderRadius: 16,
    padding: 40,
    border: '1px solid #334155',
  },
  tierBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 20,
    background: '#1e3a5f',
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 12,
  },
  title: {
    margin: '0 0 12px',
    fontSize: 32,
    fontWeight: 800,
  },
  description: {
    fontSize: 15,
    lineHeight: '1.6',
    color: '#94a3b8',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    margin: '0 0 8px',
    fontSize: 14,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  objectiveList: {
    margin: 0,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  objective: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: '1.4',
  },
  statsRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 32,
  },
  stat: {
    flex: 1,
    padding: 12,
    background: '#1e293b',
    borderRadius: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e2e8f0',
    fontFamily: 'monospace',
  },
  buttons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  backButton: {
    padding: '10px 24px',
    border: '1px solid #334155',
    borderRadius: 8,
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  startButton: {
    padding: '10px 32px',
    border: 'none',
    borderRadius: 8,
    background: '#22c55e',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
  },
};
