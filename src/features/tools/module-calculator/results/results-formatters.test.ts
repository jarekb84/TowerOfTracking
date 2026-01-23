import { describe, it, expect } from 'vitest';
import {
  formatCost,
  formatCostRange,
  formatPercentage,
  formatProbability,
  formatShardCost,
  formatRollCount,
  formatExpectedRolls,
  getPercentileColor,
  formatPercentileLabel,
  formatRunCount,
  formatConfidenceMessage,
} from './results-formatters';

describe('results-formatters', () => {
  describe('formatCost', () => {
    it('formats numbers under 1K', () => {
      expect(formatCost(0)).toBe('0');
      expect(formatCost(100)).toBe('100');
      expect(formatCost(999)).toBe('999');
    });

    it('formats thousands with K suffix', () => {
      expect(formatCost(1000)).toBe('1K');
      expect(formatCost(1500)).toBe('1.5K');
      expect(formatCost(999999)).toBe('1,000K');
    });

    it('formats millions with M suffix', () => {
      expect(formatCost(1000000)).toBe('1M');
      expect(formatCost(2500000)).toBe('2.5M');
      expect(formatCost(1580000)).toBe('1.58M');
      expect(formatCost(1660000)).toBe('1.66M');
    });

    it('formats billions with B suffix', () => {
      expect(formatCost(1000000000)).toBe('1B');
      expect(formatCost(3700000000)).toBe('3.7B');
    });
  });

  describe('formatCostRange', () => {
    it('formats range with appropriate suffixes', () => {
      expect(formatCostRange(1000, 5000)).toBe('1K - 5K');
      expect(formatCostRange(500000, 2000000)).toBe('500K - 2M');
    });
  });

  describe('formatPercentage', () => {
    it('formats with specified decimals', () => {
      expect(formatPercentage(50)).toBe('50%');
      expect(formatPercentage(33.333, 2)).toBe('33.33%');
    });
  });

  describe('formatProbability', () => {
    it('formats very small probabilities with 2 decimals', () => {
      expect(formatProbability(0.0003)).toBe('0.03%');
    });

    it('formats small probabilities with 1 decimal', () => {
      expect(formatProbability(0.003)).toBe('0.3%');
      expect(formatProbability(0.001)).toBe('0.1%');
    });

    it('formats larger probabilities with no decimals', () => {
      expect(formatProbability(0.1)).toBe('10%');
      expect(formatProbability(0.462)).toBe('46%');
    });
  });

  describe('formatShardCost', () => {
    it('formats shard cost with unit', () => {
      expect(formatShardCost(10)).toBe('10 shards');
      expect(formatShardCost(1600)).toBe('1.6K shards');
    });
  });

  describe('formatRollCount', () => {
    it('formats roll count', () => {
      expect(formatRollCount(100)).toBe('100 rolls');
      expect(formatRollCount(50000)).toBe('50K rolls');
    });
  });

  describe('formatExpectedRolls', () => {
    it('calculates expected rolls from probability', () => {
      expect(formatExpectedRolls(0.1)).toBe('~10 rolls');
      expect(formatExpectedRolls(0.01)).toBe('~100 rolls');
    });

    it('handles zero probability', () => {
      expect(formatExpectedRolls(0)).toBe('∞ rolls');
    });
  });

  describe('getPercentileColor', () => {
    it('returns green for low percentiles (good case)', () => {
      expect(getPercentileColor(10)).toBe('#22c55e');
      expect(getPercentileColor(25)).toBe('#22c55e');
    });

    it('returns yellow for median (typical)', () => {
      expect(getPercentileColor(50)).toBe('#eab308');
    });

    it('returns orange for high percentiles (pessimistic)', () => {
      expect(getPercentileColor(75)).toBe('#f97316');
    });

    it('returns red for very high percentiles (worst case)', () => {
      expect(getPercentileColor(95)).toBe('#ef4444');
    });
  });

  describe('formatPercentileLabel', () => {
    it('formats special percentiles', () => {
      expect(formatPercentileLabel(25)).toBe('25th %ile (good)');
      expect(formatPercentileLabel(50)).toBe('Median');
      expect(formatPercentileLabel(75)).toBe('75th %ile (pessimistic)');
      expect(formatPercentileLabel(95)).toBe('95th %ile (worst)');
    });

    it('formats regular percentiles', () => {
      expect(formatPercentileLabel(10)).toBe('10th %ile');
      expect(formatPercentileLabel(60)).toBe('60th %ile');
    });
  });

  describe('formatRunCount', () => {
    it('formats round numbers without decimals', () => {
      expect(formatRunCount(10000)).toBe('Based on 10K simulations');
      expect(formatRunCount(100000)).toBe('Based on 100K simulations');
      expect(formatRunCount(1000000)).toBe('Based on 1M simulations');
    });

    it('formats non-round numbers with one decimal', () => {
      expect(formatRunCount(15000)).toBe('Based on 15K simulations');
      expect(formatRunCount(12500)).toBe('Based on 12.5K simulations');
      expect(formatRunCount(1500000)).toBe('Based on 1.5M simulations');
    });

    it('formats small numbers without suffix', () => {
      expect(formatRunCount(500)).toBe('Based on 500 simulations');
    });
  });

  describe('formatConfidenceMessage', () => {
    it('formats confidence message', () => {
      expect(formatConfidenceMessage(5000000)).toBe(
        '95% of runs cost less than 5M shards'
      );
    });
  });
});
