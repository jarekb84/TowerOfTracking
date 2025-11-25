import { TabsNavigation } from '../tabs-navigation/tabs-navigation'
import { CHART_TABS } from './chart-tabs-config'

/**
 * Chart analytics tab navigation using route-based navigation.
 * Renders tabs for switching between different chart views.
 */
export function ChartTabsNavigation() {
  return (
    <TabsNavigation
      tabs={CHART_TABS}
      ariaLabel="Chart analytics navigation"
      maxWidth="max-w-5xl"
      columns={7}
    />
  )
}
