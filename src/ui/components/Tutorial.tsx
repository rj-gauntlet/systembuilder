import { useState } from 'react';

interface TutorialProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Welcome to SystemBuilder!',
    text: 'You\'ll design distributed system architectures by placing components on a canvas and wiring them together. Let\'s learn the basics.',
    highlight: null,
  },
  {
    title: 'The Toolbox',
    text: 'On the left is your toolbox. Click a component to select it, then click on the grid to place it. Start with a Client — it generates all user traffic.',
    highlight: 'toolbox',
  },
  {
    title: 'Placing Components',
    text: 'Click a component type in the toolbox, then click an empty grid cell to place it. Components snap to the grid. Place them left-to-right in the order traffic should flow.',
    highlight: 'canvas',
  },
  {
    title: 'Connecting Components',
    text: 'Click the "Connect" button, then click a port (dot) on one component and a port on another. A wire will connect them. Traffic flows left to right through your wires.',
    highlight: 'connect',
  },
  {
    title: 'Deleting',
    text: 'Right-click a component to delete it and all its connections. Right-click near a wire (on empty space) to delete just that connection.',
    highlight: null,
  },
  {
    title: 'Going Live',
    text: 'When your architecture is ready, click "Go Live". Traffic particles will flow through your system. Blue dots are requests, green dots are responses.',
    highlight: 'golive',
  },
  {
    title: 'Monitoring',
    text: 'Watch the HUD at the top of the canvas for uptime, latency, and budget. Each component shows its own stats. Health colors: green = healthy, yellow = strained, red = critical.',
    highlight: null,
  },
  {
    title: 'Events',
    text: 'During levels, events will stress your system — traffic spikes, server crashes, DDoS attacks. Design for resilience! Redundant servers and caches help you survive.',
    highlight: null,
  },
  {
    title: 'Scoring',
    text: 'After the simulation ends, you\'re scored on uptime, latency, cost efficiency, and survival. Earn up to 3 stars per level. Good luck!',
    highlight: null,
  },
];

export function Tutorial({ onComplete }: TutorialProps) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.progress}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.dot,
                background: i <= step ? '#3b82f6' : '#334155',
              }}
            />
          ))}
        </div>
        <h2 style={styles.title}>{current.title}</h2>
        <p style={styles.text}>{current.text}</p>
        <div style={styles.buttons}>
          {step > 0 && (
            <button style={styles.backButton} onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button
            style={styles.nextButton}
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setStep(step + 1);
              }
            }}
          >
            {isLast ? 'Start Playing' : 'Next'}
          </button>
        </div>
        <button style={styles.skipButton} onClick={onComplete}>
          Skip Tutorial
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  card: {
    maxWidth: 480,
    width: '90%',
    background: '#16162a',
    borderRadius: 16,
    padding: '32px 36px',
    border: '1px solid #334155',
    textAlign: 'center',
  },
  progress: {
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    transition: 'background 0.3s',
  },
  title: {
    margin: '0 0 10px',
    fontSize: 22,
    fontWeight: 800,
    color: '#e2e8f0',
  },
  text: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: '1.6',
    marginBottom: 24,
  },
  buttons: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  backButton: {
    padding: '10px 24px',
    border: '1px solid #334155',
    borderRadius: 8,
    background: 'transparent',
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  nextButton: {
    padding: '10px 32px',
    border: 'none',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  skipButton: {
    padding: '6px 16px',
    border: 'none',
    background: 'transparent',
    color: '#475569',
    fontSize: 12,
    cursor: 'pointer',
  },
};
