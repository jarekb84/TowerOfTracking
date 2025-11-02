import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface MigrationAlertProps {
  migrated: boolean;
  fromVersion: number;
  toVersion: number;
  error?: Error | null;
}

/**
 * Displays a subtle, temporary notification when data migration occurs.
 *
 * Design Philosophy:
 * - Auto-dismisses after 8 seconds (users don't need to act)
 * - Success state is informative but not alarming
 * - Error state persists and provides actionable guidance
 * - Positioned to not block primary content
 */
export function MigrationAlert({ migrated, fromVersion, toVersion, error }: MigrationAlertProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show alert if migration occurred or error happened
    if (migrated || error) {
      setIsVisible(true);

      // Auto-dismiss success messages after 8 seconds
      if (migrated && !error) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 8000);

        return () => clearTimeout(timer);
      }
    }
  }, [migrated, error]);

  if (!isVisible) return null;

  // Error state - persists until user dismisses
  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
        <Alert variant="destructive" className="shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Data Migration Failed</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="text-sm">
              We encountered an issue updating your data structure. Your existing data is safe and unaffected.
            </p>
            <p className="text-xs text-muted-foreground">
              If this persists, try clearing your browser cache or contact support.
            </p>
            <button
              onClick={() => setIsVisible(false)}
              className="mt-2 text-xs underline hover:no-underline"
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Success state - auto-dismisses
  if (migrated) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
        <Alert variant="success" className="shadow-lg border-green-500/30 bg-green-950/30">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Data Updated</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm text-green-200">
              Your tracking data has been automatically updated to v{toVersion}. All {' '}
              {fromVersion === 1 ? 'internal fields now use consistent naming' : 'improvements applied'}.
            </p>
            <p className="text-xs text-green-300/60 mt-1">
              This message will disappear in a few seconds.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}
