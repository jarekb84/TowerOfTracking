/* eslint-disable max-lines */
import { describe, it, expect } from 'vitest';
import type { ManualSlot, RollLogEntry, RollLogEffect } from '../types';
import {
  MAX_LOG_ENTRIES,
  filterQualifyingEffects,
  shouldLogRoll,
  createLogEntry,
  addLogEntry,
  processRollForLogging,
  generateRollLogSummary,
} from './roll-log-logic';

describe('roll-log-logic', () => {
  const createMockSlot = (
    slotNumber: number,
    effectId: string | null,
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'ancestral' | null,
    isLocked = false
  ): ManualSlot => ({
    slotNumber,
    effect: effectId ? { id: effectId, displayName: `Effect ${effectId}`, moduleType: 'cannon', values: {} } as never : null,
    rarity,
    isLocked,
    isTargetMatch: false,
  });

  describe('MAX_LOG_ENTRIES', () => {
    it('is set to 500', () => {
      expect(MAX_LOG_ENTRIES).toBe(500);
    });
  });

  describe('filterQualifyingEffects', () => {
    it('returns empty array when no slots have effects', () => {
      const slots = [createMockSlot(1, null, null)];
      const result = filterQualifyingEffects(slots, [0], 'mythic');
      expect(result).toEqual([]);
    });

    it('filters effects below minimum rarity', () => {
      const slots = [
        createMockSlot(1, 'effect1', 'common'),
        createMockSlot(2, 'effect2', 'rare'),
        createMockSlot(3, 'effect3', 'mythic'),
      ];

      const result = filterQualifyingEffects(slots, [0, 1, 2], 'mythic');

      expect(result).toHaveLength(1);
      expect(result[0].effectId).toBe('effect3');
    });

    it('includes effects at exactly minimum rarity', () => {
      const slots = [createMockSlot(1, 'effect1', 'legendary')];

      const result = filterQualifyingEffects(slots, [0], 'legendary');

      expect(result).toHaveLength(1);
      expect(result[0].rarity).toBe('legendary');
    });

    it('includes effects above minimum rarity', () => {
      const slots = [
        createMockSlot(1, 'effect1', 'mythic'),
        createMockSlot(2, 'effect2', 'ancestral'),
      ];

      const result = filterQualifyingEffects(slots, [0, 1], 'legendary');

      expect(result).toHaveLength(2);
    });

    it('only checks filled slot indexes', () => {
      const slots = [
        createMockSlot(1, 'effect1', 'mythic'),
        createMockSlot(2, 'effect2', 'ancestral'),
        createMockSlot(3, 'effect3', 'mythic'),
      ];

      // Only check slot at index 1
      const result = filterQualifyingEffects(slots, [1], 'mythic');

      expect(result).toHaveLength(1);
      expect(result[0].effectId).toBe('effect2');
    });

    it('includes correct effect properties', () => {
      const slots = [createMockSlot(1, 'testEffect', 'ancestral')];

      const result = filterQualifyingEffects(slots, [0], 'mythic');

      expect(result[0]).toEqual({
        effectId: 'testEffect',
        name: 'Effect testEffect',
        rarity: 'ancestral',
        shortName: 'A',
        isTargetMatch: false,
      });
    });

    it('handles all rarity short names correctly', () => {
      const rarities: Array<'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'ancestral'> = [
        'common', 'rare', 'epic', 'legendary', 'mythic', 'ancestral',
      ];
      const expectedShortNames = ['C', 'R', 'E', 'L', 'M', 'A'];

      for (let i = 0; i < rarities.length; i++) {
        const slots = [createMockSlot(1, `effect${i}`, rarities[i])];
        const result = filterQualifyingEffects(slots, [0], 'common');
        expect(result[0].shortName).toBe(expectedShortNames[i]);
      }
    });
  });

  describe('shouldLogRoll', () => {
    it('returns false when logging is disabled', () => {
      const slots = [createMockSlot(1, 'effect1', 'ancestral')];
      const result = shouldLogRoll(slots, [0], 'common', false);
      expect(result).toBe(false);
    });

    it('returns false when no slots were filled', () => {
      const slots = [createMockSlot(1, 'effect1', 'mythic')];
      const result = shouldLogRoll(slots, [], 'mythic', true);
      expect(result).toBe(false);
    });

    it('returns false when no effect meets minimum rarity', () => {
      const slots = [
        createMockSlot(1, 'effect1', 'common'),
        createMockSlot(2, 'effect2', 'rare'),
      ];
      const result = shouldLogRoll(slots, [0, 1], 'mythic', true);
      expect(result).toBe(false);
    });

    it('returns true when at least one effect meets minimum rarity', () => {
      const slots = [
        createMockSlot(1, 'effect1', 'common'),
        createMockSlot(2, 'effect2', 'mythic'),
      ];
      const result = shouldLogRoll(slots, [0, 1], 'mythic', true);
      expect(result).toBe(true);
    });

    it('returns true for ancestral when filtering on mythic', () => {
      const slots = [createMockSlot(1, 'effect1', 'ancestral')];
      const result = shouldLogRoll(slots, [0], 'mythic', true);
      expect(result).toBe(true);
    });

    it('handles empty slot (null rarity) gracefully', () => {
      const slots = [createMockSlot(1, null, null)];
      const result = shouldLogRoll(slots, [0], 'mythic', true);
      expect(result).toBe(false);
    });
  });

  describe('createLogEntry', () => {
    it('creates entry with correct properties', () => {
      const effects: RollLogEffect[] = [
        { effectId: 'effect1', name: 'Effect 1', rarity: 'mythic', shortName: 'M', isTargetMatch: false },
      ];

      const entry = createLogEntry(42, 4200, 100, effects);

      expect(entry).toEqual({
        rollNumber: 42,
        totalShards: 4200,
        rollCost: 100,
        effects,
      });
    });

    it('handles empty effects array', () => {
      const entry = createLogEntry(1, 10, 10, []);

      expect(entry.effects).toEqual([]);
    });

    it('handles multiple effects', () => {
      const effects: RollLogEffect[] = [
        { effectId: 'effect1', name: 'Effect 1', rarity: 'mythic', shortName: 'M', isTargetMatch: false },
        { effectId: 'effect2', name: 'Effect 2', rarity: 'ancestral', shortName: 'A', isTargetMatch: true },
      ];

      const entry = createLogEntry(1, 100, 100, effects);

      expect(entry.effects).toHaveLength(2);
    });
  });

  describe('addLogEntry', () => {
    it('prepends new entry to beginning of array', () => {
      const existingEntries: RollLogEntry[] = [
        { rollNumber: 1, totalShards: 10, rollCost: 10, effects: [] },
      ];
      const newEntry: RollLogEntry = {
        rollNumber: 2,
        totalShards: 20,
        rollCost: 10,
        effects: [],
      };

      const result = addLogEntry(existingEntries, newEntry);

      expect(result[0]).toBe(newEntry);
      expect(result[1]).toBe(existingEntries[0]);
    });

    it('does not mutate original array', () => {
      const existingEntries: RollLogEntry[] = [
        { rollNumber: 1, totalShards: 10, rollCost: 10, effects: [] },
      ];
      const newEntry: RollLogEntry = {
        rollNumber: 2,
        totalShards: 20,
        rollCost: 10,
        effects: [],
      };

      addLogEntry(existingEntries, newEntry);

      expect(existingEntries).toHaveLength(1);
    });

    it('enforces max entries limit', () => {
      const existingEntries: RollLogEntry[] = Array.from({ length: MAX_LOG_ENTRIES }, (_, i) => ({
        rollNumber: i + 1,
        totalShards: (i + 1) * 10,
        rollCost: 10,
        effects: [],
      }));

      const newEntry: RollLogEntry = {
        rollNumber: MAX_LOG_ENTRIES + 1,
        totalShards: (MAX_LOG_ENTRIES + 1) * 10,
        rollCost: 10,
        effects: [],
      };

      const result = addLogEntry(existingEntries, newEntry);

      expect(result).toHaveLength(MAX_LOG_ENTRIES);
      expect(result[0].rollNumber).toBe(MAX_LOG_ENTRIES + 1);
      expect(result[MAX_LOG_ENTRIES - 1].rollNumber).toBe(MAX_LOG_ENTRIES - 1);
    });

    it('accepts custom max entries limit', () => {
      const existingEntries: RollLogEntry[] = [
        { rollNumber: 1, totalShards: 10, rollCost: 10, effects: [] },
        { rollNumber: 2, totalShards: 20, rollCost: 10, effects: [] },
      ];
      const newEntry: RollLogEntry = {
        rollNumber: 3,
        totalShards: 30,
        rollCost: 10,
        effects: [],
      };

      const result = addLogEntry(existingEntries, newEntry, 2);

      expect(result).toHaveLength(2);
      expect(result[0].rollNumber).toBe(3);
      expect(result[1].rollNumber).toBe(1);
    });

    it('handles empty existing entries', () => {
      const newEntry: RollLogEntry = {
        rollNumber: 1,
        totalShards: 10,
        rollCost: 10,
        effects: [],
      };

      const result = addLogEntry([], newEntry);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(newEntry);
    });
  });

  describe('processRollForLogging', () => {
    it('returns unchanged entries when logging is disabled', () => {
      const slots = [createMockSlot(1, 'effect1', 'ancestral')];
      const existingEntries: RollLogEntry[] = [
        { rollNumber: 1, totalShards: 100, rollCost: 100, effects: [] },
      ];

      const result = processRollForLogging({
        slots,
        filledSlotIndexes: [0],
        rollNumber: 2,
        totalSpent: 200,
        rollCost: 100,
        logEntries: existingEntries,
        minimumLogRarity: 'mythic',
        logEnabled: false,
      });

      expect(result).toBe(existingEntries);
    });

    it('returns unchanged entries when no slots were filled', () => {
      const slots = [createMockSlot(1, 'effect1', 'mythic')];
      const existingEntries: RollLogEntry[] = [];

      const result = processRollForLogging({
        slots,
        filledSlotIndexes: [],
        rollNumber: 1,
        totalSpent: 100,
        rollCost: 100,
        logEntries: existingEntries,
        minimumLogRarity: 'mythic',
        logEnabled: true,
      });

      expect(result).toBe(existingEntries);
    });

    it('returns unchanged entries when no effect meets minimum rarity', () => {
      const slots = [
        createMockSlot(1, 'effect1', 'common'),
        createMockSlot(2, 'effect2', 'rare'),
      ];
      const existingEntries: RollLogEntry[] = [];

      const result = processRollForLogging({
        slots,
        filledSlotIndexes: [0, 1],
        rollNumber: 1,
        totalSpent: 100,
        rollCost: 100,
        logEntries: existingEntries,
        minimumLogRarity: 'mythic',
        logEnabled: true,
      });

      expect(result).toBe(existingEntries);
    });

    it('adds entry when effect meets minimum rarity', () => {
      const slots = [createMockSlot(1, 'effect1', 'mythic')];
      const existingEntries: RollLogEntry[] = [];

      const result = processRollForLogging({
        slots,
        filledSlotIndexes: [0],
        rollNumber: 5,
        totalSpent: 500,
        rollCost: 100,
        logEntries: existingEntries,
        minimumLogRarity: 'mythic',
        logEnabled: true,
      });

      expect(result).toHaveLength(1);
      expect(result[0].rollNumber).toBe(5);
      expect(result[0].totalShards).toBe(500);
      expect(result[0].rollCost).toBe(100);
      expect(result[0].effects).toHaveLength(1);
      expect(result[0].effects[0].effectId).toBe('effect1');
    });

    it('prepends new entry to existing entries', () => {
      const slots = [createMockSlot(1, 'effect1', 'ancestral')];
      const existingEntries: RollLogEntry[] = [
        { rollNumber: 1, totalShards: 100, rollCost: 100, effects: [] },
      ];

      const result = processRollForLogging({
        slots,
        filledSlotIndexes: [0],
        rollNumber: 2,
        totalSpent: 200,
        rollCost: 100,
        logEntries: existingEntries,
        minimumLogRarity: 'mythic',
        logEnabled: true,
      });

      expect(result).toHaveLength(2);
      expect(result[0].rollNumber).toBe(2);
      expect(result[1].rollNumber).toBe(1);
    });

    it('only includes qualifying effects in entry', () => {
      const slots = [
        createMockSlot(1, 'effect1', 'common'),
        createMockSlot(2, 'effect2', 'mythic'),
        createMockSlot(3, 'effect3', 'ancestral'),
      ];
      const existingEntries: RollLogEntry[] = [];

      const result = processRollForLogging({
        slots,
        filledSlotIndexes: [0, 1, 2],
        rollNumber: 1,
        totalSpent: 100,
        rollCost: 100,
        logEntries: existingEntries,
        minimumLogRarity: 'mythic',
        logEnabled: true,
      });

      expect(result).toHaveLength(1);
      expect(result[0].effects).toHaveLength(2);
      expect(result[0].effects[0].effectId).toBe('effect2');
      expect(result[0].effects[1].effectId).toBe('effect3');
    });
  });

  describe('generateRollLogSummary', () => {
    const createMockEntry = (
      rollNumber: number,
      effects: RollLogEffect[]
    ): RollLogEntry => ({
      rollNumber,
      totalShards: rollNumber * 100,
      rollCost: 100,
      effects,
    });

    it('returns "Empty" when no entries', () => {
      expect(generateRollLogSummary([])).toBe('Empty');
    });

    it('returns singular "entry" for one entry', () => {
      const entries = [
        createMockEntry(1, [
          { effectId: 'e1', name: 'Effect 1', rarity: 'legendary', shortName: 'L', isTargetMatch: false },
        ]),
      ];
      expect(generateRollLogSummary(entries)).toBe('1 entry | Latest: Legendary');
    });

    it('returns plural "entries" for multiple entries', () => {
      const entries = [
        createMockEntry(2, [
          { effectId: 'e1', name: 'Effect 1', rarity: 'mythic', shortName: 'M', isTargetMatch: false },
        ]),
        createMockEntry(1, [
          { effectId: 'e2', name: 'Effect 2', rarity: 'epic', shortName: 'E', isTargetMatch: false },
        ]),
      ];
      expect(generateRollLogSummary(entries)).toBe('2 entries | Latest: Mythic');
    });

    it('shows highest rarity from latest entry', () => {
      const entries = [
        createMockEntry(1, [
          { effectId: 'e1', name: 'Effect 1', rarity: 'rare', shortName: 'R', isTargetMatch: false },
          { effectId: 'e2', name: 'Effect 2', rarity: 'ancestral', shortName: 'A', isTargetMatch: true },
          { effectId: 'e3', name: 'Effect 3', rarity: 'epic', shortName: 'E', isTargetMatch: false },
        ]),
      ];
      expect(generateRollLogSummary(entries)).toBe('1 entry | Latest: Ancestral');
    });

    it('returns just count when latest entry has no effects', () => {
      const entries = [createMockEntry(1, [])];
      expect(generateRollLogSummary(entries)).toBe('1 entry');
    });

    it('handles large entry counts', () => {
      const entries = Array.from({ length: 100 }, (_, i) =>
        createMockEntry(i + 1, [
          { effectId: 'e1', name: 'Effect 1', rarity: 'common', shortName: 'C', isTargetMatch: false },
        ])
      );
      expect(generateRollLogSummary(entries)).toBe('100 entries | Latest: Common');
    });
  });
});
