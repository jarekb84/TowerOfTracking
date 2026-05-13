import { describe, expect, it } from 'vitest';
import type { GameRunField } from '@/shared/types/game-run.types';
import { remapV2FieldKeys } from './remap-v2-field-keys';

function field(raw: string): GameRunField {
  return {
    value: raw,
    rawValue: raw,
    displayValue: raw,
    originalKey: raw,
    dataType: 'string',
  };
}

describe('remapV2FieldKeys', () => {
  it('renames v2 keys to v3 canonical via the graph RENAMED_FROM edges', () => {
    const result = remapV2FieldKeys({
      tier: field('12'),
      coinsEarned: field('228T'),
    });
    expect(Object.keys(result).sort()).toEqual([
      'battleReport_coinsEarned',
      'battleReport_tier',
    ]);
    expect(result.battleReport_tier.rawValue).toBe('12');
    expect(result.battleReport_coinsEarned.rawValue).toBe('228T');
  });

  it('passes internal fields through unchanged', () => {
    const result = remapV2FieldKeys({
      _date: field('2026-04-11'),
      _time: field('12:00'),
      _notes: field('hello'),
    });
    expect(result._date.rawValue).toBe('2026-04-11');
    expect(result._time.rawValue).toBe('12:00');
    expect(result._notes.rawValue).toBe('hello');
  });

  it('drops intentionally-dropped v2 keys', () => {
    const result = remapV2FieldKeys({
      tier: field('12'),
      coinsStolen: field('999'), // V27 guardian feature removed
      damageGainFromBerserk: field('100'),
    });
    expect('coinsStolen' in result).toBe(false);
    expect('damageGainFromBerserk' in result).toBe(false);
    expect('battleReport_tier' in result).toBe(true);
  });

  it('collapses duplicate-target v2 keys with last-non-empty wins', () => {
    // Both coinsFromOrb and coinsFromOrbs map to coins_orbs.
    const first = remapV2FieldKeys({
      coinsFromOrb: field('100'),
      coinsFromOrbs: field('200'),
    });
    expect(first.coins_orbs.rawValue).toBe('200');

    const second = remapV2FieldKeys({
      coinsFromOrb: field('100'),
      coinsFromOrbs: field(''),
    });
    expect(second.coins_orbs.rawValue).toBe('100');
  });

  it('preserves unknown keys verbatim (caller decides how to surface)', () => {
    const result = remapV2FieldKeys({
      myCustomColumn: field('x'),
    });
    expect(result.myCustomColumn.rawValue).toBe('x');
  });
});
