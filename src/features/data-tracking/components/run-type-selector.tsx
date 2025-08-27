import { FormControl, SelectionButtonGroup, SelectionOption } from '../../../components/ui'
import { RunTypeFilter, getRunTypeDisplayLabel } from '../utils/run-type-filter'
import { RunType } from '../types/game-run.types'

interface RunTypeSelectorProps {
  selectedType: RunTypeFilter
  onTypeChange: (type: RunTypeFilter) => void
  className?: string
}

const RUN_TYPE_OPTIONS: Array<SelectionOption<RunTypeFilter>> = [
  { value: 'farming', label: getRunTypeDisplayLabel(RunType.FARM), color: '#10b981', icon: true },
  { value: 'tournament', label: getRunTypeDisplayLabel(RunType.TOURNAMENT), color: '#f59e0b', icon: true },
  { value: 'milestone', label: getRunTypeDisplayLabel(RunType.MILESTONE), color: '#8b5cf6', icon: true },
  { value: 'all', label: 'All Types', color: '#6b7280', icon: true },
] as const

export function RunTypeSelector({ selectedType, onTypeChange, className = '' }: RunTypeSelectorProps) {
  return (
    <FormControl label="Run Type" className={className}>
      <SelectionButtonGroup<RunTypeFilter>
        options={RUN_TYPE_OPTIONS}
        selectedValue={selectedType}
        onSelectionChange={onTypeChange}
        size="sm"
        fullWidthOnMobile={false}
      />
    </FormControl>
  )
}