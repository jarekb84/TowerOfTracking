import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Alert, AlertDescription } from '../../../components/ui';
import { CheckCircle, XCircle, Trash2, Database, AlertTriangle, X } from 'lucide-react';
import { useDataSettings } from '../hooks/use-data-settings';

export function DataSettings() {
  const {
    runsCount,
    isClearing,
    error,
    showSuccess,
    canClear,
    handleClearAllData,
    dismissError,
    dismissSuccess,
  } = useDataSettings();

  return (
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

        {/* Success Alert */}
        {showSuccess && (
          <Alert className="border-green-500/20 bg-green-500/5 transition-all duration-300 ease-in-out">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300 pr-6">
              Successfully cleared all data from local storage.
            </AlertDescription>
            <Button
              variant="ghost"
              size="compact"
              onClick={dismissSuccess}
              className="absolute right-2 top-2 h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-500/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-500/20 bg-red-500/5 transition-all duration-300 ease-in-out">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 dark:text-red-300 pr-6">
              {error}
            </AlertDescription>
            <Button
              variant="ghost"
              size="compact"
              onClick={dismissError}
              className="absolute right-2 top-2 h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-500/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        )}
        
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
              onClick={handleClearAllData}
              disabled={!canClear}
              className="w-full transition-all duration-200 disabled:opacity-60"
            >
              <Trash2 className={`h-4 w-4 transition-transform duration-200 ${isClearing ? 'animate-pulse' : ''}`} />
              {isClearing ? 'Clearing Data...' : 'Clear All Data'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}