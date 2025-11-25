import { useMemo } from 'react'
import { TabsNavigation, TabConfig } from '../tabs-navigation/tabs-navigation'
import { RUNS_TABS, RunsTabConfig } from './runs-tabs-config'
import { useData } from '@/shared/domain/use-data'
import { RunTypeIndicator } from '@/shared/domain/run-types/run-type-indicator'
import { computeRunCounts } from './run-counts-logic'

/**
 * Runs tab navigation using route-based navigation.
 * Renders tabs for switching between different run type views with run counts.
 */
export function RunsTabsNavigation() {
  const { runs } = useData()

  const runCounts = useMemo(() => computeRunCounts(runs), [runs])

  const renderTabContent = (tab: TabConfig) => {
    const runsTab = tab as RunsTabConfig
    const count = runCounts[runsTab.runType]

    return (
      <>
        <RunTypeIndicator runType={runsTab.runType} size="sm" />
        <span className="hidden sm:inline">{tab.label}</span>
        <span className="sm:hidden">{tab.shortLabel}</span>
        <span className="text-xs opacity-70">({count})</span>
      </>
    )
  }

  return (
    <TabsNavigation
      tabs={RUNS_TABS}
      ariaLabel="Run type navigation"
      maxWidth="max-w-xl"
      columns={3}
      renderTabContent={renderTabContent}
    />
  )
}
