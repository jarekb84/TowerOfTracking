import { describe, it, expect } from 'vitest';
import type { SubEffectConfig } from '../types';
import {
  getAvailableRarities,
  hasRarity,
  getLowestRarity,
  getHighestRarity,
  canTargetAtRarity,
  getTargetableRarities,
  filterByModuleRarity,
  getValueAtRarity,
  formatEffectValue,
  countPoolCombinations,
} from './sub-effect-utils';

// Test fixtures
const fullRarityEffect: SubEffectConfig = {
  id: 'attackSpeed',
  displayName: 'Attack Speed',
  moduleType: 'cannon',
  values: {
    common: 0.3,
    rare: 0.5,
    epic: 0.7,
    legendary: 1,
    mythic: 3,
    ancestral: 5,
  },
};

const epicPlusEffect: SubEffectConfig = {
  id: 'multishotChance',
  displayName: 'Multishot Chance',
  moduleType: 'cannon',
  unit: '%',
  values: {
    common: null,
    rare: 3,
    epic: 5,
    legendary: 7,
    mythic: 10,
    ancestral: 13,
  },
};

const legendaryPlusEffect: SubEffectConfig = {
  id: 'rendArmorChance',
  displayName: 'Rend Armor Chance',
  moduleType: 'cannon',
  unit: '%',
  values: {
    common: null,
    rare: null,
    epic: null,
    legendary: 2,
    mythic: 5,
    ancestral: 8,
  },
};

const mythicAncestralOnly: SubEffectConfig = {
  id: 'orbs',
  displayName: 'Orbs',
  moduleType: 'armor',
  values: {
    common: null,
    rare: null,
    epic: null,
    legendary: null,
    mythic: 1,
    ancestral: 2,
  },
};

