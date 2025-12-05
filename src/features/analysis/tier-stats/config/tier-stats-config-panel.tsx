import { ChevronDown, ChevronUp, RotateCcw, Settings } from 'lucide-react'
import type { UseTierStatsConfigReturn } from './use-tier-stats-config'
import type { TierStatsAggregation } from '../types'
import { getFieldDisplayName, canFieldHaveHourlyRate } from './tier-stats-config-utils'
import { useColumnSearch } from '@/features/settings/column-config/use-column-search'
import { useColumnReorder } from '@/features/settings/column-config/use-column-reorder'
import { SelectedColumnItem } from '@/features/settings/column-config/selected-column-item'
import { SearchableColumnPicker } from '@/features/settings/column-config/searchable-column-picker'
import { Button } from '@/components/ui/button'
import { InfoBox } from '@/components/ui/info-box'
import { EmptyState } from '@/components/ui/empty-state'
import { FormControl, SelectionButtonGroup } from '@/components/ui'
import { getAggregationOptions, getAggregationTooltip } from './tier-stats-aggregation-options'
import { FarmingOnlyIndicator } from '@/shared/domain/run-types/farming-only-indicator'

interface TierStatsConfigPanelProps {
  config: UseTierStatsConfigReturn
}

export function TierStatsConfigPanel({ config }: TierStatsConfigPanelProps) {
  // Search functionality
  const search = useColumnSearch(config.unselectedFields, 300)

  // Drag and drop functionality
  const dragDrop = useColumnReorder()

  // Handle column drop
  const handleDrop = () => {
    const reordered = dragDrop.handleDrop(config.selectedColumns)
    if (reordered !== config.selectedColumns && dragDrop.draggedIndex !== null && dragDrop.draggedOverIndex !== null) {
      config.reorderColumns(dragDrop.draggedIndex, dragDrop.draggedOverIndex)
    }
    dragDrop.handleDragEnd()
  }

  return (
    <div className="space-y-4">
      {/* Aggregation Selector - Always Visible */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <FormControl label="Aggregation Method" layout="vertical">
          <div className="flex flex-col gap-1.5">
            <SelectionButtonGroup<TierStatsAggregation>
              options={getAggregationOptions()}
              selectedValue={config.aggregationType}
              onSelectionChange={config.setAggregationType}
              size="sm"
              fullWidthOnMobile={false}
            />
            <p className="text-xs text-slate-400">
              {getAggregationTooltip(config.aggregationType)}
            </p>
          </div>
        </FormControl>
        <FarmingOnlyIndicator />
      </div>

      {/* Enhanced Toggle Button with Visual Prominence */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            onClick={config.toggleConfigSection}
            className="gap-2 text-orange-300 hover:text-orange-100 transition-colors text-sm font-semibold px-0 hover:bg-transparent h-auto min-h-0"
          >
            <Settings className="w-4 h-4 text-orange-400" />
            {config.configSectionCollapsed ? (
              <>
                <span>Customize Table Columns</span>
                <ChevronDown className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Hide Configuration</span>
                <ChevronUp className="w-4 h-4" />
              </>
            )}
          </Button>
          {config.configSectionCollapsed && (
            <div className="text-xs text-slate-400 pl-6">
              {config.selectedColumns.length} columns displayed • Click to customize
            </div>
          )}
        </div>

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
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Selected Columns with Drag & Drop */}
          <div>
            <h4 className="text-sm font-semibold text-slate-100 mb-4">
              Selected Columns ({config.selectedColumns.length})
              {config.selectedColumns.length > 0 && (
                <span className="text-xs font-normal text-slate-400 ml-2">(drag to reorder)</span>
              )}
            </h4>

            {config.selectedColumns.length === 0 ? (
              <EmptyState>
                No columns selected. Add columns below to customize your table.
              </EmptyState>
            ) : (
              <div className="space-y-3" role="list" aria-label="Selected columns">
                {config.selectedColumns.map((column, index) => {
                  const canHaveHourly = canFieldHaveHourlyRate(column.fieldName, config.availableFields)
                  const displayName = getFieldDisplayName(column.fieldName, config.availableFields)
                  const isDragging = dragDrop.draggedIndex === index
                  const isDraggedOver = dragDrop.draggedOverIndex === index

                  return (
                    <SelectedColumnItem
                      key={column.fieldName}
                      column={column}
                      index={index}
                      isDragging={isDragging}
                      isDraggedOver={isDraggedOver}
                      canHaveHourly={canHaveHourly}
                      displayName={displayName}
                      onDragStart={dragDrop.handleDragStart}
                      onDragEnter={dragDrop.handleDragEnter}
                      onDrop={handleDrop}
                      onDragEnd={dragDrop.handleDragEnd}
                      onToggleHourlyRate={config.toggleColumnHourlyRate}
                      onRemove={config.removeColumn}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Add Column Section with Search */}
          <div>
            <h4 className="text-sm font-semibold text-slate-100 mb-4">
              Add Column
            </h4>

            {config.unselectedFields.length === 0 ? (
              <InfoBox variant="success" icon={null}>
                <span className="font-medium">All available columns are already selected</span>
              </InfoBox>
            ) : (
              <SearchableColumnPicker
                search={search}
                onAddColumn={config.addColumn}
              />
            )}
          </div>

          {/* Help Text */}
          <div className="pt-6 border-t border-slate-700/50">
            <InfoBox variant="info" title="Tip">
              Column values reflect the selected aggregation method for each tier.
              Percentile aggregations help filter outliers for more representative performance data.
            </InfoBox>
          </div>
        </div>
      )}
    </div>
  )
}
