import { useState } from 'react';
import { ProgressStore } from '../../storage/ProgressStore';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const store = new ProgressStore();
  const settings = store.getProgress().settings;

  const [apiKey, setApiKey] = useState(settings.userApiKey ?? '');
  const [hints, setHints] = useState(settings.hintsEnabled);
  const [sound, setSound] = useState(settings.soundEnabled);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    store.updateSettings({
      userApiKey: apiKey.trim() || undefined,
      hintsEnabled: hints,
      soundEnabled: sound,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('This will erase all progress, stars, and settings. Are you sure?')) {
      store.reset();
      setApiKey('');
      setHints(true);
      setSound(true);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Settings</h1>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>AI Chat</h3>
          <label style={styles.label}>
            OpenAI API Key (optional)
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              style={styles.input}
            />
          </label>
          <p style={styles.hint}>
            Provide your own key for unlimited chat. Without a key, chat uses the proxy server (50 msgs/day limit).
          </p>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Gameplay</h3>
          <label style={styles.toggle}>
            <input
              type="checkbox"
              checked={hints}
              onChange={(e) => setHints(e.target.checked)}
            />
            <span>Show hint toasts during gameplay</span>
          </label>
          <label style={styles.toggle}>
            <input
              type="checkbox"
              checked={sound}
              onChange={(e) => setSound(e.target.checked)}
            />
            <span>Sound effects (coming soon)</span>
          </label>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Data</h3>
          <button onClick={handleReset} style={styles.dangerButton}>
            Reset All Progress
          </button>
        </div>

        <div style={styles.buttons}>
          <button onClick={onBack} style={styles.backButton}>Back</button>
          <button onClick={handleSave} style={styles.saveButton}>
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
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
    maxWidth: 500,
    width: '100%',
    background: '#16162a',
    borderRadius: 16,
    padding: 40,
    border: '1px solid #334155',
  },
  title: {
    margin: '0 0 24px',
    fontSize: 28,
    fontWeight: 800,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    margin: '0 0 10px',
    fontSize: 14,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    color: '#94a3b8',
  },
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #334155',
    background: '#1e293b',
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: 'monospace',
    outline: 'none',
  },
  hint: {
    fontSize: 11,
    color: '#475569',
    marginTop: 6,
    lineHeight: '1.4',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 8,
    cursor: 'pointer',
  },
  dangerButton: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #7f1d1d',
    background: '#1c1917',
    color: '#f87171',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 32,
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
  saveButton: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: 8,
    background: '#3b82f6',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
  },
};
