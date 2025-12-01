import { useState, useCallback } from 'react';
import { useData } from '@/shared/domain/use-data';

export function useDataSettings() {
  const { runs, clearAllRuns } = useData();
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const openConfirmation = useCallback((): void => {
    setIsConfirmationOpen(true);
  }, []);

  const closeConfirmation = useCallback((): void => {
    setIsConfirmationOpen(false);
  }, []);

  const handleClearAllData = async (): Promise<void> => {
    setIsClearing(true);
    setError(null);

    try {
      clearAllRuns();
      setIsConfirmationOpen(false);
      setShowSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear data';
      setError(errorMessage);
    } finally {
      setIsClearing(false);
    }
  };

  const dismissError = (): void => {
    setError(null);
  };

  const dismissSuccess = (): void => {
    setShowSuccess(false);
  };

  return {
    // State
    runsCount: runs.length,
    isClearing,
    error,
    showSuccess,
    canClear: runs.length > 0 && !isClearing,
    isConfirmationOpen,

    // Actions
    handleClearAllData,
    dismissError,
    dismissSuccess,
    openConfirmation,
    closeConfirmation,
  };
}