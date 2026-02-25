import { describe, it, expect } from 'vitest'
import { CHART_TABS, getValidChartRoutes } from './chart-tabs-config'

describe('chart-tabs-config', () => {
  describe('CHART_TABS', () => {
    it('should have 9 chart tabs', () => {
      expect(CHART_TABS).toHaveLength(9)
    })

    it('should have all required properties for each tab', () => {
      CHART_TABS.forEach(tab => {
        expect(tab).toHaveProperty('value')
        expect(tab).toHaveProperty('route')
        expect(tab).toHaveProperty('label')
        expect(tab).toHaveProperty('shortLabel')
        expect(tab).toHaveProperty('activeClassName')
      })
    })

    it('should have unique values for each tab', () => {
      const values = CHART_TABS.map(tab => tab.value)
      const uniqueValues = new Set(values)
      expect(uniqueValues.size).toBe(values.length)
    })

    it('should have unique routes for each tab', () => {
      const routes = CHART_TABS.map(tab => tab.route)
      const uniqueRoutes = new Set(routes)
      expect(uniqueRoutes.size).toBe(routes.length)
    })

    it('should have routes starting with /charts/', () => {
      CHART_TABS.forEach(tab => {
        expect(tab.route).toMatch(/^\/charts\//)
      })
    })
  })

  describe('getValidChartRoutes', () => {
    it('should return all chart routes', () => {
      const routes = getValidChartRoutes()
      expect(routes).toHaveLength(9)
    })

    it('should return routes matching CHART_TABS', () => {
      const routes = getValidChartRoutes()
      const expectedRoutes = CHART_TABS.map(tab => tab.route)
      expect(routes).toEqual(expectedRoutes)
    })

    it('should include coins route', () => {
      const routes = getValidChartRoutes()
      expect(routes).toContain('/charts/coins')
    })

    it('should include cells route', () => {
      const routes = getValidChartRoutes()
      expect(routes).toContain('/charts/cells')
    })

    it('should include tier-stats route', () => {
      const routes = getValidChartRoutes()
      expect(routes).toContain('/charts/tier-stats')
    })

    it('should include coverage route', () => {
      const routes = getValidChartRoutes()
      expect(routes).toContain('/charts/coverage')
    })

    it('should include activity route', () => {
      const routes = getValidChartRoutes()
      expect(routes).toContain('/charts/activity')
    })
  })
})
