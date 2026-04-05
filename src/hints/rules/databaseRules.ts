import type { HintRule } from '../types';

export const databaseRules: HintRule[] = [
  {
    id: 'db-overloaded',
    condition: (s) => {
      return s.components.some((c) => c.type === 'database' && c.load > 0.8);
    },
    variants: [
      'Your database is critically loaded. What components can reduce the number of queries reaching it?',
      'The database is overwhelmed. Are all those queries necessary, or could some be answered from memory?',
      'Database at critical load — every request is hitting it directly. What could intercept repeated reads?',
      'Your database is the bottleneck. What two components are designed to reduce database read pressure?',
      'The database can\'t keep up. Consider what percentage of these queries are asking for the same data.',
      'Database overloaded — this is the most common scaling problem. What\'s the most common solution?',
      'Your database is at capacity. In a read-heavy system, what\'s the first thing you\'d add?',
      'The database is struggling. Caching and CDNs both reduce database load — have you considered either?',
    ],
    relatedComponentType: 'database',
    cooldownMs: 25000,
  },
  {
    id: 'no-database',
    condition: (s) => {
      const hasDB = s.components.some((c) => c.type === 'database');
      const hasServer = s.components.some((c) => c.type === 'server');
      return !hasDB && hasServer;
    },
    variants: [
      'Your servers have no database to store data in. Where does persistent data live?',
      'Servers need somewhere to read and write data. What component provides persistent storage?',
      'Without a database, where do your servers get the data they need to respond to requests?',
      'Your architecture has servers but no data store. What\'s missing?',
      'Servers process requests, but they need a source of truth for data. What component is that?',
      'No database in your architecture. Where would a URL shortener store its URL mappings?',
      'Your servers have nowhere to persist data. What happens when they restart?',
      'An architecture without a database — where does the actual data live?',
    ],
    relatedComponentType: 'database',
    cooldownMs: 20000,
  },
];
