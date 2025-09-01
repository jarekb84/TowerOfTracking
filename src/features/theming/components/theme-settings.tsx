import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from '../../../components/ui';
import { useTheme } from '../hooks/use-theme';

export function ThemeSettings() {
  const { theme, setTheme, toggleCondensed } = useTheme();

  return (
    <Card className="w-full max-w-sm min-w-80">
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>
          Customize the appearance and spacing of the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="display-mode-button" className="text-sm font-medium">Display Mode</label>
          <Button
            id="display-mode-button"
            variant={theme.mode === 'condensed' ? 'default' : 'outline'}
            onClick={toggleCondensed}
            className="w-full"
            aria-label={`Display mode: ${theme.mode === 'condensed' ? 'Condensed' : 'Normal'}`}
          >
            {theme.mode === 'condensed' ? 'Condensed' : 'Normal'}
          </Button>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="spacing-base-input" className="text-sm font-medium">Base Spacing (rem)</label>
          <Input
            id="spacing-base-input"
            type="number"
            min="0.1"
            max="1"
            step="0.05"
            value={theme.spacingBase}
            onChange={(e) => setTheme({ spacingBase: parseFloat(e.target.value) || 0.25 })}
            aria-describedby="spacing-base-description"
          />
          <p id="spacing-base-description" className="text-xs text-muted-foreground">
            Controls the base unit for all spacing throughout the app
          </p>
        </div>
        
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Version: {__BUILD_DATE__} {__GIT_HASH__}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}