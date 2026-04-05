import type { PlayerProgress } from './types';

type MigrationFn = (data: PlayerProgress) => PlayerProgress;

const migrations: Record<number, MigrationFn> = {
  // Example: version 1 → 2
  // 2: (data) => ({ ...data, newField: 'default', version: 2 }),
};

export function migrate(data: PlayerProgress, targetVersion: number): PlayerProgress {
  let current = { ...data };
  while (current.version < targetVersion) {
    const next = current.version + 1;
    const fn = migrations[next];
    if (!fn) {
      // No migration path — reset to defaults
      return { ...current, version: targetVersion };
    }
    current = fn(current);
  }
  return current;
}
