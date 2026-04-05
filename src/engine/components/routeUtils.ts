import type { Connection } from '../types';
import type { SimulationContext } from '../SimulationLoop';

/**
 * Filter incoming connections to only those where the upstream (from) component is healthy.
 * Used when routing responses back upstream — don't send to failed components.
 */
export function getHealthyIncoming(
  componentId: string,
  ctx: SimulationContext,
): Connection[] {
  const inConns = ctx.getIncomingConnections(componentId);
  return inConns.filter((c) => {
    const from = ctx.state.components.find((comp) => comp.id === c.fromComponentId);
    return from && from.health !== 'failed';
  });
}
