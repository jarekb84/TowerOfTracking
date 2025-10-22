import { ChevronDown, ChevronUp, RotateCcw, X } from 'lucide-react'
import type { UseTierStatsConfigReturn } from '../hooks/use-tier-stats-config'
import { getFieldDisplayName, canFieldHaveHourlyRate } from '../utils/tier-stats-config'
import { ToggleSwitch } from '../../../components/ui/toggle-switch'
import { AddItemButton } from '../../../components/ui/add-item-button'
import { Button } from '../../../components/ui/button'

interface TierStatsConfigPanelProps {
  config: UseTierStatsConfigReturn
}

export function TierStatsConfigPanel({ config }: TierStatsConfigPanelProps) {
  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={config.toggleConfigSection}
          className="gap-2 text-slate-300 hover:text-slate-100 transition-colors text-sm font-medium px-0 hover:bg-transparent h-auto min-h-0"
        >
          {config.configSectionCollapsed ? (
            <>
              <ChevronDown className="w-4 h-4" />
              Customize Table Columns
            </>
          ) : (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Configuration
            </>
          )}
        </Button>

        {!config.configSectionCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={config.resetToDefaults}
            className="gap-1.5 text-slate-400 hover:text-orange-400 transition-colors h-auto min-h-0 px-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </Button>
        )}
      </div>

      {/* Configuration Section */}
      {!config.configSectionCollapsed && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 space-y-8">
          {/* Selected Columns */}
          <div>
            <h4 className="text-sm font-semibold text-slate-100 mb-4">
              Selected Columns ({config.selectedColumns.length})
            </h4>

            {config.selectedColumns.length === 0 ? (
              <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4">
                <p className="text-sm text-slate-400 text-center">
                  No columns selected. Add columns below to customize your table.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {config.selectedColumns.map(column => {
                  const canHaveHourly = canFieldHaveHourlyRate(column.fieldName, config.availableFields)
                  const displayName = getFieldDisplayName(column.fieldName, config.availableFields)

                  return (
                    <div
                      key={column.fieldName}
                      className="flex items-center justify-between gap-4 bg-slate-700/30 border border-slate-600/40 rounded-lg px-4 py-3 group hover:border-slate-500/60 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm text-slate-200 font-medium truncate">{displayName}</span>
                        {column.showHourlyRate && (
                          <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30 whitespace-nowrap">
                            + /hour
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canHaveHourly && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Show /hour:</span>
                            <ToggleSwitch
                              checked={column.showHourlyRate}
                              onCheckedChange={() => config.toggleColumnHourlyRate(column.fieldName)}
                              aria-label={`Toggle hourly rate for ${displayName}`}
                            />
                          </div>
                        )}
                        <button
                          onClick={() => config.removeColumn(column.fieldName)}
                          className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10"
                          aria-label={`Remove ${displayName} column`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Add Column Section */}
          <div>
            <h4 className="text-sm font-semibold text-slate-100 mb-4">
              Add Column
            </h4>

            {config.unselectedFields.length === 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <p className="text-sm text-emerald-400 text-center font-medium">
                  All available columns are already selected
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {config.unselectedFields.map(field => (
                  <AddItemButton
                    key={field.fieldName}
                    onClick={() => config.addColumn(field.fieldName)}
                  >
                    {field.displayName}
                  </AddItemButton>
                ))}
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="pt-6 border-t border-slate-700/50">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-xs text-blue-300 leading-relaxed">
                <span className="font-semibold text-blue-200">Tip:</span> Column values show the maximum achieved for each tier.
                Hourly rates are calculated from the specific run that achieved the maximum value.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
