import { Button } from '../../../components/ui'
import { RunTypeFilter, getRunTypeDisplayLabel } from '../utils/run-type-filter'
import { RunType } from '../types/game-run.types'

interface RunTypeSelectorProps {
  selectedType: RunTypeFilter
  onTypeChange: (type: RunTypeFilter) => void
  className?: string
}

const RUN_TYPE_OPTIONS: Array<{
  value: RunTypeFilter
  label: string
  color: string
}> = [
  { value: 'farming', label: getRunTypeDisplayLabel(RunType.FARM), color: '#10b981' },
  { value: 'tournament', label: getRunTypeDisplayLabel(RunType.TOURNAMENT), color: '#f59e0b' },
  { value: 'milestone', label: getRunTypeDisplayLabel(RunType.MILESTONE), color: '#8b5cf6' },
  { value: 'all', label: 'All Types', color: '#6b7280' },
]

export function RunTypeSelector({ selectedType, onTypeChange, className = '' }: RunTypeSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm text-slate-400 whitespace-nowrap">Run Type:</label>
      <div className="flex gap-1">
        {RUN_TYPE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={selectedType === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onTypeChange(option.value)}
            className={`border transition-all ${
              selectedType === option.value
                ? `text-slate-100` 
                : 'border-slate-600 text-slate-400 hover:bg-slate-700'
            }`}
            style={{
              backgroundColor: selectedType === option.value ? `${option.color}33` : undefined,
              borderColor: selectedType === option.value ? `${option.color}80` : undefined,
            }}
          >
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: option.color }}
            />
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}