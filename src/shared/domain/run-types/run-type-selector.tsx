import { FormControl, SelectionButtonGroup } from '@/components/ui'
import { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import { getOptionsForMode, RunTypeSelectorMode, RunTypeCounts } from '../run-types/run-type-selector-options'

interface RunTypeSelectorProps {
  selectedType: RunTypeFilter
  onTypeChange: (type: RunTypeFilter) => void
  className?: string
  mode?: RunTypeSelectorMode
  /** Optional counts per run type for display */
  counts?: RunTypeCounts
  /** Accent color theme. Defaults to 'orange'. */
  accentColor?: 'orange' | 'purple' | 'cyan'
  /** Label layout direction. Defaults to 'auto' (horizontal on desktop, vertical on mobile). */
  layout?: 'horizontal' | 'vertical' | 'auto'
}

export function RunTypeSelector({
  selectedType,
  onTypeChange,
  className = '',
  mode = 'filter',
  counts,
  accentColor = 'orange',
  layout = 'auto'
}: RunTypeSelectorProps) {
  const options = getOptionsForMode(mode, counts)
  const ariaLabel = mode === 'selection' ? 'Select run type for new game run' : 'Filter runs by type'

  return (
    <FormControl label="Run Type" className={className} layout={layout}>
      <SelectionButtonGroup<RunTypeFilter>
        options={options}
        selectedValue={selectedType}
        onSelectionChange={onTypeChange}
        size="sm"
        fullWidthOnMobile={false}
        ariaLabel={ariaLabel}
        accentColor={accentColor}
      />
    </FormControl>
  )
}
