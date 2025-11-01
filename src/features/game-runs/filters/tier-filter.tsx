import { SelectionButtonGroup, SelectionOption } from '@/components/ui';

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

  const options: SelectionOption<number | null>[] = [
    { value: null, label: 'All' },
    ...availableTiers.map(tier => ({ value: tier, label: tier.toString() }))
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4" role="group" aria-labelledby="tier-filter-label">
      <span id="tier-filter-label" className="text-sm text-muted-foreground whitespace-nowrap">Filter by tier:</span>
      <SelectionButtonGroup<number | null>
        options={options}
        selectedValue={selectedTier}
        onSelectionChange={onTierChange}
        size="sm"
        fullWidthOnMobile={true}
      />
    </div>
  );
}