import { useEffect, useState } from 'react';
import type { ActiveHint } from '../../hints/types';

interface HintToastProps {
  hint: ActiveHint | null;
  onAskAboutThis: (text: string) => void;
}

export function HintToast({ hint, onAskAboutThis }: HintToastProps) {
  const [visible, setVisible] = useState(false);
  const [currentHint, setCurrentHint] = useState<ActiveHint | null>(null);

  useEffect(() => {
    if (hint && hint !== currentHint) {
      setCurrentHint(hint);
      setVisible(true);

      const timer = setTimeout(() => setVisible(false), 12000);
      return () => clearTimeout(timer);
    }
  }, [hint, currentHint]);

  if (!visible || !currentHint) return null;

  return (
    <div style={styles.container}>
      <div style={styles.toast}>
        <div style={styles.icon}>💡</div>
        <div style={styles.content}>
          <div style={styles.text}>{currentHint.text}</div>
          <div style={styles.actions}>
            <button
              style={styles.askButton}
              onClick={() => {
                onAskAboutThis(currentHint.text);
                setVisible(false);
              }}
            >
              Ask about this
            </button>
            <button
              style={styles.dismissButton}
              onClick={() => setVisible(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    pointerEvents: 'auto',
  },
  toast: {
    display: 'flex',
    gap: 10,
    padding: '12px 16px',
    background: '#1e293b',
    border: '1px solid #fbbf24',
    borderRadius: 10,
    maxWidth: 450,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  icon: {
    fontSize: 20,
    flexShrink: 0,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  text: {
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: '1.5',
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  askButton: {
    padding: '4px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  dismissButton: {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid #334155',
    background: 'transparent',
    color: '#64748b',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
