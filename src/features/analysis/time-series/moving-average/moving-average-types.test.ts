import { describe, it, expect } from 'vitest'
import {
  getWindowSize,
  getTrendWindowOptions,
  getDefaultTrendWindow,
  isValidTrendWindowValue,
  isValidForPeriod,
  type TrendWindowValue,
} from './moving-average-types'

describe('moving-average-types', () => {
  describe('getWindowSize', () => {
    it('returns null for "none"', () => {
      expect(getWindowSize('none')).toBeNull()
    })

    it('returns numeric value for hourly options', () => {
      expect(getWindowSize('6h')).toBe(6)
      expect(getWindowSize('12h')).toBe(12)
      expect(getWindowSize('24h')).toBe(24)
      expect(getWindowSize('48h')).toBe(48)
    })

    it('returns numeric value for run options', () => {
      expect(getWindowSize('3r')).toBe(3)
      expect(getWindowSize('5r')).toBe(5)
      expect(getWindowSize('10r')).toBe(10)
    })

    it('returns numeric value for daily options', () => {
      expect(getWindowSize('3d')).toBe(3)
      expect(getWindowSize('7d')).toBe(7)
      expect(getWindowSize('14d')).toBe(14)
      expect(getWindowSize('21d')).toBe(21)
    })

    it('returns numeric value for weekly options', () => {
      expect(getWindowSize('2w')).toBe(2)
      expect(getWindowSize('3w')).toBe(3)
      expect(getWindowSize('4w')).toBe(4)
    })

    it('returns numeric value for monthly options', () => {
      expect(getWindowSize('2m')).toBe(2)
      expect(getWindowSize('3m')).toBe(3)
      expect(getWindowSize('4m')).toBe(4)
    })
  })

  describe('getTrendWindowOptions', () => {
    it('returns hourly options for hourly period', () => {
      const options = getTrendWindowOptions('hourly')
      expect(options).toHaveLength(5)
      expect(options[0]).toEqual({ value: 'none', label: 'No Trend' })
      expect(options[1]).toEqual({ value: '6h', label: '6 hours' })
      expect(options[4]).toEqual({ value: '48h', label: '48 hours' })
    })

    it('returns run options for run period', () => {
      const options = getTrendWindowOptions('run')
      expect(options).toHaveLength(4)
      expect(options[0]).toEqual({ value: 'none', label: 'No Trend' })
      expect(options[1]).toEqual({ value: '3r', label: '3 runs' })
      expect(options[3]).toEqual({ value: '10r', label: '10 runs' })
    })

    it('returns daily options for daily period', () => {
      const options = getTrendWindowOptions('daily')
      expect(options).toHaveLength(5)
      expect(options[0]).toEqual({ value: 'none', label: 'No Trend' })
      expect(options[1]).toEqual({ value: '3d', label: '3 days' })
      expect(options[2]).toEqual({ value: '7d', label: '7 days' })
    })

    it('returns weekly options for weekly period', () => {
      const options = getTrendWindowOptions('weekly')
      expect(options).toHaveLength(4)
      expect(options[0]).toEqual({ value: 'none', label: 'No Trend' })
      expect(options[1]).toEqual({ value: '2w', label: '2 weeks' })
      expect(options[2]).toEqual({ value: '3w', label: '3 weeks' })
    })

    it('returns monthly options for monthly period', () => {
      const options = getTrendWindowOptions('monthly')
      expect(options).toHaveLength(4)
      expect(options[0]).toEqual({ value: 'none', label: 'No Trend' })
      expect(options[1]).toEqual({ value: '2m', label: '2 months' })
      expect(options[2]).toEqual({ value: '3m', label: '3 months' })
    })

    it('returns only "none" for yearly period', () => {
      const options = getTrendWindowOptions('yearly')
      expect(options).toHaveLength(1)
      expect(options[0]).toEqual({ value: 'none', label: 'No Trend' })
    })
  })

  describe('getDefaultTrendWindow', () => {
    it('returns "none"', () => {
      expect(getDefaultTrendWindow()).toBe('none')
    })
  })

  describe('isValidTrendWindowValue', () => {
    it('returns true for "none"', () => {
      expect(isValidTrendWindowValue('none')).toBe(true)
    })

    it('returns true for valid hourly values', () => {
      expect(isValidTrendWindowValue('6h')).toBe(true)
      expect(isValidTrendWindowValue('12h')).toBe(true)
      expect(isValidTrendWindowValue('24h')).toBe(true)
      expect(isValidTrendWindowValue('48h')).toBe(true)
    })

    it('returns true for valid run values', () => {
      expect(isValidTrendWindowValue('3r')).toBe(true)
      expect(isValidTrendWindowValue('5r')).toBe(true)
      expect(isValidTrendWindowValue('10r')).toBe(true)
    })

    it('returns true for valid daily values', () => {
      expect(isValidTrendWindowValue('3d')).toBe(true)
      expect(isValidTrendWindowValue('7d')).toBe(true)
      expect(isValidTrendWindowValue('14d')).toBe(true)
      expect(isValidTrendWindowValue('21d')).toBe(true)
    })

    it('returns true for valid weekly values', () => {
      expect(isValidTrendWindowValue('2w')).toBe(true)
      expect(isValidTrendWindowValue('3w')).toBe(true)
      expect(isValidTrendWindowValue('4w')).toBe(true)
    })

    it('returns true for valid monthly values', () => {
      expect(isValidTrendWindowValue('2m')).toBe(true)
      expect(isValidTrendWindowValue('3m')).toBe(true)
      expect(isValidTrendWindowValue('4m')).toBe(true)
    })

    it('returns false for invalid values', () => {
      expect(isValidTrendWindowValue('invalid')).toBe(false)
      expect(isValidTrendWindowValue('5d')).toBe(false) // Not a valid option
      expect(isValidTrendWindowValue('100h')).toBe(false)
      expect(isValidTrendWindowValue(5)).toBe(false) // Number instead of string
      expect(isValidTrendWindowValue(null)).toBe(false)
      expect(isValidTrendWindowValue(undefined)).toBe(false)
    })
  })

  describe('isValidForPeriod', () => {
    it('returns true for "none" with any period', () => {
      expect(isValidForPeriod('none', 'hourly')).toBe(true)
      expect(isValidForPeriod('none', 'run')).toBe(true)
      expect(isValidForPeriod('none', 'daily')).toBe(true)
      expect(isValidForPeriod('none', 'weekly')).toBe(true)
      expect(isValidForPeriod('none', 'monthly')).toBe(true)
      expect(isValidForPeriod('none', 'yearly')).toBe(true)
    })

    it('returns true for hourly values with hourly period', () => {
      expect(isValidForPeriod('6h', 'hourly')).toBe(true)
      expect(isValidForPeriod('12h', 'hourly')).toBe(true)
      expect(isValidForPeriod('24h', 'hourly')).toBe(true)
    })

    it('returns false for hourly values with non-hourly period', () => {
      expect(isValidForPeriod('6h', 'daily')).toBe(false)
      expect(isValidForPeriod('12h', 'weekly')).toBe(false)
    })

    it('returns true for run values with run period', () => {
      expect(isValidForPeriod('3r', 'run')).toBe(true)
      expect(isValidForPeriod('5r', 'run')).toBe(true)
      expect(isValidForPeriod('10r', 'run')).toBe(true)
    })

    it('returns false for run values with non-run period', () => {
      expect(isValidForPeriod('3r', 'daily')).toBe(false)
      expect(isValidForPeriod('5r', 'hourly')).toBe(false)
    })

    it('returns true for daily values with daily period', () => {
      expect(isValidForPeriod('7d', 'daily')).toBe(true)
      expect(isValidForPeriod('14d', 'daily')).toBe(true)
    })

    it('returns false for daily values with non-daily period', () => {
      expect(isValidForPeriod('7d', 'weekly')).toBe(false)
      expect(isValidForPeriod('14d', 'monthly')).toBe(false)
    })

    it('returns true for weekly values with weekly period', () => {
      expect(isValidForPeriod('2w', 'weekly')).toBe(true)
      expect(isValidForPeriod('4w', 'weekly')).toBe(true)
    })

    it('returns true for monthly values with monthly period', () => {
      expect(isValidForPeriod('3m', 'monthly')).toBe(true)
      expect(isValidForPeriod('4m', 'monthly')).toBe(true)
    })

    it('returns false for all non-none values with yearly period', () => {
      const values: TrendWindowValue[] = ['7d', '2w', '3m', '10r', '12h']
      values.forEach((value) => {
        expect(isValidForPeriod(value, 'yearly')).toBe(false)
      })
    })
  })
})
