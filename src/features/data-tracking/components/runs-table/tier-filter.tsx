import { SelectionButtonGroup, SelectionOption } from '../../../../components/ui';

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
    <div className="flex items-center gap-2 mb-4">
      <label className="text-sm text-muted-foreground">Filter by tier:</label>
      <SelectionButtonGroup<number | null>
        options={options}
        selectedValue={selectedTier}
        onSelectionChange={onTierChange}
        size="sm"
        fullWidthOnMobile={false}
      />
    </div>
  );
}