import { describe, it, expect } from 'vitest'
import { RunType } from './types'
import {
  getRunTypeColor,
  getRunTypeBackgroundColor,
  getRunTypeBorderColor
} from './run-type-display'

describe('run-type-display', () => {
  describe('getRunTypeColor', () => {
    it('returns green color for farm runs', () => {
      expect(getRunTypeColor(RunType.FARM)).toBe('#10b981')
    })

    it('returns amber color for tournament runs', () => {
      expect(getRunTypeColor(RunType.TOURNAMENT)).toBe('#f59e0b')
    })

    it('returns purple color for milestone runs', () => {
      expect(getRunTypeColor(RunType.MILESTONE)).toBe('#8b5cf6')
    })
  })

  describe('getRunTypeBackgroundColor', () => {
    it('returns farm color with 20 opacity', () => {
      expect(getRunTypeBackgroundColor(RunType.FARM)).toBe('#10b98120')
    })

    it('returns tournament color with 20 opacity', () => {
      expect(getRunTypeBackgroundColor(RunType.TOURNAMENT)).toBe('#f59e0b20')
    })

    it('returns milestone color with 20 opacity', () => {
      expect(getRunTypeBackgroundColor(RunType.MILESTONE)).toBe('#8b5cf620')
    })
  })

  describe('getRunTypeBorderColor', () => {
    it('returns farm color with 70 opacity', () => {
      expect(getRunTypeBorderColor(RunType.FARM)).toBe('#10b98170')
    })

    it('returns tournament color with 70 opacity', () => {
      expect(getRunTypeBorderColor(RunType.TOURNAMENT)).toBe('#f59e0b70')
    })

    it('returns milestone color with 70 opacity', () => {
      expect(getRunTypeBorderColor(RunType.MILESTONE)).toBe('#8b5cf670')
    })
  })
})
