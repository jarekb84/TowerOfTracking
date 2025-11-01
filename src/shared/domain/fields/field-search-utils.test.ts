import { describe, it, expect } from 'vitest'
import { matchesSearchTerm, filterFieldsBySearch, normalizeSearchTerm } from './field-search-utils'
import type { AvailableField } from '@/features/analysis/tier-stats/types'

describe('field-search', () => {
  const createField = (fieldName: string, displayName: string): AvailableField => ({
    fieldName,
    displayName,
    dataType: 'number',
    isNumeric: true,
    canHaveHourlyRate: true
  })

  const mockFields: AvailableField[] = [
    createField('coinsEarned', 'Coins Earned'),
    createField('cellsEarned', 'Cells Earned'),
    createField('attackDamage', 'Attack Damage'),
    createField('attackSpeed', 'Attack Speed'),
    createField('criticalChance', 'Critical Chance'),
    createField('bossKills', 'Boss Kills')
  ]

  describe('normalizeSearchTerm', () => {
    it('should trim and lowercase search term', () => {
      expect(normalizeSearchTerm('  Coins  ')).toBe('coins')
      expect(normalizeSearchTerm('ATTACK')).toBe('attack')
      expect(normalizeSearchTerm('CeLLs')).toBe('cells')
    })

    it('should handle empty strings', () => {
      expect(normalizeSearchTerm('')).toBe('')
      expect(normalizeSearchTerm('   ')).toBe('')
    })
  })

  describe('matchesSearchTerm', () => {
    it('should return true for empty search term', () => {
      const field = mockFields[0]
      expect(matchesSearchTerm(field, '')).toBe(true)
      expect(matchesSearchTerm(field, '   ')).toBe(true)
    })

    it('should match display name (case-insensitive)', () => {
      const coinsField = mockFields[0]
      expect(matchesSearchTerm(coinsField, 'Coins')).toBe(true)
      expect(matchesSearchTerm(coinsField, 'coins')).toBe(true)
      expect(matchesSearchTerm(coinsField, 'COINS')).toBe(true)
      expect(matchesSearchTerm(coinsField, 'earned')).toBe(true)
    })

    it('should match field name (case-insensitive)', () => {
      const coinsField = mockFields[0]
      expect(matchesSearchTerm(coinsField, 'coinsEarned')).toBe(true)
      expect(matchesSearchTerm(coinsField, 'coinsearned')).toBe(true)
      expect(matchesSearchTerm(coinsField, 'COINSEARNED')).toBe(true)
    })

    it('should match partial strings', () => {
      const attackDmgField = mockFields[2]
      expect(matchesSearchTerm(attackDmgField, 'att')).toBe(true)
      expect(matchesSearchTerm(attackDmgField, 'dam')).toBe(true)
      expect(matchesSearchTerm(attackDmgField, 'age')).toBe(true)
    })

    it('should return false for non-matching terms', () => {
      const coinsField = mockFields[0]
      expect(matchesSearchTerm(coinsField, 'attack')).toBe(false)
      expect(matchesSearchTerm(coinsField, 'boss')).toBe(false)
      expect(matchesSearchTerm(coinsField, 'xyz')).toBe(false)
    })
  })

  describe('filterFieldsBySearch', () => {
    it('should return all fields for empty search term', () => {
      expect(filterFieldsBySearch(mockFields, '')).toEqual(mockFields)
      expect(filterFieldsBySearch(mockFields, '   ')).toEqual(mockFields)
    })

    it('should filter fields by display name', () => {
      const result = filterFieldsBySearch(mockFields, 'attack')
      expect(result).toHaveLength(2)
      expect(result[0].fieldName).toBe('attackDamage')
      expect(result[1].fieldName).toBe('attackSpeed')
    })

    it('should filter fields by field name', () => {
      const result = filterFieldsBySearch(mockFields, 'Earned')
      expect(result).toHaveLength(2)
      expect(result[0].fieldName).toBe('coinsEarned')
      expect(result[1].fieldName).toBe('cellsEarned')
    })

    it('should be case-insensitive', () => {
      const lowerResult = filterFieldsBySearch(mockFields, 'boss')
      const upperResult = filterFieldsBySearch(mockFields, 'BOSS')
      const mixedResult = filterFieldsBySearch(mockFields, 'BoSs')

      expect(lowerResult).toEqual(upperResult)
      expect(lowerResult).toEqual(mixedResult)
      expect(lowerResult).toHaveLength(1)
      expect(lowerResult[0].fieldName).toBe('bossKills')
    })

    it('should handle partial matches', () => {
      const result = filterFieldsBySearch(mockFields, 'crit')
      expect(result).toHaveLength(1)
      expect(result[0].fieldName).toBe('criticalChance')
    })

    it('should return empty array when no matches', () => {
      const result = filterFieldsBySearch(mockFields, 'nonexistent')
      expect(result).toEqual([])
    })

    it('should handle multiple word searches', () => {
      const result = filterFieldsBySearch(mockFields, 'attack damage')
      expect(result).toHaveLength(1)
      expect(result[0].fieldName).toBe('attackDamage')
    })

    it('should preserve original array when returning all', () => {
      const result = filterFieldsBySearch(mockFields, '')
      expect(result).toBe(mockFields)
    })
  })
})
