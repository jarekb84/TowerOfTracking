/* eslint-disable max-lines */
import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, SlotTarget } from '../types';
import type { ManualModeConfig } from './types';
import {
  initializeManualMode,
  executeRoll,
  lockSlot,
  unlockSlot,
  canRoll,
  canAutoRoll,
  getCurrentRollCost,
  getCurrentBalance,
  checkCompletion,
  countUnfulfilledTargetEffects,
  markComplete,
  setAutoRolling,
  getBalanceStatus,
  countOpenSlots,
  countLockedSlots,
  getPoolSize,
  buildMinRarityMap,
} from './manual-mode-logic';

describe('manual-mode-logic', () => {
  const createTestConfig = (overrides?: Partial<CalculatorConfig>): CalculatorConfig => ({
    moduleType: 'cannon',
    moduleLevel: 100,
    moduleRarity: 'ancestral',
    slotCount: 8,
    bannedEffects: [],
    slotTargets: [],
    preLockedEffects: [],
    ...overrides,
  });

  const createModeConfig = (targets: SlotTarget[] = []): ManualModeConfig => ({
    targets,
    minRarityMap: buildMinRarityMap(targets),
  });

  describe('buildMinRarityMap', () => {
    it('builds map from slot targets', () => {
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
        { slotNumber: 2, acceptableEffects: ['critChance'], minRarity: 'epic' },
      ];

      const map = buildMinRarityMap(targets);

      expect(map.get('attackSpeed')).toBe('legendary');
      expect(map.get('critChance')).toBe('epic');
    });

    it('returns empty map for no targets', () => {
      const map = buildMinRarityMap([]);
      expect(map.size).toBe(0);
    });
  });

  describe('initializeManualMode', () => {
    it('creates initial state with correct slot count', () => {
      const config = createTestConfig({ slotCount: 8 });
      const state = initializeManualMode(config, 'accumulator', 0);

      expect(state.slots).toHaveLength(8);
      expect(state.slots.every((s) => !s.isLocked)).toBe(true);
      expect(state.slots.every((s) => s.effect === null)).toBe(true);
    });

    it('initializes with budget mode settings', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'budget', 10000);

      expect(state.shardMode).toBe('budget');
      expect(state.startingBalance).toBe(10000);
      expect(state.totalSpent).toBe(0);
    });

    it('initializes with accumulator mode settings', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);

      expect(state.shardMode).toBe('accumulator');
      expect(state.startingBalance).toBe(0);
      expect(state.totalSpent).toBe(0);
    });

    it('excludes banned effects from pool', () => {
      const config = createTestConfig({ bannedEffects: ['attackSpeed'] });
      const state = initializeManualMode(config, 'accumulator', 0);

      const hasAttackSpeed = state.pool.entries.some(
        (e) => e.effect.id === 'attackSpeed'
      );
      expect(hasAttackSpeed).toBe(false);
    });

    it('excludes pre-locked effects from pool', () => {
      const config = createTestConfig({
        preLockedEffects: [{ effectId: 'attackSpeed', rarity: 'legendary' }],
      });
      const state = initializeManualMode(config, 'accumulator', 0);

      const hasAttackSpeed = state.pool.entries.some(
        (e) => e.effect.id === 'attackSpeed'
      );
      expect(hasAttackSpeed).toBe(false);
    });

    it('initializes with correct default values', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);

      expect(state.rollCount).toBe(0);
      expect(state.isComplete).toBe(false);
      expect(state.isAutoRolling).toBe(false);
    });

    it('has non-empty pool for valid configuration', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);

      expect(state.pool.entries.length).toBeGreaterThan(0);
    });
  });

  describe('executeRoll', () => {
    it('fills all open slots', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState, result } = executeRoll(state, modeConfig);

      // All slots should now have effects
      expect(newState.slots.filter((s) => s.effect !== null)).toHaveLength(4);
      expect(result.filledSlotIndexes).toHaveLength(4);
    });

    it('increments roll count', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);

      expect(newState.rollCount).toBe(1);
    });

    it('adds shard cost to totalSpent', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState, result } = executeRoll(state, modeConfig);

      expect(newState.totalSpent).toBe(result.shardCost);
      expect(result.shardCost).toBe(10); // First lock cost is 10
    });

    it('skips locked slots', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      // First roll to fill slots
      const { newState: stateAfterRoll } = executeRoll(state, modeConfig);

      // Lock slot 1
      const stateWithLock = lockSlot(stateAfterRoll, 1);
      expect(stateWithLock.slots[0].isLocked).toBe(true);

      // Second roll should skip slot 1
      const { result } = executeRoll(stateWithLock, modeConfig);

      expect(result.filledSlotIndexes).not.toContain(0);
      expect(result.filledSlotIndexes).toHaveLength(3);
    });

    it('returns no-op when all slots are locked', () => {
      const config = createTestConfig({ slotCount: 2 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      // Fill slots first
      const { newState: stateAfterRoll } = executeRoll(state, modeConfig);

      // Lock all slots
      let lockedState = lockSlot(stateAfterRoll, 1);
      lockedState = lockSlot(lockedState, 2);

      const { newState, result } = executeRoll(lockedState, modeConfig);

      expect(result.shardCost).toBe(0);
      expect(result.filledSlotIndexes).toHaveLength(0);
      expect(newState.rollCount).toBe(lockedState.rollCount);
    });

    it('detects target matches', () => {
      const config = createTestConfig({ slotCount: 4 });
      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'common' },
      ];
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig(targets);

      // Run multiple rolls to increase chance of hitting target
      let currentState = state;
      let hitTarget = false;

      for (let i = 0; i < 50 && !hitTarget; i++) {
        const { newState, result } = executeRoll(currentState, modeConfig);
        hitTarget = result.hasTargetHit;
        currentState = newState;
      }

      // With enough rolls, should eventually hit the target
      expect(hitTarget).toBe(true);
    });
  });

  describe('lockSlot', () => {
    it('locks slot with effect', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      // Fill slots first
      const { newState } = executeRoll(state, modeConfig);

      const lockedState = lockSlot(newState, 1);

      expect(lockedState.slots[0].isLocked).toBe(true);
    });

    it('removes effect from pool when locked', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      // Fill slots first
      const { newState } = executeRoll(state, modeConfig);

      const effectId = newState.slots[0].effect!.id;
      const initialPoolSize = newState.pool.entries.filter(
        (e) => e.effect.id === effectId
      ).length;

      const lockedState = lockSlot(newState, 1);

      const finalPoolSize = lockedState.pool.entries.filter(
        (e) => e.effect.id === effectId
      ).length;

      expect(finalPoolSize).toBe(0);
      expect(initialPoolSize).toBeGreaterThan(0);
    });

    it('does nothing for empty slot', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);

      const result = lockSlot(state, 1);

      expect(result).toBe(state);
    });

    it('does nothing for already locked slot', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);
      const lockedOnce = lockSlot(newState, 1);
      const lockedTwice = lockSlot(lockedOnce, 1);

      expect(lockedTwice).toBe(lockedOnce);
    });
  });

  describe('unlockSlot', () => {
    it('unlocks a locked slot', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);
      const lockedState = lockSlot(newState, 1);
      const unlockedState = unlockSlot(lockedState, 1, config);

      expect(unlockedState.slots[0].isLocked).toBe(false);
    });

    it('restores effect to pool when unlocked', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);
      const effectId = newState.slots[0].effect!.id;

      const lockedState = lockSlot(newState, 1);
      const lockedPoolSize = lockedState.pool.entries.filter(
        (e) => e.effect.id === effectId
      ).length;
      expect(lockedPoolSize).toBe(0);

      const unlockedState = unlockSlot(lockedState, 1, config);
      const unlockedPoolSize = unlockedState.pool.entries.filter(
        (e) => e.effect.id === effectId
      ).length;
      expect(unlockedPoolSize).toBeGreaterThan(0);
    });

    it('does nothing for unlocked slot', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);
      const result = unlockSlot(newState, 1, config);

      expect(result).toBe(newState);
    });
  });

  describe('canRoll', () => {
    it('allows roll with open slots and pool', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);

      const result = canRoll(state);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('disallows roll when all slots locked', () => {
      const config = createTestConfig({ slotCount: 2 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);
      let lockedState = lockSlot(newState, 1);
      lockedState = lockSlot(lockedState, 2);

      const result = canRoll(lockedState);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('All slots are locked');
    });

    it('disallows roll when budget depleted', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'budget', 5); // Only 5 shards, cost is 10

      const result = canRoll(state);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Insufficient shard balance');
    });

    it('allows manual roll when session complete (users can continue rolling)', () => {
      const config = createTestConfig();
      let state = initializeManualMode(config, 'accumulator', 0);
      state = markComplete(state);

      // canRoll now allows rolling after session complete
      // (the completion is informational only)
      const result = canRoll(state);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe(null);
    });
  });

  describe('getCurrentRollCost', () => {
    it('returns 10 for no locked slots', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);

      expect(getCurrentRollCost(state)).toBe(10);
    });

    it('returns 40 for 1 locked slot', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);
      const lockedState = lockSlot(newState, 1);

      expect(getCurrentRollCost(lockedState)).toBe(40);
    });

    it('returns 160 for 2 locked slots', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);
      let lockedState = lockSlot(newState, 1);
      lockedState = lockSlot(lockedState, 2);

      expect(getCurrentRollCost(lockedState)).toBe(160);
    });
  });

  describe('getCurrentBalance', () => {
    it('returns remaining balance in budget mode', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'budget', 1000);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);

      expect(getCurrentBalance(newState)).toBe(990); // 1000 - 10
    });

    it('returns total spent in accumulator mode', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);

      expect(getCurrentBalance(newState)).toBe(10);
    });
  });

  describe('countUnfulfilledTargetEffects', () => {
    it('returns total effect count when nothing locked', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);

      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['effectA', 'effectB'], minRarity: 'common' },
        { slotNumber: 2, acceptableEffects: ['effectC'], minRarity: 'common' },
      ];

      // 3 unique effects: effectA, effectB, effectC
      expect(countUnfulfilledTargetEffects(state, targets)).toBe(3);
    });

    it('returns 0 when all target effects are locked', () => {
      const config = createTestConfig();
      let state = initializeManualMode(config, 'accumulator', 0);

      // Simulate locked slots with target effects
      state = {
        ...state,
        slots: state.slots.map((slot, i) => {
          if (i === 0) {
            return { ...slot, isLocked: true, effect: { id: 'effectA', displayName: 'Effect A', moduleType: 'cannon', values: {} } as never };
          }
          if (i === 1) {
            return { ...slot, isLocked: true, effect: { id: 'effectB', displayName: 'Effect B', moduleType: 'cannon', values: {} } as never };
          }
          return slot;
        }),
      };

      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['effectA', 'effectB'], minRarity: 'common' },
      ];

      // Both effectA and effectB are locked
      expect(countUnfulfilledTargetEffects(state, targets)).toBe(0);
    });

    it('counts only missing effects when some are locked', () => {
      const config = createTestConfig();
      let state = initializeManualMode(config, 'accumulator', 0);

      // Lock one effect
      state = {
        ...state,
        slots: state.slots.map((slot, i) => {
          if (i === 0) {
            return { ...slot, isLocked: true, effect: { id: 'effectA', displayName: 'Effect A', moduleType: 'cannon', values: {} } as never };
          }
          return slot;
        }),
      };

      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['effectA', 'effectB', 'effectC'], minRarity: 'common' },
      ];

      // effectA is locked, effectB and effectC are not
      expect(countUnfulfilledTargetEffects(state, targets)).toBe(2);
    });
  });

  describe('checkCompletion', () => {
    it('returns false with no targets', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);

      expect(checkCompletion(state, [])).toBe(false);
    });

    it('returns true when pool is exhausted', () => {
      const config = createTestConfig();
      let state = initializeManualMode(config, 'accumulator', 0);

      // Simulate exhausted pool
      state = {
        ...state,
        pool: { entries: [], cumulativeProbs: [] },
      };

      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['attackSpeed'], minRarity: 'legendary' },
      ];

      expect(checkCompletion(state, targets)).toBe(true);
    });

    it('returns false when some target effects are not yet locked', () => {
      const config = createTestConfig();
      let state = initializeManualMode(config, 'accumulator', 0);

      // Lock one effect but target has 2 effects
      state = {
        ...state,
        slots: state.slots.map((slot, i) => {
          if (i === 0) {
            return { ...slot, isLocked: true, effect: { id: 'effectA', displayName: 'Effect A', moduleType: 'cannon', values: {} } as never };
          }
          return slot;
        }),
      };

      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['effectA', 'effectB'], minRarity: 'common' },
      ];

      // Only effectA is locked, effectB is still needed
      expect(checkCompletion(state, targets)).toBe(false);
    });

    it('returns true when all target effects are locked', () => {
      const config = createTestConfig();
      let state = initializeManualMode(config, 'accumulator', 0);

      // Lock both effects
      state = {
        ...state,
        slots: state.slots.map((slot, i) => {
          if (i === 0) {
            return { ...slot, isLocked: true, effect: { id: 'effectA', displayName: 'Effect A', moduleType: 'cannon', values: {} } as never };
          }
          if (i === 1) {
            return { ...slot, isLocked: true, effect: { id: 'effectB', displayName: 'Effect B', moduleType: 'cannon', values: {} } as never };
          }
          return slot;
        }),
      };

      const targets: SlotTarget[] = [
        { slotNumber: 1, acceptableEffects: ['effectA', 'effectB'], minRarity: 'common' },
      ];

      expect(checkCompletion(state, targets)).toBe(true);
    });
  });

  describe('markComplete', () => {
    it('sets isComplete to true', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);

      const result = markComplete(state);

      expect(result.isComplete).toBe(true);
    });

    it('stops auto-rolling', () => {
      const config = createTestConfig();
      let state = initializeManualMode(config, 'accumulator', 0);
      state = setAutoRolling(state, true);

      const result = markComplete(state);

      expect(result.isAutoRolling).toBe(false);
    });
  });

  describe('setAutoRolling', () => {
    it('sets auto-rolling state', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);

      const enabled = setAutoRolling(state, true);
      expect(enabled.isAutoRolling).toBe(true);

      const disabled = setAutoRolling(enabled, false);
      expect(disabled.isAutoRolling).toBe(false);
    });
  });

  describe('getBalanceStatus', () => {
    it('returns normal for accumulator mode', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);

      expect(getBalanceStatus(state)).toBe('normal');
    });

    it('returns normal for healthy budget', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'budget', 10000);

      expect(getBalanceStatus(state)).toBe('normal');
    });

    it('returns warning for low budget', () => {
      const config = createTestConfig();
      let state = initializeManualMode(config, 'budget', 100);
      // Simulate spending to get below 20%
      state = { ...state, totalSpent: 85 }; // 15 remaining, < 20 (20% of 100)

      expect(getBalanceStatus(state)).toBe('warning');
    });

    it('returns critical when cannot afford roll', () => {
      const config = createTestConfig();
      let state = initializeManualMode(config, 'budget', 100);
      // Simulate spending to below roll cost
      state = { ...state, totalSpent: 95 }; // 5 remaining, < 10 (roll cost)

      expect(getBalanceStatus(state)).toBe('critical');
    });
  });

  describe('countOpenSlots', () => {
    it('returns all slots when none locked', () => {
      const config = createTestConfig({ slotCount: 8 });
      const state = initializeManualMode(config, 'accumulator', 0);

      expect(countOpenSlots(state)).toBe(8);
    });

    it('decreases when slots are locked', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);
      const lockedState = lockSlot(newState, 1);

      expect(countOpenSlots(lockedState)).toBe(3);
    });
  });

  describe('countLockedSlots', () => {
    it('returns 0 when none locked', () => {
      const config = createTestConfig({ slotCount: 8 });
      const state = initializeManualMode(config, 'accumulator', 0);

      expect(countLockedSlots(state)).toBe(0);
    });

    it('increases when slots are locked', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);
      let lockedState = lockSlot(newState, 1);
      lockedState = lockSlot(lockedState, 2);

      expect(countLockedSlots(lockedState)).toBe(2);
    });
  });

  describe('getPoolSize', () => {
    it('returns initial pool size', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);

      expect(getPoolSize(state)).toBeGreaterThan(0);
    });

    it('decreases when effects are locked', () => {
      const config = createTestConfig({ slotCount: 4 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig();

      const { newState } = executeRoll(state, modeConfig);
      const initialPoolSize = getPoolSize(newState);

      const lockedState = lockSlot(newState, 1);
      const finalPoolSize = getPoolSize(lockedState);

      expect(finalPoolSize).toBeLessThan(initialPoolSize);
    });
  });

  describe('canAutoRoll', () => {
    it('allows auto-roll when targets exist and not all acquired', () => {
      const target: SlotTarget = {
        slotNumber: 1,
        acceptableEffects: ['cannonCritChance'],
        minRarity: 'common',
      };
      const config = createTestConfig({ slotTargets: [target] });
      const state = initializeManualMode(config, 'accumulator', 0);

      const result = canAutoRoll(state, [target]);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe(null);
    });

    it('disallows auto-roll when no targets configured', () => {
      const config = createTestConfig();
      const state = initializeManualMode(config, 'accumulator', 0);

      const result = canAutoRoll(state, []);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('No targets configured');
    });

    it('allows auto-roll when some target effects remain unfulfilled', () => {
      const config = createTestConfig();
      let state = initializeManualMode(config, 'accumulator', 0);

      // Lock one effect but there are 2 target effects
      state = {
        ...state,
        slots: state.slots.map((slot, i) => {
          if (i === 0) {
            return { ...slot, isLocked: true, effect: { id: 'effectA', displayName: 'Effect A', moduleType: 'cannon', values: {} } as never };
          }
          return slot;
        }),
      };

      const target: SlotTarget = {
        slotNumber: 1,
        acceptableEffects: ['effectA', 'effectB'],
        minRarity: 'common',
      };

      // effectA is locked but effectB is still needed
      const result = canAutoRoll(state, [target]);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe(null);
    });

    it('disallows auto-roll when all target effects are acquired', () => {
      const config = createTestConfig();
      let state = initializeManualMode(config, 'accumulator', 0);

      // Lock both target effects
      state = {
        ...state,
        slots: state.slots.map((slot, i) => {
          if (i === 0) {
            return { ...slot, isLocked: true, effect: { id: 'effectA', displayName: 'Effect A', moduleType: 'cannon', values: {} } as never };
          }
          if (i === 1) {
            return { ...slot, isLocked: true, effect: { id: 'effectB', displayName: 'Effect B', moduleType: 'cannon', values: {} } as never };
          }
          return slot;
        }),
      };

      const target: SlotTarget = {
        slotNumber: 1,
        acceptableEffects: ['effectA', 'effectB'],
        minRarity: 'common',
      };

      const result = canAutoRoll(state, [target]);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('All targets acquired');
    });

    it('disallows auto-roll when all slots locked', () => {
      const target: SlotTarget = {
        slotNumber: 1,
        acceptableEffects: ['cannonCritChance'],
        minRarity: 'common',
      };
      const config = createTestConfig({ slotCount: 1 });
      const state = initializeManualMode(config, 'accumulator', 0);
      const modeConfig = createModeConfig([target]);

      // Roll and lock the only slot
      const { newState } = executeRoll(state, modeConfig);
      const lockedState = lockSlot(newState, 1);

      const result = canAutoRoll(lockedState, [target]);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('All slots are locked');
    });

    it('disallows auto-roll when pool exhausted', () => {
      const target: SlotTarget = {
        slotNumber: 1,
        acceptableEffects: ['cannonCritChance'],
        minRarity: 'common',
      };
      const config = createTestConfig();
      let state = initializeManualMode(config, 'accumulator', 0);

      // Exhaust the pool manually
      state = { ...state, pool: { ...state.pool, entries: [] } };

      const result = canAutoRoll(state, [target]);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Effect pool is exhausted');
    });
  });
});
