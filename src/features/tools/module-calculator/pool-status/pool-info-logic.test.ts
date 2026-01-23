/**
 * Pool Info Logic Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPoolInfo, getAvailablePoolEffects } from './pool-info-logic';
import * as moduleData from '@/shared/domain/module-data';

vi.mock('@/shared/domain/module-data', () => ({
  getSubEffectsForModule: vi.fn(),
  filterByModuleRarity: vi.fn(),
  countPoolCombinations: vi.fn(),
}));

describe('getAvailablePoolEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters out banned and locked effects', () => {
    const mockEffects = [
      { id: 'effect-1' },
      { id: 'effect-2' },
      { id: 'effect-3' },
      { id: 'effect-4' },
    ];

    vi.mocked(moduleData.getSubEffectsForModule).mockReturnValue(mockEffects as never);
    vi.mocked(moduleData.filterByModuleRarity).mockImplementation((effects) => effects as never);

    const result = getAvailablePoolEffects({
      moduleType: 'cannon',
      moduleRarity: 'legendary',
      bannedEffectIds: ['effect-1'],
      lockedEffectIds: ['effect-3'],
    });

    expect(result).toEqual([{ id: 'effect-2' }, { id: 'effect-4' }]);
  });

  it('applies module rarity filter', () => {
    const mockEffects = [{ id: 'effect-1' }, { id: 'effect-2' }];
    const filteredEffects = [{ id: 'effect-1' }];

    vi.mocked(moduleData.getSubEffectsForModule).mockReturnValue(mockEffects as never);
    vi.mocked(moduleData.filterByModuleRarity).mockReturnValue(filteredEffects as never);

    const result = getAvailablePoolEffects({
      moduleType: 'cannon',
      moduleRarity: 'epic',
      bannedEffectIds: [],
      lockedEffectIds: [],
    });

    expect(moduleData.filterByModuleRarity).toHaveBeenCalledWith(mockEffects, 'epic');
    expect(result).toEqual(filteredEffects);
  });
});

describe('getPoolInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns effect count and combination count', () => {
    const mockEffects = [{ id: 'effect-1' }, { id: 'effect-2' }, { id: 'effect-3' }];

    vi.mocked(moduleData.getSubEffectsForModule).mockReturnValue(mockEffects as never);
    vi.mocked(moduleData.filterByModuleRarity).mockReturnValue(mockEffects as never);
    vi.mocked(moduleData.countPoolCombinations).mockReturnValue(15);

    const result = getPoolInfo({
      moduleType: 'cannon',
      moduleRarity: 'legendary',
      bannedEffectIds: [],
      lockedEffectIds: [],
    });

    expect(result).toEqual({
      effectCount: 3,
      combinationCount: 15,
    });
  });

  it('excludes banned and locked effects from counts', () => {
    const mockEffects = [
      { id: 'effect-1' },
      { id: 'effect-2' },
      { id: 'effect-3' },
      { id: 'effect-4' },
    ];
    const filteredEffects = [{ id: 'effect-2' }, { id: 'effect-4' }];

    vi.mocked(moduleData.getSubEffectsForModule).mockReturnValue(mockEffects as never);
    vi.mocked(moduleData.filterByModuleRarity).mockImplementation((effects) => effects as never);
    vi.mocked(moduleData.countPoolCombinations).mockReturnValue(8);

    const result = getPoolInfo({
      moduleType: 'cannon',
      moduleRarity: 'legendary',
      bannedEffectIds: ['effect-1'],
      lockedEffectIds: ['effect-3'],
    });

    expect(result).toEqual({
      effectCount: 2,
      combinationCount: 8,
    });
    expect(moduleData.countPoolCombinations).toHaveBeenCalledWith(filteredEffects, 'legendary');
  });

  it('returns zero counts for empty pool', () => {
    vi.mocked(moduleData.getSubEffectsForModule).mockReturnValue([] as never);
    vi.mocked(moduleData.filterByModuleRarity).mockReturnValue([] as never);
    vi.mocked(moduleData.countPoolCombinations).mockReturnValue(0);

    const result = getPoolInfo({
      moduleType: 'cannon',
      moduleRarity: 'common',
      bannedEffectIds: [],
      lockedEffectIds: [],
    });

    expect(result).toEqual({
      effectCount: 0,
      combinationCount: 0,
    });
  });
});
