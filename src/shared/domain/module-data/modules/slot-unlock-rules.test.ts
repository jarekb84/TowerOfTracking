import { describe, it, expect } from 'vitest';
import {
  getSlotsForLevel,
  getMinLevelForSlots,
  getAvailableSlotCounts,
  isValidModuleLevel,
  MIN_MODULE_LEVEL,
  MAX_SLOTS,
} from './slot-unlock-rules';

describe('slot-unlock-rules', () => {
  describe('getSlotsForLevel', () => {
    it('returns 2 slots for levels 1-40', () => {
      expect(getSlotsForLevel(1)).toBe(2);
      expect(getSlotsForLevel(20)).toBe(2);
      expect(getSlotsForLevel(40)).toBe(2);
    });

    it('returns 3 slots for levels 41-100', () => {
      expect(getSlotsForLevel(41)).toBe(3);
      expect(getSlotsForLevel(70)).toBe(3);
      expect(getSlotsForLevel(100)).toBe(3);
    });

    it('returns 4 slots for levels 101-140', () => {
      expect(getSlotsForLevel(101)).toBe(4);
      expect(getSlotsForLevel(140)).toBe(4);
    });

    it('returns 5 slots for levels 141-160', () => {
      expect(getSlotsForLevel(141)).toBe(5);
      expect(getSlotsForLevel(160)).toBe(5);
    });

    it('returns 6 slots for levels 161-200', () => {
      expect(getSlotsForLevel(161)).toBe(6);
      expect(getSlotsForLevel(200)).toBe(6);
    });

    it('returns 7 slots for levels 201-240', () => {
      expect(getSlotsForLevel(201)).toBe(7);
      expect(getSlotsForLevel(240)).toBe(7);
    });

    it('returns 8 slots for levels 241+', () => {
      expect(getSlotsForLevel(241)).toBe(8);
      expect(getSlotsForLevel(300)).toBe(8);
      expect(getSlotsForLevel(1000)).toBe(8);
    });

    it('handles level 0 and negative levels gracefully', () => {
      expect(getSlotsForLevel(0)).toBe(2);
      expect(getSlotsForLevel(-5)).toBe(2);
    });
  });

  describe('getMinLevelForSlots', () => {
    it('returns correct minimum levels', () => {
      expect(getMinLevelForSlots(2)).toBe(1);
      expect(getMinLevelForSlots(3)).toBe(41);
      expect(getMinLevelForSlots(4)).toBe(101);
      expect(getMinLevelForSlots(5)).toBe(141);
      expect(getMinLevelForSlots(6)).toBe(161);
      expect(getMinLevelForSlots(7)).toBe(201);
      expect(getMinLevelForSlots(8)).toBe(241);
    });

    it('returns null for invalid slot counts', () => {
      expect(getMinLevelForSlots(1)).toBeNull();
      expect(getMinLevelForSlots(9)).toBeNull();
      expect(getMinLevelForSlots(0)).toBeNull();
    });
  });

  describe('getAvailableSlotCounts', () => {
    it('returns all slot counts from 2 to 8', () => {
      const counts = getAvailableSlotCounts();
      expect(counts).toEqual([2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('isValidModuleLevel', () => {
    it('returns true for valid levels', () => {
      expect(isValidModuleLevel(1)).toBe(true);
      expect(isValidModuleLevel(100)).toBe(true);
      expect(isValidModuleLevel(300)).toBe(true);
    });

    it('returns false for invalid levels', () => {
      expect(isValidModuleLevel(0)).toBe(false);
      expect(isValidModuleLevel(-1)).toBe(false);
      expect(isValidModuleLevel(1.5)).toBe(false);
    });
  });

  describe('constants', () => {
    it('exports correct constants', () => {
      expect(MIN_MODULE_LEVEL).toBe(1);
      expect(MAX_SLOTS).toBe(8);
    });
  });
});
