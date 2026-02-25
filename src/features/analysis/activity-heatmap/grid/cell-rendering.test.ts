import { describe, expect, it } from 'vitest'
import { CELL_BG_NORMAL, CELL_BG_ACTIVE, toPercent } from './cell-rendering'

describe('cell background constants', () => {
  it('exports CELL_BG_NORMAL as a hex color string', () => {
    expect(CELL_BG_NORMAL).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('exports CELL_BG_ACTIVE as a hex color string', () => {
    expect(CELL_BG_ACTIVE).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('CELL_BG_ACTIVE differs from CELL_BG_NORMAL', () => {
    expect(CELL_BG_ACTIVE).not.toBe(CELL_BG_NORMAL)
  })
})

describe('toPercent', () => {
  it('converts 0 fraction to 0%', () => {
    expect(toPercent(0)).toBe(0)
  })

  it('converts 1 fraction to 100%', () => {
    expect(toPercent(1)).toBe(100)
  })

  it('converts 0.5 fraction to 50%', () => {
    expect(toPercent(0.5)).toBe(50)
  })

  it('converts 0.25 fraction to 25%', () => {
    expect(toPercent(0.25)).toBe(25)
  })

  it('rounds to 2 decimal places', () => {
    // 0.333... * 10000 = 3333.33..., rounded = 3333, / 100 = 33.33
    expect(toPercent(1 / 3)).toBe(33.33)
  })

  it('handles small fractions correctly', () => {
    expect(toPercent(0.001)).toBe(0.1)
  })
})
