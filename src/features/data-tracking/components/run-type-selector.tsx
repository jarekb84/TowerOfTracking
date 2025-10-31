import { FormControl, SelectionButtonGroup } from '../../../components/ui'
import { RunTypeFilter } from '@/features/analysis/shared/run-type-filter'
import { getOptionsForMode, RunTypeSelectorMode } from '../utils/run-type-selector-options'

interface RunTypeSelectorProps {
  selectedType: RunTypeFilter
  onTypeChange: (type: RunTypeFilter) => void
  className?: string
  mode?: RunTypeSelectorMode
}

export function RunTypeSelector({ selectedType, onTypeChange, className = '', mode = 'filter' }: RunTypeSelectorProps) {
  const options = getOptionsForMode(mode)
  const ariaLabel = mode === 'selection' ? 'Select run type for new game run' : 'Filter runs by type'

  return (
    <FormControl label="Run Type" className={className}>
      <SelectionButtonGroup<RunTypeFilter>
        options={options}
        selectedValue={selectedType}
        onSelectionChange={onTypeChange}
        size="sm"
        fullWidthOnMobile={false}
        ariaLabel={ariaLabel}
      />
    </FormControl>
  )
}