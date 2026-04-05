import type { ComponentType } from '../../engine/types';
import { COMPONENT_DEFS } from '../../engine/componentDefs';
import type { Budget } from '../../engine/types';

interface ToolboxProps {
  onSelectComponent: (type: ComponentType) => void;
  onSelectMode: () => void;
  onConnectMode: () => void;
  activeMode: 'select' | 'place' | 'connect';
  placingType: ComponentType | null;
  budget: Budget;
  disabled?: boolean;
}

const componentOrder: ComponentType[] = [
  'client',
  'server',
  'load-balancer',
  'database',
  'cache',
  'cdn',
  'message-queue',
  'rate-limiter',
];

export function Toolbox({
  onSelectComponent,
  onSelectMode,
  onConnectMode,
  activeMode,
  placingType,
  budget,
  disabled = false,
}: ToolboxProps) {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Toolbox</h3>

      <div style={styles.modeButtons}>
        <button
          onClick={onSelectMode}
          style={{
            ...styles.modeButton,
            ...(activeMode === 'select' ? styles.activeMode : {}),
          }}
          disabled={disabled}
        >
          Select
        </button>
        <button
          onClick={onConnectMode}
          style={{
            ...styles.modeButton,
            ...(activeMode === 'connect' ? styles.activeMode : {}),
          }}
          disabled={disabled}
        >
          Connect
        </button>
      </div>

      <div style={styles.budget}>
        <span style={styles.budgetLabel}>Budget</span>
        <span style={styles.budgetValue}>
          ${budget.remaining} / ${budget.monthlyLimit}
        </span>
      </div>

      <div style={styles.componentList}>
        {componentOrder.map((type) => {
          const def = COMPONENT_DEFS[type];
          const isActive = activeMode === 'place' && placingType === type;
          const canAfford = budget.remaining >= def.monthlyCost;

          return (
            <button
              key={type}
              onClick={() => onSelectComponent(type)}
              disabled={disabled || !canAfford}
              style={{
                ...styles.componentButton,
                ...(isActive ? styles.activeComponent : {}),
                ...(!canAfford ? styles.cantAfford : {}),
              }}
            >
              <span style={styles.componentName}>{def.name}</span>
              <span style={styles.componentCost}>
                {def.monthlyCost === 0 ? 'Free' : `$${def.monthlyCost}/mo`}
              </span>
              <span style={styles.componentDesc}>{def.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 220,
    background: '#16162a',
    borderRight: '1px solid #333',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    overflowY: 'auto',
    color: '#e2e8f0',
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  modeButtons: {
    display: 'flex',
    gap: 4,
  },
  modeButton: {
    flex: 1,
    padding: '6px 8px',
    border: '1px solid #334155',
    borderRadius: 6,
    background: '#1e293b',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  activeMode: {
    background: '#3b82f6',
    color: '#fff',
    borderColor: '#3b82f6',
  },
  budget: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    background: '#1e293b',
    borderRadius: 6,
    fontSize: 12,
  },
  budgetLabel: {
    color: '#64748b',
    fontWeight: 600,
  },
  budgetValue: {
    color: '#22c55e',
    fontWeight: 700,
    fontFamily: 'monospace',
  },
  componentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  componentButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    padding: '8px 10px',
    border: '1px solid #334155',
    borderRadius: 6,
    background: '#1e293b',
    color: '#e2e8f0',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  activeComponent: {
    background: '#1e3a5f',
    borderColor: '#3b82f6',
  },
  cantAfford: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  componentName: {
    fontWeight: 700,
    fontSize: 13,
  },
  componentCost: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  componentDesc: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: '1.3',
  },
};
