import type { ReactNode } from 'react';
import { useMigrationGate } from './use-migration-gate';
import { MigrationTakeover } from './migration-takeover';

interface MigrationGateProps {
  children: ReactNode;
}

/**
 * Top-level gate. Wraps the app's provider stack. When legacy (V1/V2) CSV
 * data is detected in localStorage, renders the migration takeover INSTEAD
 * of `children` — so DataProvider, router, analytics, etc. never mount.
 *
 * Must sit outside every provider in __root.tsx for PRD F8 isolation.
 */
export function MigrationGate({ children }: MigrationGateProps) {
  const gate = useMigrationGate();

  if (gate.status === 'blocked') {
    return <MigrationTakeover onMigrationCommitted={gate.markMigrated} />;
  }

  return <>{children}</>;
}
