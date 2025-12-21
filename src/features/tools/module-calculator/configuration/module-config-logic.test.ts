import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, EffectSelection } from '../types';
import {
  validateModuleLevel,
  isRollableModuleRarity,
  calculateSlotsForLevel,
  createDefaultConfig,
  updateModuleType,
  updateModuleLevel,
  updateModuleRarity,
  selectionsToSlotTargets,
  selectionsToBannedEffects,
  validateConfigForSimulation,
  ROLLABLE_MODULE_RARITIES,
} from './module-config-logic';

describe('module-config-logic', () => {
  describe('validateModuleLevel', () => {
    it('accepts valid levels', () => {
      expect(validateModuleLevel(1).isValid).toBe(true);
      expect(validateModuleLevel(100).isValid).toBe(true);
      expect(validateModuleLevel(300).isValid).toBe(true);
    });

    it('normalizes and accepts out-of-range levels', () => {
      // 0 and negative numbers get normalized to 1
      expect(validateModuleLevel(0).isValid).toBe(true);
      expect(validateModuleLevel(0).normalizedLevel).toBe(1);
      expect(validateModuleLevel(-5).isValid).toBe(true);
      expect(validateModuleLevel(-5).normalizedLevel).toBe(1);
    });

    it('rejects NaN', () => {
      expect(validateModuleLevel(NaN).isValid).toBe(false);
    });

    it('normalizes float levels to integers', () => {
      expect(validateModuleLevel(141.7).normalizedLevel).toBe(142);
      expect(validateModuleLevel(99.3).normalizedLevel).toBe(99);
    });

    it('normalizes low levels to minimum', () => {
      expect(validateModuleLevel(-10).normalizedLevel).toBe(1);
      expect(validateModuleLevel(0).normalizedLevel).toBe(1);
    });
  });

  describe('isRollableModuleRarity', () => {
    it('returns true for rare and above', () => {
      expect(isRollableModuleRarity('rare')).toBe(true);
      expect(isRollableModuleRarity('epic')).toBe(true);
      expect(isRollableModuleRarity('ancestral')).toBe(true);
    });

    it('returns false for common', () => {
      expect(isRollableModuleRarity('common')).toBe(false);
    });
  });

  describe('ROLLABLE_MODULE_RARITIES', () => {
    it('includes rare through ancestral', () => {
      expect(ROLLABLE_MODULE_RARITIES).toContain('rare');
      expect(ROLLABLE_MODULE_RARITIES).toContain('epic');
      expect(ROLLABLE_MODULE_RARITIES).toContain('legendary');
      expect(ROLLABLE_MODULE_RARITIES).toContain('mythic');
      expect(ROLLABLE_MODULE_RARITIES).toContain('ancestral');
    });

    it('excludes common', () => {
      expect(ROLLABLE_MODULE_RARITIES).not.toContain('common');
    });
  });

  describe('calculateSlotsForLevel', () => {
    it('returns correct slots for level ranges', () => {
      expect(calculateSlotsForLevel(1)).toBe(2);
      expect(calculateSlotsForLevel(50)).toBe(3);
      expect(calculateSlotsForLevel(141)).toBe(5);
      expect(calculateSlotsForLevel(250)).toBe(8);
    });
  });

  describe('createDefaultConfig', () => {
    it('creates config with cannon as default', () => {
      const config = createDefaultConfig();
      expect(config.moduleType).toBe('cannon');
      expect(config.moduleLevel).toBe(141);
      expect(config.moduleRarity).toBe('ancestral');
      expect(config.slotCount).toBe(5);
    });

    it('accepts custom module type', () => {
      const config = createDefaultConfig('armor');
      expect(config.moduleType).toBe('armor');
    });
  });

  describe('updateModuleType', () => {
    it('changes module type and clears selections', () => {
      const config: CalculatorConfig = {
        ...createDefaultConfig(),
        bannedEffects: ['attackSpeed'],
        slotTargets: [
          { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
        ],
      };

      const updated = updateModuleType(config, 'armor');

      expect(updated.moduleType).toBe('armor');
      expect(updated.bannedEffects).toEqual([]);
      expect(updated.slotTargets).toEqual([]);
    });
  });

  describe('updateModuleLevel', () => {
    it('updates level and slot count', () => {
      const config = createDefaultConfig();
      const updated = updateModuleLevel(config, 200);

      expect(updated.moduleLevel).toBe(200);
      expect(updated.slotCount).toBe(6);
    });

    it('removes targets for invalid slots when level decreases', () => {
      const config: CalculatorConfig = {
        ...createDefaultConfig(),
        moduleLevel: 250,
        slotCount: 8,
        slotTargets: [
          { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
          { slotNumber: 7, acceptableEffects: ['critChance'], minRarity: 'epic' },
          { slotNumber: 8, acceptableEffects: ['critFactor'], minRarity: 'rare' },
        ],
      };

      const updated = updateModuleLevel(config, 141); // 5 slots

      expect(updated.slotCount).toBe(5);
      expect(updated.slotTargets).toHaveLength(1);
      expect(updated.slotTargets[0].slotNumber).toBe(1);
    });
  });

  describe('updateModuleRarity', () => {
    it('updates rarity and caps target rarities', () => {
      const config: CalculatorConfig = {
        ...createDefaultConfig(),
        slotTargets: [
          { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'ancestral' },
          { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'mythic' },
        ],
      };

      const updated = updateModuleRarity(config, 'legendary');

      expect(updated.moduleRarity).toBe('legendary');
      // Ancestral and Mythic should be capped to legendary
      expect(updated.slotTargets[0].minRarity).toBe('legendary');
      expect(updated.slotTargets[1].minRarity).toBe('legendary');
    });

    it('preserves lower rarities unchanged', () => {
      const config: CalculatorConfig = {
        ...createDefaultConfig(),
        slotTargets: [
          { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'epic' },
        ],
      };

      const updated = updateModuleRarity(config, 'legendary');

      expect(updated.slotTargets[0].minRarity).toBe('epic');
    });
  });

  describe('selectionsToSlotTargets', () => {
    it('converts selections to slot targets', () => {
      const selections: EffectSelection[] = [
        { effectId: 'attackSpeed', minRarity: 'legendary', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
        { effectId: 'critChance', minRarity: 'epic', targetSlots: [2], isBanned: false, isLocked: false, lockedRarity: null },
      ];

      const targets = selectionsToSlotTargets(selections);

      expect(targets).toHaveLength(2);
      expect(targets[0].slotNumber).toBe(1);
      expect(targets[0].acceptableEffects).toContain('attackSpeed');
      expect(targets[1].slotNumber).toBe(2);
    });

    it('creates one slot per effect when same priority, with shared acceptable effects', () => {
      const selections: EffectSelection[] = [
        { effectId: 'attackSpeed', minRarity: 'legendary', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
        { effectId: 'critChance', minRarity: 'epic', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
      ];

      const targets = selectionsToSlotTargets(selections);

      // Two effects = two slots, both accepting either effect
      expect(targets).toHaveLength(2);
      expect(targets[0].slotNumber).toBe(1);
      expect(targets[1].slotNumber).toBe(2);
      // Both slots share the same acceptable effects pool
      expect(targets[0].acceptableEffects).toContain('attackSpeed');
      expect(targets[0].acceptableEffects).toContain('critChance');
      expect(targets[1].acceptableEffects).toContain('attackSpeed');
      expect(targets[1].acceptableEffects).toContain('critChance');
      // Should use the lowest min rarity
      expect(targets[0].minRarity).toBe('epic');
      expect(targets[1].minRarity).toBe('epic');
    });

    it('creates sequential slots across priority groups', () => {
      const selections: EffectSelection[] = [
        { effectId: 'attackSpeed', minRarity: 'legendary', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
        { effectId: 'critChance', minRarity: 'legendary', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
        { effectId: 'critFactor', minRarity: 'ancestral', targetSlots: [2], isBanned: false, isLocked: false, lockedRarity: null },
      ];

      const targets = selectionsToSlotTargets(selections);

      // Priority 1 has 2 effects, priority 2 has 1 = 3 total slots
      expect(targets).toHaveLength(3);
      expect(targets[0].slotNumber).toBe(1);
      expect(targets[1].slotNumber).toBe(2);
      expect(targets[2].slotNumber).toBe(3);

      // Slots 1-2 share priority group effects
      expect(targets[0].acceptableEffects).toEqual(['attackSpeed', 'critChance']);
      expect(targets[1].acceptableEffects).toEqual(['attackSpeed', 'critChance']);
      // Slot 3 only has the priority 2 effect
      expect(targets[2].acceptableEffects).toEqual(['critFactor']);
    });

    it('ignores banned selections', () => {
      const selections: EffectSelection[] = [
        { effectId: 'attackSpeed', minRarity: 'legendary', targetSlots: [1], isBanned: true, isLocked: false, lockedRarity: null },
      ];

      const targets = selectionsToSlotTargets(selections);
      expect(targets).toHaveLength(0);
    });

    it('ignores selections without min rarity', () => {
      const selections: EffectSelection[] = [
        { effectId: 'attackSpeed', minRarity: null, targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
      ];

      const targets = selectionsToSlotTargets(selections);
      expect(targets).toHaveLength(0);
    });
  });

  describe('selectionsToBannedEffects', () => {
    it('extracts banned effect IDs', () => {
      const selections: EffectSelection[] = [
        { effectId: 'attackSpeed', minRarity: null, targetSlots: [], isBanned: true, isLocked: false, lockedRarity: null },
        { effectId: 'critChance', minRarity: 'epic', targetSlots: [1], isBanned: false, isLocked: false, lockedRarity: null },
        { effectId: 'critFactor', minRarity: null, targetSlots: [], isBanned: true, isLocked: false, lockedRarity: null },
      ];

      const banned = selectionsToBannedEffects(selections);

      expect(banned).toEqual(['attackSpeed', 'critFactor']);
    });
  });

  describe('validateConfigForSimulation', () => {
    it('validates config with targets', () => {
      const config: CalculatorConfig = {
        ...createDefaultConfig(),
        slotTargets: [
          { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
        ],
      };

      const result = validateConfigForSimulation(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects config without targets', () => {
      const config = createDefaultConfig();
      const result = validateConfigForSimulation(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one target must be selected');
    });

    it('rejects config with empty acceptable effects', () => {
      const config: CalculatorConfig = {
        ...createDefaultConfig(),
        slotTargets: [
          { slotNumber: 1, acceptableEffects: [], minRarity: 'legendary' },
        ],
      };

      const result = validateConfigForSimulation(config);
      expect(result.isValid).toBe(false);
    });
  });
});
