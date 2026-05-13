import { describe, expect, it } from 'vitest';
import { detectStorageVersion } from './storage-version-detection';

describe('detectStorageVersion', () => {
  it('returns empty for null, undefined, empty, and whitespace input', () => {
    expect(detectStorageVersion(null)).toBe('empty');
    expect(detectStorageVersion(undefined)).toBe('empty');
    expect(detectStorageVersion('')).toBe('empty');
    expect(detectStorageVersion('   \n\t  ')).toBe('empty');
  });

  it('returns v3 when any header carries the v3_ prefix', () => {
    expect(
      detectStorageVersion('_Date\t_Time\tv3_battleReport_tier\n2026-04-11\t12:00:00\t12')
    ).toBe('v3');
  });

  it('returns legacy for v2-style headers', () => {
    expect(
      detectStorageVersion('_Date\t_Time\tTier\tCoins Earned\n2026-04-11\t12:00:00\t12\t228T')
    ).toBe('legacy');
  });

  it('returns legacy for v1-style headers (no underscore prefix)', () => {
    expect(detectStorageVersion('Date\tTime\tTier\tCoins Earned\n2026-04-11\t12:00:00\t12\t228T')).toBe('legacy');
  });

  it('treats a single header line with v3_ prefix as v3 even with no data rows', () => {
    expect(detectStorageVersion('_Date\tv3_battleReport_tier')).toBe('v3');
  });
});
