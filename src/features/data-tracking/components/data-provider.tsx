import { ReactNode } from 'react';
import { DataContext, useDataProvider } from '../hooks/use-data';

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const dataContextValue = useDataProvider();

  return (
    <DataContext.Provider value={dataContextValue}>
      {children}
    </DataContext.Provider>
  );
}