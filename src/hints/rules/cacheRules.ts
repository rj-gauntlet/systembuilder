import type { HintRule } from '../types';

export const cacheRules: HintRule[] = [
  {
    id: 'no-cache-db-overloaded',
    condition: (s) => {
      const hasCache = s.components.some((c) => c.type === 'cache');
      const dbOverloaded = s.components.some((c) => c.type === 'database' && c.load > 0.6);
      return !hasCache && dbOverloaded;
    },
    variants: [
      'Your database is handling every read directly. What could sit between your server and database to intercept repeated queries?',
      'The database is under heavy load. Is every request truly unique, or could some responses be reused?',
      'What if frequently requested data was stored somewhere faster than the database?',
      'Your database is working hard. What component is designed to reduce repeated reads?',
      'If 70% of requests ask for the same data, does each one need to hit the database?',
      'The database is struggling. What sits in memory and serves repeated reads instantly?',
      'Most URL lookups return the same answer. Is there a way to remember recent answers?',
      'Your database load is high. What architectural pattern reduces read pressure on databases?',
    ],
    relatedComponentType: 'cache',
    cooldownMs: 30000,
  },
  {
    id: 'cache-low-hit-rate',
    condition: (s) => {
      const cache = s.components.find((c) => c.type === 'cache');
      return cache !== undefined && (cache.stats.hitRate ?? 0.7) < 0.4;
    },
    variants: [
      'Your cache hit rate is low. Is the cache positioned where it can intercept the most repeated requests?',
      'A cache works best when it sees the same requests repeatedly. Is yours in the right spot?',
      'Low cache hit rate often means the cache isn\'t seeing enough traffic. Check its connections.',
      'Your cache is missing more than it hits. What kind of requests does it see?',
      'The cache isn\'t being very effective. Is it connected between the right components?',
      'Cache effectiveness depends on traffic patterns. Is your cache seeing the repetitive traffic?',
      'A low hit rate might mean your cache is in the wrong position in the architecture.',
      'Your cache hit rate suggests it might not be intercepting the traffic it should be.',
    ],
    relatedComponentType: 'cache',
    cooldownMs: 25000,
  },
  {
    id: 'cache-no-downstream',
    condition: (s) => {
      const caches = s.components.filter((c) => c.type === 'cache');
      return caches.length > 0 && caches.some((cache) => {
        const outConns = s.connections.filter((c) => c.fromComponentId === cache.id);
        return outConns.length === 0;
      });
    },
    variants: [
      'Your cache has no downstream connection. Where should cache misses go?',
      'When the cache doesn\'t have the answer, what component should handle the request?',
      'Cache misses need somewhere to go. What\'s missing downstream of your cache?',
      'Your cache can serve hits, but misses have no path forward. Connect it to a data source.',
      'A cache without a downstream connection drops every miss. Where should misses route to?',
      'What happens to requests your cache can\'t answer? They need a path to the actual data.',
      'Your cache is a dead end for misses. What should it forward unanswered requests to?',
      'Cache misses are being lost. Connect the cache to the component that has the real data.',
    ],
    relatedComponentType: 'cache',
    cooldownMs: 20000,
  },
];
