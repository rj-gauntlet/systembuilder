import type { Component, Particle } from '../types';
import type { SimulationContext } from '../SimulationLoop';
import { processClient } from './ClientBehavior';
import { processServer } from './ServerBehavior';
import { processLoadBalancer } from './LoadBalancerBehavior';
import { processDatabase } from './DatabaseBehavior';
import { processCache } from './CacheBehavior';
import { processCDN } from './CDNBehavior';
import { processMessageQueue } from './MessageQueueBehavior';
import { processRateLimiter } from './RateLimiterBehavior';

type BehaviorFn = (component: Component, particle: Particle, ctx: SimulationContext) => void;

const behaviors: Record<string, BehaviorFn> = {
  client: processClient,
  server: processServer,
  'load-balancer': processLoadBalancer,
  database: processDatabase,
  cache: processCache,
  cdn: processCDN,
  'message-queue': processMessageQueue,
  'rate-limiter': processRateLimiter,
};

export function processBehavior(
  component: Component,
  particle: Particle,
  ctx: SimulationContext,
): void {
  const fn = behaviors[component.type];
  if (fn) fn(component, particle, ctx);
}
