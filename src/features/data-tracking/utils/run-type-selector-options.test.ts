import { describe, it, expect } from 'vitest'
import { getOptionsForMode } from './run-type-selector-options'
import { RunType } from '../types/game-run.types'

describe('getOptionsForMode', () => {
  it('should return all options including "all" in filter mode', () => {
    const options = getOptionsForMode('filter')

    expect(options).toHaveLength(4)
    expect(options.map(o => o.value)).toEqual([RunType.FARM, RunType.TOURNAMENT, RunType.MILESTONE, 'all'])
  })

  it('should exclude "all" option in selection mode', () => {
    const options = getOptionsForMode('selection')

    expect(options).toHaveLength(3)
    expect(options.map(o => o.value)).toEqual([RunType.FARM, RunType.TOURNAMENT, RunType.MILESTONE])
  })

  it('should return options with correct labels in filter mode', () => {
    const options = getOptionsForMode('filter')

    expect(options[0].label).toBe('Farm')
    expect(options[1].label).toBe('Tournament')
    expect(options[2].label).toBe('Milestone')
    expect(options[3].label).toBe('All Types')
  })

  it('should return options with correct labels in selection mode', () => {
    const options = getOptionsForMode('selection')

    expect(options[0].label).toBe('Farm')
    expect(options[1].label).toBe('Tournament')
    expect(options[2].label).toBe('Milestone')
  })

  it('should return options with correct colors', () => {
    const options = getOptionsForMode('selection')

    expect(options[0].color).toBe('#10b981') // farming - green
    expect(options[1].color).toBe('#f59e0b') // tournament - orange
    expect(options[2].color).toBe('#8b5cf6') // milestone - purple
  })

  it('should return options with icon property set to true', () => {
    const options = getOptionsForMode('selection')

    options.forEach(option => {
      expect(option.icon).toBe(true)
    })
  })
})
