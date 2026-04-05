import type { Score, LevelDefinition } from '../../engine/types';

interface DebriefProps {
  score: Score;
  level: LevelDefinition;
  onRetry: () => void;
  onLevelSelect: () => void;
}

export function Debrief({ score, level, onRetry, onLevelSelect }: DebriefProps) {
  const benchmark = level.optimalBenchmark;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Mission Complete</h1>
        <h2 style={styles.levelName}>{level.briefing.system}</h2>

        <div style={styles.starRow}>
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              style={{
                ...styles.star,
                color: s <= score.stars ? '#fbbf24' : '#334155',
                transform: s <= score.stars ? 'scale(1)' : 'scale(0.8)',
              }}
            >
              ★
            </span>
          ))}
        </div>

        <div style={styles.metricsGrid}>
          <MetricRow
            label="Uptime"
            value={`${score.uptime.toFixed(2)}%`}
            benchmark={`${benchmark.uptime}%`}
            good={score.uptime >= benchmark.uptime * 0.95}
          />
          <MetricRow
            label="Avg Latency"
            value={`${score.avgLatency.toFixed(2)}ms`}
            benchmark={`${benchmark.avgLatency}ms`}
            good={score.avgLatency <= benchmark.avgLatency * 1.5}
          />
          <MetricRow
            label="Cost Efficiency"
            value={`${score.costEfficiency.toFixed(2)}%`}
            benchmark="100%"
            good={score.costEfficiency <= 150}
          />
          <MetricRow
            label="Survived"
            value={score.survival ? 'Yes' : 'No'}
            benchmark="Yes"
            good={score.survival}
          />
        </div>

        <div style={styles.buttons}>
          <button onClick={onLevelSelect} style={styles.levelsButton}>Level Select</button>
          <button onClick={onRetry} style={styles.retryButton}>Retry</button>
        </div>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  benchmark,
  good,
}: {
  label: string;
  value: string;
  benchmark: string;
  good: boolean;
}) {
  return (
    <div style={styles.metricRow}>
      <span style={styles.metricLabel}>{label}</span>
      <span style={{ ...styles.metricValue, color: good ? '#22c55e' : '#ef4444' }}>
        {value}
      </span>
      <span style={styles.metricBenchmark}>optimal: {benchmark}</span>
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
    maxWidth: 500,
    width: '100%',
    background: '#16162a',
    borderRadius: 16,
    padding: 40,
    border: '1px solid #334155',
    textAlign: 'center',
  },
  title: {
    margin: '0 0 4px',
    fontSize: 16,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  levelName: {
    margin: '0 0 20px',
    fontSize: 28,
    fontWeight: 800,
  },
  starRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  star: {
    fontSize: 48,
    transition: 'all 0.3s',
  },
  metricsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 32,
    textAlign: 'left',
  },
  metricRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    background: '#1e293b',
    borderRadius: 8,
  },
  metricLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
    color: '#94a3b8',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'monospace',
    marginRight: 12,
  },
  metricBenchmark: {
    fontSize: 11,
    color: '#475569',
    fontFamily: 'monospace',
  },
  buttons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  levelsButton: {
    padding: '10px 24px',
    border: '1px solid #334155',
    borderRadius: 8,
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  retryButton: {
    padding: '10px 32px',
    border: 'none',
    borderRadius: 8,
    background: '#3b82f6',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
  },
};
