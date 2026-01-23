/**
 * Banned Effects Logic Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBannedEffectsInfo } from './banned-effects-logic';
import * as moduleData from '@/shared/domain/module-data';

vi.mock('@/shared/domain/module-data', () => ({
  getSubEffectById: vi.fn(),
  getAvailableRarities: vi.fn(),
}));

describe('getBannedEffectsInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty info for no banned effects', () => {
    const result = getBannedEffectsInfo([]);

    expect(result).toEqual({
      effectNames: [],
      effectCount: 0,
      combinationsRemoved: 0,
    });
  });

  it('calculates combinations from available rarities', () => {
    const mockEffect = { id: 'effect-1', displayName: 'Poison Swamp' };
    vi.mocked(moduleData.getSubEffectById).mockReturnValue(mockEffect as never);
    vi.mocked(moduleData.getAvailableRarities).mockReturnValue([
      'common',
      'uncommon',
      'rare',
      'epic',
      'legendary',
      'ancestral',
    ] as never);

    const result = getBannedEffectsInfo(['effect-1']);

    expect(result).toEqual({
      effectNames: ['Poison Swamp'],
      effectCount: 1,
      combinationsRemoved: 6,
    });
  });

  it('sums combinations across multiple banned effects', () => {
    const mockEffect1 = { id: 'effect-1', displayName: 'Effect One' };
    const mockEffect2 = { id: 'effect-2', displayName: 'Effect Two' };

    vi.mocked(moduleData.getSubEffectById)
      .mockReturnValueOnce(mockEffect1 as never)
      .mockReturnValueOnce(mockEffect2 as never);
    vi.mocked(moduleData.getAvailableRarities)
      .mockReturnValueOnce(['common', 'uncommon', 'rare'] as never)
      .mockReturnValueOnce(['epic', 'legendary', 'ancestral'] as never);

    const result = getBannedEffectsInfo(['effect-1', 'effect-2']);

    expect(result).toEqual({
      effectNames: ['Effect One', 'Effect Two'],
      effectCount: 2,
      combinationsRemoved: 6,
    });
  });

  it('uses id as fallback for unknown effects', () => {
    vi.mocked(moduleData.getSubEffectById).mockReturnValue(undefined);

    const result = getBannedEffectsInfo(['unknown-effect']);

    expect(result).toEqual({
      effectNames: ['unknown-effect'],
      effectCount: 1,
      combinationsRemoved: 0,
    });
  });
});
