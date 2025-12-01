import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@/components/ui';
import { Trash2, Database, AlertTriangle } from 'lucide-react';
import { useDataSettings } from './use-data-settings';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { SuccessAlert, ErrorAlert } from './data-settings-alerts';

export function DataSettings() {
  const {
    runsCount,
    isClearing,
    error,
    showSuccess,
    canClear,
    isConfirmationOpen,
    handleClearAllData,
    dismissError,
    dismissSuccess,
    openConfirmation,
    closeConfirmation,
  } = useDataSettings();

  return (
    <>
    <Card className="w-full max-w-sm min-w-80 sm:min-w-72 transition-shadow duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Database className="h-5 w-5 text-primary" />
          Data Management
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Manage your game run data and local storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 sm:space-y-6">
        {/* Stats Section */}
        <div className="rounded-lg bg-muted/30 border border-muted p-4 transition-all duration-200 hover:bg-muted/40 hover:border-primary/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Stored Game Runs</p>
              <p className="text-2xl sm:text-3xl font-semibold text-foreground tabular-nums">{runsCount}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-2 transition-colors duration-200 group-hover:bg-primary/20">
              <Database className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        {showSuccess && <SuccessAlert onDismiss={dismissSuccess} />}
        {error && <ErrorAlert error={error} onDismiss={dismissError} />}
        
        {/* Danger Zone */}
        <div className="rounded-lg border-2 border-dashed border-destructive/30 bg-destructive/5 p-4 space-y-4 transition-all duration-200 hover:border-destructive/40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will permanently delete all game runs from local storage. This action cannot be undone.
              </p>
            </div>
            
            <Button
              variant="destructive"
              onClick={openConfirmation}
              disabled={!canClear}
              className="w-full transition-all duration-200 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <DeleteConfirmationDialog
      isOpen={isConfirmationOpen}
      isDeleting={isClearing}
      runsCount={runsCount}
      onConfirm={handleClearAllData}
      onCancel={closeConfirmation}
    />
  </>
  );
}