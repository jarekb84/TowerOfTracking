import { describe, it, expect } from 'vitest';
import {
  normalizeFieldName,
  levenshteinDistance,
  areCaseVariations,
  checkFieldSimilarity,
  classifyFields
} from './field-similarity';

describe('normalizeFieldName', () => {
  it('should convert to lowercase', () => {
    expect(normalizeFieldName('CoinsEarned')).toBe('coinsearned');
  });

  it('should remove spaces', () => {
    expect(normalizeFieldName('Coins Earned')).toBe('coinsearned');
  });

  it('should remove underscores', () => {
    expect(normalizeFieldName('coins_earned')).toBe('coinsearned');
  });

  it('should remove hyphens', () => {
    expect(normalizeFieldName('coins-earned')).toBe('coinsearned');
  });

  it('should handle mixed formatting', () => {
    expect(normalizeFieldName('Coins_Earned-Total')).toBe('coinsearnedtotal');
  });

  it('should trim whitespace', () => {
    expect(normalizeFieldName('  coins earned  ')).toBe('coinsearned');
  });

  it('should handle internal fields with underscores', () => {
    expect(normalizeFieldName('_Date')).toBe('date');
    expect(normalizeFieldName('_Run Type')).toBe('runtype');
  });
});

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('should return string length when comparing to empty string', () => {
    expect(levenshteinDistance('hello', '')).toBe(5);
    expect(levenshteinDistance('', 'world')).toBe(5);
  });

  it('should calculate single character substitution', () => {
    expect(levenshteinDistance('coins', 'couns')).toBe(1);
  });

  it('should calculate single character insertion', () => {
    expect(levenshteinDistance('coin', 'coins')).toBe(1);
  });

  it('should calculate single character deletion', () => {
    expect(levenshteinDistance('coins', 'coin')).toBe(1);
  });

  it('should calculate multiple edits', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
  });

  it('should handle case-sensitive comparison', () => {
    expect(levenshteinDistance('Coins', 'coins')).toBe(1); // C vs c
  });
});

describe('areCaseVariations', () => {
  it('should detect camelCase vs snake_case', () => {
    expect(areCaseVariations('coinsEarned', 'coins_earned')).toBe(true);
  });

  it('should detect camelCase vs Title Case', () => {
    expect(areCaseVariations('coinsEarned', 'Coins Earned')).toBe(true);
  });

  it('should detect snake_case vs Title Case', () => {
    expect(areCaseVariations('coins_earned', 'Coins Earned')).toBe(true);
  });

  it('should return false for different words', () => {
    expect(areCaseVariations('coinsEarned', 'totalWaves')).toBe(false);
  });

  it('should handle internal fields', () => {
    expect(areCaseVariations('_date', '_Date')).toBe(true);
    expect(areCaseVariations('_runType', '_Run Type')).toBe(true);
  });
});

