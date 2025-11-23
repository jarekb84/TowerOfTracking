import {
  TierSelector,
  nullToAllTierAdapter,
  allToNullTierAdapter
} from '@/shared/domain/filters';

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
    <TierSelector
      selectedTier={nullToAllTierAdapter(selectedTier)}
      onTierChange={(tier) => onTierChange(allToNullTierAdapter(tier))}
      availableTiers={availableTiers}
      showCounts={false}
    />
  );
}