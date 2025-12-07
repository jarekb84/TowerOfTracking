import { ToggleSwitch } from '@/components/ui/toggle-switch';

interface AutoFixToggleProps {
  fixableCount: number;
  deriveEnabled: boolean;
  onDeriveToggle: (enabled: boolean) => void;
}

/**
 * Toggle control for enabling auto-fix from _date/_time fields.
 * Only shown when there are fixable rows.
 */
export function AutoFixToggle({
  fixableCount,
  deriveEnabled,
  onDeriveToggle,
}: AutoFixToggleProps) {
  const rowsPlural = fixableCount !== 1 ? 's' : '';

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 bg-card/60 rounded-lg border border-border/40 transition-colors hover:bg-card/70">
      <div className="min-w-0">
        <div className="font-medium text-sm text-foreground">
          Auto-fix dates from _Date/_Time fields
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {fixableCount} row{rowsPlural} can be fixed automatically
        </div>
      </div>
      <ToggleSwitch
        checked={deriveEnabled}
        onCheckedChange={onDeriveToggle}
        aria-label="Toggle auto-fix dates from _Date/_Time fields"
      />
    </div>
  );
}