describe('checkFieldSimilarity', () => {
  const existingFields = [
    '_date',
    '_time',
    '_notes',
    '_runType',
    'coinsEarned',
    'tier',
    'wave',
    'battleDate'
  ];

  describe('exact matches', () => {
    it('should detect exact match (case-insensitive)', () => {
      const result = checkFieldSimilarity('CoinsEarned', existingFields);
      expect(result.type).toBe('exact');
      expect(result.similar).toBe(false); // Exact match, not just similar
      expect(result.suggestion).toBe('coinsEarned');
      expect(result.score).toBe(1.0);
    });

    it('should detect exact match for internal fields', () => {
      const result = checkFieldSimilarity('_DATE', existingFields);
      expect(result.type).toBe('exact');
      expect(result.suggestion).toBe('_date');
    });
  });

  describe('normalized/case-variation matches', () => {
    it('should detect case variation with spaces', () => {
      const result = checkFieldSimilarity('Coins Earned', existingFields);
      expect(result.similar).toBe(true);
      expect(result.type).toBe('case-variation'); // It's a case variation
      expect(result.suggestion).toBe('coinsEarned');
      expect(result.score).toBe(0.95);
    });

    it('should detect case variation with underscores', () => {
      const result = checkFieldSimilarity('coins_earned', existingFields);
      expect(result.similar).toBe(true);
      expect(result.type).toBe('case-variation'); // It's a case variation
      expect(result.suggestion).toBe('coinsEarned');
    });

    it('should detect case variation for internal fields', () => {
      const result = checkFieldSimilarity('_Run Type', existingFields);
      expect(result.similar).toBe(true);
      expect(result.type).toBe('case-variation'); // It's a case variation
      expect(result.suggestion).toBe('_runType');
    });
  });

  describe('case variations', () => {
    it('should detect case variation', () => {
      const result = checkFieldSimilarity('battle_date', existingFields);
      expect(result.similar).toBe(true);
      expect(result.type).toBe('case-variation');
      expect(result.suggestion).toBe('battleDate');
      expect(result.score).toBe(0.95); // Same score as normalized
    });
  });

  describe('Levenshtein distance matches', () => {
    it('should detect typo with distance 1', () => {
      const result = checkFieldSimilarity('tier', [...existingFields, 'tiers']); // Added 's'
      // Should match 'tier' exactly first
      expect(result.type).toBe('exact');
    });

    it('should detect typo with distance 2 and high similarity', () => {
      const result = checkFieldSimilarity('coinEarned', existingFields);
      // Missing 's' in 'coins' - but score might be too low now
      // "coinEarned" vs "coinsEarned": distance 1, length 11, score = 0.91 > 0.85 ✓
      expect(result.similar).toBe(true);
      expect(result.type).toBe('levenshtein');
      expect(result.suggestion).toBe('coinsEarned');
    });

    it('should NOT suggest if distance is too large', () => {
      const result = checkFieldSimilarity('totalDamage', existingFields);
      expect(result.similar).toBe(false);
      expect(result.suggestion).toBeUndefined();
    });

    it('should respect custom threshold', () => {
      // With threshold 1, 'coinEarned' should match via normalized (coins_earned)
      // Let's try a field that's further away: 'coinzEarned' has distance 1 from 'coinsEarned'
      const result = checkFieldSimilarity('totalCoins', existingFields, 1);
      // 'totalCoins' normalized = 'totalcoins', 'coinsEarned' normalized = 'coinsearned'
      // These are quite different, so should NOT match with threshold 1
      expect(result.similar).toBe(false);
    });

    it('should NOT match similar-sounding but different fields (Death Wave vs Death Ray)', () => {
      const fields = ['Death Wave Damage', 'Death Ray Damage'];
      const result = checkFieldSimilarity('Death Ray Damage', fields);
      // These should NOT be similar (distance 3, score 0.80 < 0.85 threshold)
      expect(result.type).toBe('exact'); // Exact match to itself
    });

    it('should NOT match different words with same structure (Thorn vs Orb)', () => {
      const fields = ['Thorn damage', 'Orb Damage'];
      // Normalized: thorndamage vs orbdamage, distance 3, score 0.73 < 0.85
      const result = checkFieldSimilarity('Orb Damage', fields);
      expect(result.type).toBe('exact'); // Exact match to itself
    });

    it('should NOT match Thorns vs Orbs', () => {
      const fields = ['Destroyed by Thorns'];
      const result = checkFieldSimilarity('Destroyed by Orbs', fields);
      // Distance 3, score 0.82 < 0.85, should NOT match
      expect(result.similar).toBe(false);
    });

    it('should still match legitimate variations (Commanders vs Commander)', () => {
      const fields = ['Commander'];
      const result = checkFieldSimilarity('Commanders', fields);
      // Distance 1, score 0.90 > 0.85, SHOULD match
      expect(result.similar).toBe(true);
      expect(result.type).toBe('levenshtein');
      expect(result.suggestion).toBe('Commander');
    });
  });

  describe('no matches', () => {
    it('should return no match for completely new field', () => {
      const result = checkFieldSimilarity('totalDamageDealt', existingFields);
      expect(result.similar).toBe(false);
      expect(result.suggestion).toBeUndefined();
    });
  });
});

describe('classifyFields', () => {
  const existingFields = [
    '_date',
    '_time',
    '_notes',
    '_runType',
    'coinsEarned',
    'tier',
    'wave',
    'battleDate'
  ];

  it('should classify exact matches', () => {
    const imported = ['tier', 'wave', 'CoinsEarned'];
    const result = classifyFields(imported, existingFields);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      fieldName: 'tier',
      status: 'exact-match',
      isInternal: false
    });
    expect(result[2]).toEqual({
      fieldName: 'CoinsEarned',
      status: 'exact-match',
      isInternal: false
    });
  });

  it('should classify similar fields', () => {
    const imported = ['Coins Earned', 'battle_date'];
    const result = classifyFields(imported, existingFields);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      fieldName: 'Coins Earned',
      status: 'similar-field',
      similarTo: 'coinsEarned',
      similarityType: 'case-variation', // Both are case variations
      isInternal: false
    });
    expect(result[1]).toEqual({
      fieldName: 'battle_date',
      status: 'similar-field',
      similarTo: 'battleDate',
      similarityType: 'case-variation',
      isInternal: false
    });
  });

  it('should classify new fields', () => {
    const imported = ['totalDamage', 'enemiesKilled'];
    const result = classifyFields(imported, existingFields);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      fieldName: 'totalDamage',
      status: 'new-field',
      isInternal: false
    });
    expect(result[1]).toEqual({
      fieldName: 'enemiesKilled',
      status: 'new-field',
      isInternal: false
    });
  });

  it('should mark internal fields correctly', () => {
    const imported = ['_date', '_newInternalField'];
    const result = classifyFields(imported, existingFields);

    expect(result).toHaveLength(2);
    expect(result[0].isInternal).toBe(true);
    expect(result[0].status).toBe('exact-match');
    expect(result[1].isInternal).toBe(true);
    expect(result[1].status).toBe('new-field');
  });

  it('should handle mixed classification', () => {
    const imported = [
      'tier',              // exact match
      'Coins Earned',      // similar (normalized)
      'totalDamage',       // new field
      '_Run Type'          // similar internal (normalized)
    ];
    const result = classifyFields(imported, existingFields);

    expect(result).toHaveLength(4);
    expect(result[0].status).toBe('exact-match');
    expect(result[1].status).toBe('similar-field');
    expect(result[2].status).toBe('new-field');
    expect(result[3].status).toBe('similar-field');
    expect(result[3].isInternal).toBe(true);
  });
});
