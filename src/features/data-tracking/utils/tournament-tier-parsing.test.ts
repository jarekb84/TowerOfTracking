import { describe, it, expect } from 'vitest'
import { parseGameRun } from '@/features/analysis/shared/data-parser'
import { RunType } from '../types/game-run.types'

describe('Tournament Tier Parsing', () => {
  it('should correctly parse tournament tier "8+"', () => {
    // Create tab-delimited string format as expected by parseGameRun
    const tournamentData = [
      'Tier\t8+',
      'Wave\t871',
      'Real Time\t1h 50m 21s',
      'Coins Earned\t6.09B',
      'Cells Earned\t573',
      'Killed By\tRanged'
    ].join('\n')
    
    const result = parseGameRun(tournamentData, new Date())
    
    expect(result.tier).toBe(8)
    expect(result.runType).toBe(RunType.TOURNAMENT)
    expect(result.wave).toBe(871)
    expect(result.coinsEarned).toBeGreaterThan(0)
  })
  
  it('should correctly parse regular farming tier "5"', () => {
    const farmingData = [
      'Tier\t5',
      'Wave\t100',
      'Real Time\t1h 30m 0s',
      'Coins Earned\t1.5M',
      'Cells Earned\t200',
      'Killed By\tWall'
    ].join('\n')
    
    const result = parseGameRun(farmingData, new Date())
    
    expect(result.tier).toBe(5)
    expect(result.runType).toBe(RunType.FARM)
    expect(result.wave).toBe(100)
    expect(result.coinsEarned).toBeGreaterThan(0)
  })
  
  it('should handle edge cases for tier parsing', () => {
    const edgeCases = [
      { tier: '12+', expected: 12, expectedType: RunType.TOURNAMENT },
      { tier: '1', expected: 1, expectedType: RunType.FARM },
      { tier: '', expected: 0, expectedType: RunType.FARM },
    ]
    
    edgeCases.forEach(({ tier, expected, expectedType }) => {
      const data = [
        `Tier\t${tier}`,
        'Wave\t100',
        'Real Time\t1h 0m 0s',
        'Coins Earned\t1M',
        'Cells Earned\t100'
      ].join('\n')
      
      const result = parseGameRun(data, new Date())
      
      expect(result.tier).toBe(expected)
      expect(result.runType).toBe(expectedType)
    })
  })
})