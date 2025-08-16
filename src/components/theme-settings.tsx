import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTheme } from '../contexts/theme-context';

export function ThemeSettings() {
  const { theme, setTheme, toggleCondensed } = useTheme();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>
          Customize the appearance and spacing of the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-md">
        <div className="space-y-sm">
          <label className="text-sm font-medium">Display Mode</label>
          <Button
            variant={theme.mode === 'condensed' ? 'default' : 'outline'}
            onClick={toggleCondensed}
            className="w-full"
          >
            {theme.mode === 'condensed' ? 'Condensed' : 'Normal'}
          </Button>
        </div>
        
        <div className="space-y-sm">
          <label className="text-sm font-medium">Base Spacing (rem)</label>
          <Input
            type="number"
            min="0.1"
            max="1"
            step="0.05"
            value={theme.spacingBase}
            onChange={(e) => setTheme({ spacingBase: parseFloat(e.target.value) || 0.25 })}
          />
          <p className="text-xs text-muted-foreground">
            Controls the base unit for all spacing throughout the app
          </p>
        </div>
      </CardContent>
    </Card>
  );
}