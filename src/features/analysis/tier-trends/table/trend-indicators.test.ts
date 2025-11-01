import { describe, it, expect } from 'vitest'
import { getTrendChangeColor, getTrendChangeIcon, getTrendSparklineColor } from './trend-indicators'
import type { FieldTrendData } from '@/features/data-tracking/types/game-run.types'

describe('trend-indicators', () => {
  describe('getTrendChangeColor', () => {
    it('should return emerald for upward trends', () => {
      const change: FieldTrendData['change'] = {
        direction: 'up',
        percent: 15.5,
        absolute: 1000
      }
      
      expect(getTrendChangeColor(change)).toBe('text-emerald-400')
    })

    it('should return red for downward trends', () => {
      const change: FieldTrendData['change'] = {
        direction: 'down',
        percent: -8.2,
        absolute: -500
      }
      
      expect(getTrendChangeColor(change)).toBe('text-red-400')
    })

    it('should return slate for stable trends', () => {
      const change: FieldTrendData['change'] = {
        direction: 'stable',
        percent: 0,
        absolute: 0
      }
      
      expect(getTrendChangeColor(change)).toBe('text-muted-foreground')
    })
  })

  describe('getTrendChangeIcon', () => {
    it('should return up arrow for upward direction', () => {
      expect(getTrendChangeIcon('up')).toBe('↗')
    })

    it('should return down arrow for downward direction', () => {
      expect(getTrendChangeIcon('down')).toBe('↘')
    })

    it('should return right arrow for stable direction', () => {
      expect(getTrendChangeIcon('stable')).toBe('→')
    })
  })

  describe('getTrendSparklineColor', () => {
    it('should return green hex for upward trends', () => {
      expect(getTrendSparklineColor('up')).toBe('#34d399')
    })

    it('should return red hex for downward trends', () => {
      expect(getTrendSparklineColor('down')).toBe('#f87171')
    })

    it('should return slate hex for stable trends', () => {
      expect(getTrendSparklineColor('stable')).toBe('#94a3b8')
    })
  })
})