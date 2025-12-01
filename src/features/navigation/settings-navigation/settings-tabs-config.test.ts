import { describe, it, expect } from 'vitest'
import { SETTINGS_TABS, getValidSettingsRoutes } from './settings-tabs-config'

describe('settings-tabs-config', () => {
  describe('SETTINGS_TABS', () => {
    it('should have 4 settings tabs', () => {
      expect(SETTINGS_TABS).toHaveLength(4)
    })

    it('should have all required properties for each tab', () => {
      SETTINGS_TABS.forEach(tab => {
        expect(tab).toHaveProperty('value')
        expect(tab).toHaveProperty('route')
        expect(tab).toHaveProperty('label')
        expect(tab).toHaveProperty('shortLabel')
        expect(tab).toHaveProperty('activeClassName')
      })
    })

    it('should have unique values for each tab', () => {
      const values = SETTINGS_TABS.map(tab => tab.value)
      const uniqueValues = new Set(values)
      expect(uniqueValues.size).toBe(values.length)
    })

    it('should have unique routes for each tab', () => {
      const routes = SETTINGS_TABS.map(tab => tab.route)
      const uniqueRoutes = new Set(routes)
      expect(uniqueRoutes.size).toBe(routes.length)
    })

    it('should have routes starting with /settings/', () => {
      SETTINGS_TABS.forEach(tab => {
        expect(tab.route).toMatch(/^\/settings\//)
      })
    })
  })

  describe('getValidSettingsRoutes', () => {
    it('should return all settings routes', () => {
      const routes = getValidSettingsRoutes()
      expect(routes).toHaveLength(4)
    })

    it('should return routes matching SETTINGS_TABS', () => {
      const routes = getValidSettingsRoutes()
      const expectedRoutes = SETTINGS_TABS.map(tab => tab.route)
      expect(routes).toEqual(expectedRoutes)
    })

    it('should include import route', () => {
      const routes = getValidSettingsRoutes()
      expect(routes).toContain('/settings/import')
    })

    it('should include export route', () => {
      const routes = getValidSettingsRoutes()
      expect(routes).toContain('/settings/export')
    })

    it('should include locale route', () => {
      const routes = getValidSettingsRoutes()
      expect(routes).toContain('/settings/locale')
    })

    it('should include delete route', () => {
      const routes = getValidSettingsRoutes()
      expect(routes).toContain('/settings/delete')
    })
  })
})
