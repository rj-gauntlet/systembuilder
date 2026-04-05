import { useState } from 'react';
import { GameScreen } from './ui/screens/GameScreen';
import type { GamePhase } from './engine/types';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('building');

  // Phase 1: Just show the game screen for sandbox building
  // Phase 3 will add: menu -> level-select -> briefing -> building -> running -> debrief
  if (phase === 'building') {
    return <GameScreen onExit={() => setPhase('menu')} />;
  }

  // Placeholder for main menu (Phase 5)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f23', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        SystemBuilder
      </h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>SimCity for Distributed Systems</p>
      <button
        onClick={() => setPhase('building')}
        style={{ padding: '12px 32px', border: 'none', borderRadius: 8, background: '#3b82f6', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
      >
        Start Building
      </button>
    </div>
  );
}
