import * as migration_20261124_164801_migration from './20261124_164801_migration';

export const migrations = [
  {
    up: migration_20261124_164801_migration.up,
    down: migration_20261124_164801_migration.down,
    name: '20261124_164801_migration'
  },
];
