import { describe, it, expect } from 'vitest'
import { getTierStatsCellClassName, type CellStyleConfig } from './tier-stats-cell-styles'

describe('tier-stats-cell-styles', () => {
  describe('getTierStatsCellClassName', () => {
    const baseClasses = 'font-mono text-sm px-3 py-1.5 rounded-md cursor-help transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50'

    it('should return hourly rate styling when isHourlyRate is true', () => {
      const config: CellStyleConfig = {
        isHourlyRate: true,
        dataType: 'number'
      }

      const result = getTierStatsCellClassName(config)

      expect(result).toBe(
        `${baseClasses} bg-orange-500/10 border border-orange-500/30 text-orange-200 hover:bg-orange-500/20 hover:border-orange-500/40 hover:shadow-sm`
      )
    })

    it('should return duration styling for duration data type', () => {
      const config: CellStyleConfig = {
        isHourlyRate: false,
        dataType: 'duration'
      }

      const result = getTierStatsCellClassName(config)

      expect(result).toBe(`${baseClasses} bg-slate-700/40 border border-slate-600/40 text-slate-200 hover:bg-slate-700/60 hover:border-slate-600/60`)
    })

    it('should return default styling for number data type', () => {
      const config: CellStyleConfig = {
        isHourlyRate: false,
        dataType: 'number'
      }

      const result = getTierStatsCellClassName(config)

      expect(result).toBe(`${baseClasses} bg-slate-700/40 border border-slate-600/40 text-slate-200 hover:bg-slate-700/60 hover:border-slate-600/60`)
    })

    it('should return default styling for string data type', () => {
      const config: CellStyleConfig = {
        isHourlyRate: false,
        dataType: 'string'
      }

      const result = getTierStatsCellClassName(config)

      expect(result).toBe(`${baseClasses} bg-slate-700/40 border border-slate-600/40 text-slate-200 hover:bg-slate-700/60 hover:border-slate-600/60`)
    })

    it('should return default styling for date data type', () => {
      const config: CellStyleConfig = {
        isHourlyRate: false,
        dataType: 'date'
      }

      const result = getTierStatsCellClassName(config)

      expect(result).toBe(`${baseClasses} bg-slate-700/40 border border-slate-600/40 text-slate-200 hover:bg-slate-700/60 hover:border-slate-600/60`)
    })

    it('should prioritize hourly rate styling over duration styling', () => {
      const config: CellStyleConfig = {
        isHourlyRate: true,
        dataType: 'duration'
      }

      const result = getTierStatsCellClassName(config)

      expect(result).toBe(
        `${baseClasses} bg-orange-500/10 border border-orange-500/30 text-orange-200 hover:bg-orange-500/20 hover:border-orange-500/40 hover:shadow-sm`
      )
    })
  })
})
