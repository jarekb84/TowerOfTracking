import { describe, it, expect } from 'vitest';
import {
  compareRarities,
  isRarerThan,
  isAtLeastAsRare,
  getRaritiesAtOrAbove,
  getRaritiesAtOrBelow,
  getNextHigherRarity,
  getNextLowerRarity,
  getCumulativeProbability,
} from './rarity-utils';

describe('rarity-utils', () => {
  describe('compareRarities', () => {
    it('returns negative when first rarity is more common', () => {
      expect(compareRarities('common', 'rare')).toBeLessThan(0);
      expect(compareRarities('epic', 'legendary')).toBeLessThan(0);
    });

    it('returns positive when first rarity is less common', () => {
      expect(compareRarities('rare', 'common')).toBeGreaterThan(0);
      expect(compareRarities('ancestral', 'mythic')).toBeGreaterThan(0);
    });

    it('returns zero for equal rarities', () => {
      expect(compareRarities('epic', 'epic')).toBe(0);
      expect(compareRarities('ancestral', 'ancestral')).toBe(0);
    });
  });

  describe('isRarerThan', () => {
    it('returns true when first is rarer', () => {
      expect(isRarerThan('legendary', 'epic')).toBe(true);
      expect(isRarerThan('ancestral', 'common')).toBe(true);
    });

    it('returns false when first is not rarer', () => {
      expect(isRarerThan('common', 'rare')).toBe(false);
      expect(isRarerThan('epic', 'epic')).toBe(false);
    });
  });

  describe('isAtLeastAsRare', () => {
    it('returns true when first is rarer or equal', () => {
      expect(isAtLeastAsRare('legendary', 'epic')).toBe(true);
      expect(isAtLeastAsRare('epic', 'epic')).toBe(true);
    });

    it('returns false when first is more common', () => {
      expect(isAtLeastAsRare('common', 'rare')).toBe(false);
    });
  });

  describe('getRaritiesAtOrAbove', () => {
    it('returns all rarities at or above epic', () => {
      const result = getRaritiesAtOrAbove('epic');
      expect(result).toEqual(['epic', 'legendary', 'mythic', 'ancestral']);
    });

    it('returns only ancestral when given ancestral', () => {
      const result = getRaritiesAtOrAbove('ancestral');
      expect(result).toEqual(['ancestral']);
    });

    it('returns all rarities when given common', () => {
      const result = getRaritiesAtOrAbove('common');
      expect(result).toHaveLength(6);
    });
  });

  describe('getRaritiesAtOrBelow', () => {
    it('returns all rarities at or below epic', () => {
      const result = getRaritiesAtOrBelow('epic');
      expect(result).toEqual(['common', 'rare', 'epic']);
    });

    it('returns only common when given common', () => {
      const result = getRaritiesAtOrBelow('common');
      expect(result).toEqual(['common']);
    });
  });

  describe('getNextHigherRarity', () => {
    it('returns the next higher rarity', () => {
      expect(getNextHigherRarity('common')).toBe('rare');
      expect(getNextHigherRarity('epic')).toBe('legendary');
      expect(getNextHigherRarity('mythic')).toBe('ancestral');
    });

    it('returns null for ancestral', () => {
      expect(getNextHigherRarity('ancestral')).toBeNull();
    });
  });

  describe('getNextLowerRarity', () => {
    it('returns the next lower rarity', () => {
      expect(getNextLowerRarity('rare')).toBe('common');
      expect(getNextLowerRarity('legendary')).toBe('epic');
    });

    it('returns null for common', () => {
      expect(getNextLowerRarity('common')).toBeNull();
    });
  });

  describe('getCumulativeProbability', () => {
    it('returns approximately correct cumulative probability for epic+', () => {
      // Epic (10%) + Legendary (2.5%) + Mythic (1%) + Ancestral (0.3%) = 13.8%
      const result = getCumulativeProbability('epic');
      expect(result).toBeCloseTo(0.138, 3);
    });

    it('returns approximately 100% for common+', () => {
      const result = getCumulativeProbability('common');
      expect(result).toBeCloseTo(1, 3);
    });

    it('returns 0.3% for ancestral', () => {
      const result = getCumulativeProbability('ancestral');
      expect(result).toBeCloseTo(0.003, 4);
    });
  });
});