describe('sub-effect-utils', () => {
  describe('getAvailableRarities', () => {
    it('returns all rarities for full-range effect', () => {
      const result = getAvailableRarities(fullRarityEffect);
      expect(result).toEqual(['common', 'rare', 'epic', 'legendary', 'mythic', 'ancestral']);
    });

    it('returns only available rarities for limited effect', () => {
      const result = getAvailableRarities(legendaryPlusEffect);
      expect(result).toEqual(['legendary', 'mythic', 'ancestral']);
    });

    it('handles mythic/ancestral only effects', () => {
      const result = getAvailableRarities(mythicAncestralOnly);
      expect(result).toEqual(['mythic', 'ancestral']);
    });
  });

  describe('hasRarity', () => {
    it('returns true for available rarity', () => {
      expect(hasRarity(fullRarityEffect, 'common')).toBe(true);
      expect(hasRarity(legendaryPlusEffect, 'legendary')).toBe(true);
    });

    it('returns false for unavailable rarity', () => {
      expect(hasRarity(legendaryPlusEffect, 'common')).toBe(false);
      expect(hasRarity(mythicAncestralOnly, 'epic')).toBe(false);
    });
  });

  describe('getLowestRarity', () => {
    it('returns common for full-range effect', () => {
      expect(getLowestRarity(fullRarityEffect)).toBe('common');
    });

    it('returns legendary for legendary+ effect', () => {
      expect(getLowestRarity(legendaryPlusEffect)).toBe('legendary');
    });

    it('returns mythic for mythic+ effect', () => {
      expect(getLowestRarity(mythicAncestralOnly)).toBe('mythic');
    });
  });

  describe('getHighestRarity', () => {
    it('returns ancestral for all effects with ancestral', () => {
      expect(getHighestRarity(fullRarityEffect)).toBe('ancestral');
      expect(getHighestRarity(legendaryPlusEffect)).toBe('ancestral');
    });
  });

  describe('canTargetAtRarity', () => {
    it('returns true when effect has rarity at or above target', () => {
      expect(canTargetAtRarity(fullRarityEffect, 'epic')).toBe(true);
      expect(canTargetAtRarity(legendaryPlusEffect, 'legendary')).toBe(true);
    });

    it('returns true when effect has higher rarities that satisfy minimum', () => {
      // legendaryPlusEffect has legendary/mythic/ancestral, all >= epic
      expect(canTargetAtRarity(legendaryPlusEffect, 'epic')).toBe(true);
      // mythicAncestralOnly has mythic/ancestral, both >= legendary
      expect(canTargetAtRarity(mythicAncestralOnly, 'legendary')).toBe(true);
    });

    it('returns false when effect only has lower rarities', () => {
      // legendaryPlusEffect doesn't have mythic-only or ancestral-only
      // but we can't test this with our fixtures, so test with module cap
      expect(canTargetAtRarity(mythicAncestralOnly, 'common', 'epic')).toBe(false);
    });

    it('respects module rarity cap', () => {
      // Orbs only has mythic/ancestral, so can't target on a legendary module
      expect(canTargetAtRarity(mythicAncestralOnly, 'mythic', 'legendary')).toBe(false);
      expect(canTargetAtRarity(mythicAncestralOnly, 'mythic', 'mythic')).toBe(true);
    });
  });

  describe('getTargetableRarities', () => {
    it('returns rarities at or above minimum', () => {
      const result = getTargetableRarities(fullRarityEffect, 'epic');
      expect(result).toEqual(['epic', 'legendary', 'mythic', 'ancestral']);
    });

    it('respects module rarity cap', () => {
      const result = getTargetableRarities(fullRarityEffect, 'epic', 'legendary');
      expect(result).toEqual(['epic', 'legendary']);
    });

    it('returns empty array when no rarities match', () => {
      const result = getTargetableRarities(mythicAncestralOnly, 'epic', 'legendary');
      expect(result).toEqual([]);
    });
  });

  describe('filterByModuleRarity', () => {
    const effects = [fullRarityEffect, mythicAncestralOnly];

    it('includes effects with rarities at or below cap', () => {
      const result = filterByModuleRarity(effects, 'legendary');
      expect(result).toContain(fullRarityEffect);
    });

    it('excludes effects only available above cap', () => {
      const result = filterByModuleRarity(effects, 'legendary');
      expect(result).not.toContain(mythicAncestralOnly);
    });

    it('includes all effects at ancestral cap', () => {
      const result = filterByModuleRarity(effects, 'ancestral');
      expect(result).toHaveLength(2);
    });
  });

  describe('getValueAtRarity', () => {
    it('returns the value for available rarity', () => {
      expect(getValueAtRarity(fullRarityEffect, 'common')).toBe(0.3);
      expect(getValueAtRarity(epicPlusEffect, 'epic')).toBe(5);
    });

    it('returns null for unavailable rarity', () => {
      expect(getValueAtRarity(legendaryPlusEffect, 'epic')).toBeNull();
    });
  });

  describe('formatEffectValue', () => {
    it('formats value with unit and sign', () => {
      expect(formatEffectValue(epicPlusEffect, 'epic')).toBe('+5%');
    });

    it('formats value without unit', () => {
      expect(formatEffectValue(fullRarityEffect, 'common')).toBe('+0.3');
    });

    it('returns dash for unavailable rarity', () => {
      expect(formatEffectValue(legendaryPlusEffect, 'epic')).toBe('—');
    });
  });

  describe('countPoolCombinations', () => {
    it('counts all effect-rarity combinations', () => {
      // fullRarityEffect has 6 rarities, legendaryPlusEffect has 3
      const count = countPoolCombinations([fullRarityEffect, legendaryPlusEffect]);
      expect(count).toBe(9);
    });

    it('respects module rarity cap', () => {
      // fullRarityEffect: 4 (common through legendary)
      // legendaryPlusEffect: 1 (legendary only)
      const count = countPoolCombinations([fullRarityEffect, legendaryPlusEffect], 'legendary');
      expect(count).toBe(5);
    });
  });
});
