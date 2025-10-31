import { ReactNode } from 'react';
import { DataContext, useDataProvider } from '../hooks/use-data';
import { MigrationAlert } from '../../settings/data-settings/migration-alert';

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const dataContextValue = useDataProvider();

  return (
    <DataContext.Provider value={dataContextValue}>
      {children}
      {dataContextValue.migrationState && (
        <MigrationAlert
          migrated={dataContextValue.migrationState.migrated}
          fromVersion={dataContextValue.migrationState.fromVersion}
          toVersion={dataContextValue.migrationState.toVersion}
          error={dataContextValue.migrationState.error}
        />
      )}
    </DataContext.Provider>
  );
}