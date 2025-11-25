import { FormControl, Select } from '@/components/ui';
import * as Tooltip from '@radix-ui/react-tooltip';
import { TooltipContentWrapper } from '@/components/ui/tooltip-content';
import { HelpCircle } from 'lucide-react';
import type { RankValue } from '@/features/game-runs/editing/field-update-logic';

interface RankSelectorProps {
  value: RankValue;
  onChange: (value: RankValue) => void;
  className?: string;
  /** When true, shows "(optional)" hint */
  showOptionalHint?: boolean;
}

const RANK_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

/**
 * Dropdown selector for tournament placement rank (1-30)
 * Includes tooltip explaining where to find historical rank data in the game
 */
export function RankSelector({
  value,
  onChange,
  className,
  showOptionalHint = false,
}: RankSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === '') {
      onChange('');
    } else {
      onChange(parseInt(selectedValue, 10));
    }
  };

  return (
    <Tooltip.Provider delayDuration={400}>
      <FormControl label="Rank" className={className}>
        <div className="flex items-center gap-2">
          <Select
            value={value === '' ? '' : String(value)}
            onChange={handleChange}
            width="lg"
            aria-label="Select tournament rank"
          >
            <option value="">Select rank...</option>
            {RANK_OPTIONS.map((rank) => (
              <option key={rank} value={rank}>
                {rank}
              </option>
            ))}
          </Select>

          {showOptionalHint && (
            <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
              (optional)
            </span>
          )}

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                className="p-1 rounded text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent/10 transition-colors"
                aria-label="Where to find rank"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="top" sideOffset={8} className="z-50">
                <TooltipContentWrapper>
                  <p className="text-sm font-medium text-slate-100">
                    Where to find your rank:
                  </p>
                  <p className="text-sm mt-1.5 text-slate-300">
                    In The Tower, go to Tournament → Tournament History to view your past placements.
                  </p>
                </TooltipContentWrapper>
                <Tooltip.Arrow className="fill-slate-950" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </FormControl>
    </Tooltip.Provider>
  );
}
