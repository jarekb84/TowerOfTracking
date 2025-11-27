import { TabsNavigation } from '../tabs-navigation/tabs-navigation'
import { SETTINGS_TABS } from './settings-tabs-config'

/**
 * Settings page tab navigation using route-based navigation.
 * Renders tabs for switching between import, export, locale, and delete sections.
 */
export function SettingsTabsNavigation() {
  return (
    <TabsNavigation
      tabs={SETTINGS_TABS}
      ariaLabel="Settings navigation"
      maxWidth="max-w-2xl"
      columns={4}
    />
  )
}
