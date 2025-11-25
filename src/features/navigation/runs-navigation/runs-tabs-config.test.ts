import { describe, it, expect } from 'vitest'
import { RUNS_TABS, getValidRunsRoutes } from './runs-tabs-config'
import { RunType } from '@/shared/domain/run-types/types'

describe('runs-tabs-config', () => {
  describe('RUNS_TABS', () => {
    it('should have 3 runs tabs', () => {
      expect(RUNS_TABS).toHaveLength(3)
    })

    it('should have all required properties for each tab', () => {
      RUNS_TABS.forEach(tab => {
        expect(tab).toHaveProperty('value')
        expect(tab).toHaveProperty('route')
        expect(tab).toHaveProperty('label')
        expect(tab).toHaveProperty('shortLabel')
        expect(tab).toHaveProperty('runType')
        expect(tab).toHaveProperty('activeClassName')
      })
    })

    it('should have unique values for each tab', () => {
      const values = RUNS_TABS.map(tab => tab.value)
      const uniqueValues = new Set(values)
      expect(uniqueValues.size).toBe(values.length)
    })

    it('should have unique routes for each tab', () => {
      const routes = RUNS_TABS.map(tab => tab.route)
      const uniqueRoutes = new Set(routes)
      expect(uniqueRoutes.size).toBe(routes.length)
    })

    it('should have routes starting with /runs/', () => {
      RUNS_TABS.forEach(tab => {
        expect(tab.route).toMatch(/^\/runs\//)
      })
    })

    it('should have all run types covered', () => {
      const runTypes = RUNS_TABS.map(tab => tab.runType)
      expect(runTypes).toContain(RunType.FARM)
      expect(runTypes).toContain(RunType.TOURNAMENT)
      expect(runTypes).toContain(RunType.MILESTONE)
    })
  })

  describe('getValidRunsRoutes', () => {
    it('should return all runs routes', () => {
      const routes = getValidRunsRoutes()
      expect(routes).toHaveLength(3)
    })

    it('should return routes matching RUNS_TABS', () => {
      const routes = getValidRunsRoutes()
      const expectedRoutes = RUNS_TABS.map(tab => tab.route)
      expect(routes).toEqual(expectedRoutes)
    })

    it('should include farm route', () => {
      const routes = getValidRunsRoutes()
      expect(routes).toContain('/runs/farm')
    })

    it('should include tournament route', () => {
      const routes = getValidRunsRoutes()
      expect(routes).toContain('/runs/tournament')
    })

    it('should include milestone route', () => {
      const routes = getValidRunsRoutes()
      expect(routes).toContain('/runs/milestone')
    })
  })
})
