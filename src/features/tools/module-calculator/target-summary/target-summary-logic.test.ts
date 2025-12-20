import { describe, it, expect } from 'vitest';
import type { SlotTarget } from '../types';
import {
  formatSlotSummary,
  formatRarityThreshold,
  generateTargetSummary,
  formatBannedEffects,
  countUnfilledSlots,
  getUnfilledSlots,
  isConfigurationComplete,
  validateTargets,
} from './target-summary-logic';

describe('target-summary-logic', () => {
  describe('formatRarityThreshold', () => {
    it('formats non-ancestral rarities with + suffix', () => {
      expect(formatRarityThreshold('common')).toBe('Common+');
      expect(formatRarityThreshold('legendary')).toBe('Legendary+');
    });

    it('formats ancestral without + suffix', () => {
      expect(formatRarityThreshold('ancestral')).toBe('Ancestral');
    });
  });

  describe('formatSlotSummary', () => {
    it('formats single effect target', () => {
      const target: SlotTarget = {
        slotNumber: 1,
        acceptableEffects: ['attackSpeed'],
        minRarity: 'legendary',
      };

      const summary = formatSlotSummary(target);
      expect(summary).toContain('Attack Speed');
      expect(summary).toContain('Legendary+');
    });

    it('formats multiple effects with OR', () => {
      const target: SlotTarget = {
        slotNumber: 1,
        acceptableEffects: ['attackSpeed', 'critChance'],
        minRarity: 'epic',
      };

      const summary = formatSlotSummary(target);
      expect(summary).toContain('OR');
      expect(summary).toContain('Epic+');
    });

    it('formats many effects with count', () => {
      const target: SlotTarget = {
        slotNumber: 1,
        acceptableEffects: ['attackSpeed', 'critChance', 'critFactor', 'attackRange'],
        minRarity: 'rare',
      };

      const summary = formatSlotSummary(target);
      expect(summary).toContain('4 effects');
    });
  });

  describe('generateTargetSummary', () => {
    it('generates summary for each target', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
        { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'epic' },
      ];

      const summaries = generateTargetSummary(targets);

      expect(summaries).toHaveLength(2);
      expect(summaries[0]).toContain('Slot 1');
      expect(summaries[1]).toContain('Slot 2');
    });
  });

  describe('formatBannedEffects', () => {
    it('returns "None" for empty list', () => {
      expect(formatBannedEffects([])).toBe('None');
    });

    it('formats banned effects as comma-separated', () => {
      const banned = ['attackSpeed', 'critChance'];
      const result = formatBannedEffects(banned);

      expect(result).toContain('Attack Speed');
      expect(result).toContain(',');
    });
  });

  describe('countUnfilledSlots', () => {
    it('counts slots without targets', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
        { slotNumber: 3, acceptableEffects: ['critChance'], minRarity: 'epic' },
      ];

      expect(countUnfilledSlots(targets, 5)).toBe(3);
    });

    it('returns 0 when all slots filled', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
        { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'epic' },
      ];

      expect(countUnfilledSlots(targets, 2)).toBe(0);
    });
  });

  describe('getUnfilledSlots', () => {
    it('returns unfilled slot numbers', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
        { slotNumber: 3, acceptableEffects: ['critChance'], minRarity: 'epic' },
      ];

      const unfilled = getUnfilledSlots(targets, 5);
      expect(unfilled).toEqual([2, 4, 5]);
    });
  });

  describe('isConfigurationComplete', () => {
    it('returns true when all slots have targets', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
        { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'epic' },
      ];

      expect(isConfigurationComplete(targets, 2)).toBe(true);
    });

    it('returns false when slots are missing', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
      ];

      expect(isConfigurationComplete(targets, 3)).toBe(false);
    });
  });

  describe('validateTargets', () => {
    it('returns invalid for no targets', () => {
      const result = validateTargets([], 5);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('No targets selected');
    });

    it('warns about unfilled slots', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
      ];

      const result = validateTargets(targets, 3);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes('without targets'))).toBe(true);
    });

    it('returns valid with no warnings when complete', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
        { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'epic' },
      ];

      const result = validateTargets(targets, 2);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
