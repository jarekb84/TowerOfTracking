import { describe, it, expect } from 'vitest'
import {
  getPercentChangeColorClass,
  formatPercentChangeDisplay,
} from './percent-change-display'

describe('getPercentChangeColorClass', () => {
  it('returns green for positive values', () => {
    expect(getPercentChangeColorClass(50)).toBe('text-green-400')
    expect(getPercentChangeColorClass(0.1)).toBe('text-green-400')
    expect(getPercentChangeColorClass(100)).toBe('text-green-400')
  })

  it('returns red for negative values', () => {
    expect(getPercentChangeColorClass(-50)).toBe('text-red-400')
    expect(getPercentChangeColorClass(-0.1)).toBe('text-red-400')
    expect(getPercentChangeColorClass(-100)).toBe('text-red-400')
  })

  it('returns neutral gray for zero', () => {
    expect(getPercentChangeColorClass(0)).toBe('text-slate-400')
  })
})

describe('formatPercentChangeDisplay', () => {
  describe('positive values', () => {
    it('adds plus prefix', () => {
      expect(formatPercentChangeDisplay(50)).toBe('+50.0%')
      expect(formatPercentChangeDisplay(100)).toBe('+100.0%')
    })

    it('handles small positive values', () => {
      expect(formatPercentChangeDisplay(0.1)).toBe('+0.1%')
      expect(formatPercentChangeDisplay(0.05)).toBe('+0.1%') // rounds to 1 decimal
    })
  })

  describe('negative values', () => {
    it('uses natural minus sign', () => {
      expect(formatPercentChangeDisplay(-50)).toBe('-50.0%')
      expect(formatPercentChangeDisplay(-100)).toBe('-100.0%')
    })

    it('handles small negative values', () => {
      expect(formatPercentChangeDisplay(-0.1)).toBe('-0.1%')
    })
  })

  describe('zero', () => {
    it('formats without sign prefix', () => {
      expect(formatPercentChangeDisplay(0)).toBe('0.0%')
    })
  })

  describe('precision', () => {
    it('rounds to one decimal place', () => {
      expect(formatPercentChangeDisplay(33.333)).toBe('+33.3%')
      expect(formatPercentChangeDisplay(33.355)).toBe('+33.4%')
      expect(formatPercentChangeDisplay(-66.666)).toBe('-66.7%')
    })

    it('handles large values', () => {
      expect(formatPercentChangeDisplay(1000)).toBe('+1000.0%')
      expect(formatPercentChangeDisplay(-500.5)).toBe('-500.5%')
    })
  })
})
