import { Button } from '../../../../components/ui';

interface TierFilterProps {
  availableTiers: number[];
  selectedTier: number | null;
  onTierChange: (tier: number | null) => void;
  shouldShow?: boolean;
}

export function TierFilter({ availableTiers, selectedTier, onTierChange, shouldShow = true }: TierFilterProps) {
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <label className="text-sm text-muted-foreground">Filter by tier:</label>
      <div className="flex gap-1 flex-wrap">
        <Button
          variant={selectedTier === null ? "default" : "outline"}
          size="sm"
          onClick={() => onTierChange(null)}
          className={`border transition-all ${
            selectedTier === null
              ? 'bg-orange-500/20 border-orange-500/50 text-orange-100' 
              : 'border-slate-600 text-muted-foreground hover:bg-muted'
          }`}
        >
          All
        </Button>
        {availableTiers.map(tier => (
          <Button
            key={tier}
            variant={selectedTier === tier ? "default" : "outline"}
            size="sm"
            onClick={() => onTierChange(tier)}
            className={`border transition-all ${
              selectedTier === tier
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-100' 
                : 'border-slate-600 text-muted-foreground hover:bg-muted'
            }`}
          >
            {tier}
          </Button>
        ))}
      </div>
    </div>
  );
}