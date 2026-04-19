import { describe, it, expect } from 'vitest';
import {
  DAMAGE_FIELDS,
  COIN_FIELDS,
  DAMAGE_DEALT_CATEGORY,
  COINS_EARNED_CATEGORY,
  COIN_FIELD_ALIASES,
  DAMAGE_FIELD_ALIASES,
  buildFieldAliasMap,
} from './index';
import type { FieldConfig } from './types';

describe('Damage Fields Configuration', () => {
  it('lists all V3 damage sources', () => {
    expect(DAMAGE_FIELDS.length).toBeGreaterThanOrEqual(15);
  });

  it('has required properties for each field', () => {
    for (const field of DAMAGE_FIELDS) {
      expect(field.fieldName).toBeTruthy();
      expect(field.displayName).toBeTruthy();
      expect(field.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('has no duplicate field names', () => {
    const fieldNames = DAMAGE_FIELDS.map((f) => f.fieldName);
    expect(new Set(fieldNames).size).toBe(fieldNames.length);
  });

  it('uses V3 canonical <section>_<label> keys for all damage entries', () => {
    const bad = DAMAGE_FIELDS.filter(
      (f) => !/^(damage|healthRegenerated)_[a-zA-Z]+/.test(f.fieldName)
    );
    expect(bad, `Non-V3-canonical damage fields: ${bad.map((f) => f.fieldName).join(', ')}`).toEqual([]);
  });

  it('includes headline damage sources under the damage_ section', () => {
    const names = DAMAGE_FIELDS.map((f) => f.fieldName);
    expect(names).toContain('damage_deathWave');
    expect(names).toContain('damage_orbs');
    expect(names).toContain('damage_thorns');
    expect(names).toContain('damage_blackHole');
  });
});

describe('Coin Fields Configuration', () => {
  it('lists all V3 coin sources', () => {
    expect(COIN_FIELDS.length).toBeGreaterThanOrEqual(10);
  });

  it('has required properties for each field', () => {
    for (const field of COIN_FIELDS) {
      expect(field.fieldName).toBeTruthy();
      expect(field.displayName).toBeTruthy();
      expect(field.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('has no duplicate field names', () => {
    const fieldNames = COIN_FIELDS.map((f) => f.fieldName);
    expect(new Set(fieldNames).size).toBe(fieldNames.length);
  });

  it('uses V3 canonical coins_<label> keys for all coin entries', () => {
    const bad = COIN_FIELDS.filter((f) => !/^coins_[a-zA-Z]+/.test(f.fieldName));
    expect(bad, `Non-V3-canonical coin fields: ${bad.map((f) => f.fieldName).join(', ')}`).toEqual([]);
  });

  it('includes headline coin sources', () => {
    const names = COIN_FIELDS.map((f) => f.fieldName);
    expect(names).toContain('coins_deathWave');
    expect(names).toContain('coins_goldenTower');
    expect(names).toContain('coins_blackHole');
    expect(names).toContain('coins_orbs');
  });

  it('excludes V27-era guardian-specific coin fields (removed in V28)', () => {
    const names = COIN_FIELDS.map((f) => f.fieldName);
    expect(names).not.toContain('coinsStolen');
    expect(names).not.toContain('guardianCoinsStolen');
  });
});

describe('Damage Dealt Category', () => {
  it('has correct id', () => {
    expect(DAMAGE_DEALT_CATEGORY.id).toBe('damageDealt');
  });

  it('has correct name', () => {
    expect(DAMAGE_DEALT_CATEGORY.name).toBe('Damage Dealt');
  });

  it('has totalField set to damage_damageDealt (V3 canonical)', () => {
    expect(DAMAGE_DEALT_CATEGORY.totalField).toBe('damage_damageDealt');
  });

  it('has all damage fields', () => {
    expect(DAMAGE_DEALT_CATEGORY.fields).toBe(DAMAGE_FIELDS);
  });

  it('does not have perHourField', () => {
    expect(DAMAGE_DEALT_CATEGORY.perHourField).toBeUndefined();
  });
});

describe('Coins Earned Category', () => {
  it('has correct id', () => {
    expect(COINS_EARNED_CATEGORY.id).toBe('coinsEarned');
  });

  it('has correct name', () => {
    expect(COINS_EARNED_CATEGORY.name).toBe('Coins Earned');
  });

  it('has totalField set to battleReport_coinsEarned (V3 summary section)', () => {
    expect(COINS_EARNED_CATEGORY.totalField).toBe('battleReport_coinsEarned');
  });

  it('has perHourField set to battleReport_coinsPerHour', () => {
    expect(COINS_EARNED_CATEGORY.perHourField).toBe('battleReport_coinsPerHour');
  });

  it('has all coin fields', () => {
    expect(COINS_EARNED_CATEGORY.fields).toBe(COIN_FIELDS);
  });
});

describe('Field Alias Maps', () => {
  it('coin aliases are empty in V3 — legacy names are handled by the V2->V3 remap upstream', () => {
    expect(COIN_FIELD_ALIASES).toEqual({});
  });

  it('damage aliases are empty', () => {
    expect(DAMAGE_FIELD_ALIASES).toEqual({});
  });

  describe('buildFieldAliasMap', () => {
    it('returns empty object for fields without aliases', () => {
      const fields: FieldConfig[] = [
        { fieldName: 'test1', displayName: 'Test 1', color: '#000000' },
        { fieldName: 'test2', displayName: 'Test 2', color: '#ffffff' },
      ];
      expect(buildFieldAliasMap(fields)).toEqual({});
    });

    it('includes only fields with aliases', () => {
      const fields: FieldConfig[] = [
        { fieldName: 'test1', displayName: 'Test 1', color: '#000000' },
        {
          fieldName: 'test2',
          displayName: 'Test 2',
          color: '#ffffff',
          aliases: ['alias2'],
        },
        { fieldName: 'test3', displayName: 'Test 3', color: '#aaaaaa' },
      ];
      expect(buildFieldAliasMap(fields)).toEqual({ test2: ['alias2'] });
    });

    it('handles multiple aliases per field', () => {
      const fields: FieldConfig[] = [
        {
          fieldName: 'test',
          displayName: 'Test',
          color: '#000000',
          aliases: ['alias1', 'alias2'],
        },
      ];
      expect(buildFieldAliasMap(fields)).toEqual({
        test: ['alias1', 'alias2'],
      });
    });
  });
});
