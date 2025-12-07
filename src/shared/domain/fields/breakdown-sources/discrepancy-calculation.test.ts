import { describe, it, expect } from 'vitest';
import { calculateDiscrepancy } from './discrepancy-calculation';
import { DISCREPANCY_THRESHOLD } from './discrepancy-config';

describe('calculateDiscrepancy', () => {
  describe('unknown discrepancy (total > sourceSum)', () => {
    it('returns unknown when sources sum to less than total by more than threshold', () => {
      const result = calculateDiscrepancy(1000, 850);
      expect(result).toEqual({
        type: 'unknown',
        value: 150,
        percentage: 15,
      });
    });

    it('calculates percentage correctly for large values', () => {
      // 312K total, 303K sources = 9K unknown (2.88%)
      const result = calculateDiscrepancy(312000, 303000);
      expect(result).toEqual({
        type: 'unknown',
        value: 9000,
        percentage: 2.88,
      });
    });

    it('returns 100% unknown when all sources are zero but total exists', () => {
      const result = calculateDiscrepancy(1000, 0);
      expect(result).toEqual({
        type: 'unknown',
        value: 1000,
        percentage: 100,
      });
    });
  });

  describe('overage discrepancy (sourceSum > total)', () => {
    it('returns overage when sources sum to more than total by more than threshold', () => {
      const result = calculateDiscrepancy(1000, 1150);
      expect(result).toEqual({
        type: 'overage',
        value: 150,
        percentage: 15,
      });
    });

    it('calculates percentage correctly for overage', () => {
      // 8.5T total, 9.1T sources = 600B overage (~7.1%)
      const result = calculateDiscrepancy(8500, 9100);
      expect(result).toEqual({
        type: 'overage',
        value: 600,
        percentage: 7.06,
      });
    });
  });

  describe('threshold handling', () => {
    it('returns null when discrepancy is below default threshold (1%)', () => {
      // 0.5% difference - below 1% threshold
      const result = calculateDiscrepancy(1000, 995);
      expect(result).toBeNull();
    });

    it('returns null when discrepancy is exactly at threshold', () => {
      // Exactly 1% difference - not strictly greater
      const result = calculateDiscrepancy(1000, 990);
      expect(result).toBeNull();
    });

    it('returns discrepancy when just above threshold', () => {
      // 1.1% difference - strictly greater than 1%
      const result = calculateDiscrepancy(1000, 989);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('unknown');
    });

    it('respects custom threshold', () => {
      // 5% difference with 10% threshold - should return null
      const result = calculateDiscrepancy(1000, 950, 0.1);
      expect(result).toBeNull();

      // Same values with 1% threshold - should return discrepancy
      const result2 = calculateDiscrepancy(1000, 950, 0.01);
      expect(result2).not.toBeNull();
    });

    it('uses default threshold constant', () => {
      expect(DISCREPANCY_THRESHOLD).toBe(0.01);
    });
  });

  describe('edge cases', () => {
    it('returns null when both total and sourceSum are zero', () => {
      const result = calculateDiscrepancy(0, 0);
      expect(result).toBeNull();
    });

    it('returns overage when total is zero but sources exist', () => {
      const result = calculateDiscrepancy(0, 100);
      expect(result).toEqual({
        type: 'overage',
        value: 100,
        percentage: 100,
      });
    });

    it('returns null when total exactly equals sourceSum', () => {
      const result = calculateDiscrepancy(1000, 1000);
      expect(result).toBeNull();
    });

    it('handles very small percentages', () => {
      // 1.5% difference
      const result = calculateDiscrepancy(10000, 9850);
      expect(result?.percentage).toBe(1.5);
    });

    it('rounds percentage to 2 decimal places', () => {
      // Creates a percentage with many decimal places
      const result = calculateDiscrepancy(333, 300);
      expect(result?.percentage).toBe(9.91); // 33/333 = 9.909909...
    });
  });
});
