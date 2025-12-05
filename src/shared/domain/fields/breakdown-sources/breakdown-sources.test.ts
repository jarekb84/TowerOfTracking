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
  it('should have 16 damage sources', () => {
    expect(DAMAGE_FIELDS).toHaveLength(16);
  });

  it('should have all required properties for each field', () => {
    for (const field of DAMAGE_FIELDS) {
      expect(field.fieldName).toBeTruthy();
      expect(field.displayName).toBeTruthy();
      expect(field.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('should have no duplicate field names', () => {
    const fieldNames = DAMAGE_FIELDS.map((f) => f.fieldName);
    const uniqueNames = new Set(fieldNames);
    expect(uniqueNames.size).toBe(fieldNames.length);
  });

  it('should include Guardian Damage (damage field)', () => {
    const guardianDamage = DAMAGE_FIELDS.find((f) => f.fieldName === 'damage');
    expect(guardianDamage).toBeDefined();
    expect(guardianDamage?.displayName).toBe('Guardian Damage');
  });

  it('should use clean display names without suffixes', () => {
    const deathWave = DAMAGE_FIELDS.find(
      (f) => f.fieldName === 'deathWaveDamage'
    );
    expect(deathWave?.displayName).toBe('Death Wave');

    const orb = DAMAGE_FIELDS.find((f) => f.fieldName === 'orbDamage');
    expect(orb?.displayName).toBe('Orb');
  });
});

describe('Coin Fields Configuration', () => {
  it('should have 11 coin sources', () => {
    expect(COIN_FIELDS).toHaveLength(11);
  });

  it('should have all required properties for each field', () => {
    for (const field of COIN_FIELDS) {
      expect(field.fieldName).toBeTruthy();
      expect(field.displayName).toBeTruthy();
      expect(field.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('should have no duplicate field names', () => {
    const fieldNames = COIN_FIELDS.map((f) => f.fieldName);
    const uniqueNames = new Set(fieldNames);
    expect(uniqueNames.size).toBe(fieldNames.length);
  });

  it('should include guardianCoinsStolen', () => {
    const guardianStolen = COIN_FIELDS.find(
      (f) => f.fieldName === 'guardianCoinsStolen'
    );
    expect(guardianStolen).toBeDefined();
    expect(guardianStolen?.displayName).toBe('Guardian Stolen');
  });

  it('should include coinsStolen', () => {
    const coinsStolen = COIN_FIELDS.find((f) => f.fieldName === 'coinsStolen');
    expect(coinsStolen).toBeDefined();
    expect(coinsStolen?.displayName).toBe('Coins Stolen');
  });

  it('should include coinsFromOrbs', () => {
    const coinsFromOrbs = COIN_FIELDS.find(
      (f) => f.fieldName === 'coinsFromOrb'
    );
    expect(coinsFromOrbs).toBeDefined();
    expect(coinsFromOrbs?.displayName).toBe('Orbs');
  });

  it('should have alias for coinsFromBlackHole (casing variation)', () => {
    const blackHole = COIN_FIELDS.find(
      (f) => f.fieldName === 'coinsFromBlackHole'
    );
    expect(blackHole?.aliases).toContain('coinsFromBlackhole');
  });

  it('should have alias for coinsFromOrbs (singular variation)', () => {
    const orbs = COIN_FIELDS.find((f) => f.fieldName === 'coinsFromOrb');
    expect(orbs?.aliases).toContain('coinsFromOrbs');
  });

  it('should NOT have cashFromGoldenTower as an alias (separate currency)', () => {
    const goldenTower = COIN_FIELDS.find(
      (f) => f.fieldName === 'coinsFromGoldenTower'
    );
    expect(goldenTower?.aliases).toBeUndefined();
  });
});

describe('Damage Dealt Category', () => {
  it('should have correct id', () => {
    expect(DAMAGE_DEALT_CATEGORY.id).toBe('damageDealt');
  });

  it('should have correct name', () => {
    expect(DAMAGE_DEALT_CATEGORY.name).toBe('Damage Dealt');
  });

  it('should have totalField set to damageDealt', () => {
    expect(DAMAGE_DEALT_CATEGORY.totalField).toBe('damageDealt');
  });

  it('should have all damage fields', () => {
    expect(DAMAGE_DEALT_CATEGORY.fields).toHaveLength(16);
  });

  it('should not have perHourField', () => {
    expect(DAMAGE_DEALT_CATEGORY.perHourField).toBeUndefined();
  });
});

describe('Coins Earned Category', () => {
  it('should have correct id', () => {
    expect(COINS_EARNED_CATEGORY.id).toBe('coinsEarned');
  });

  it('should have correct name', () => {
    expect(COINS_EARNED_CATEGORY.name).toBe('Coins Earned');
  });

  it('should have totalField set to coinsEarned', () => {
    expect(COINS_EARNED_CATEGORY.totalField).toBe('coinsEarned');
  });

  it('should have perHourField set to coinsPerHour', () => {
    expect(COINS_EARNED_CATEGORY.perHourField).toBe('coinsPerHour');
  });

  it('should have all coin fields', () => {
    expect(COINS_EARNED_CATEGORY.fields).toHaveLength(11);
  });
});

describe('Field Alias Maps', () => {
  it('should build coin aliases correctly', () => {
    expect(COIN_FIELD_ALIASES).toEqual({
      coinsFromBlackHole: ['coinsFromBlackhole'],
      coinsFromOrb: ['coinsFromOrbs'],
    });
  });

  it('should have empty damage aliases (no aliases defined)', () => {
    expect(DAMAGE_FIELD_ALIASES).toEqual({});
  });

  describe('buildFieldAliasMap', () => {
    it('should return empty object for fields without aliases', () => {
      const fields: FieldConfig[] = [
        { fieldName: 'test1', displayName: 'Test 1', color: '#000000' },
        { fieldName: 'test2', displayName: 'Test 2', color: '#ffffff' },
      ];
      expect(buildFieldAliasMap(fields)).toEqual({});
    });

    it('should include only fields with aliases', () => {
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
      expect(buildFieldAliasMap(fields)).toEqual({
        test2: ['alias2'],
      });
    });

    it('should handle multiple aliases per field', () => {
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
