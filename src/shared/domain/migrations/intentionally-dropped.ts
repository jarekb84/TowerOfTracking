// V2 fields that are intentionally NOT carried forward to V3.
//
// These columns existed in some V2 exports but have no V28 counterpart
// (removed feature, merged into an aggregate, or too ambiguous to resolve
// without losing data integrity). The inverse-check test requires every V2
// field to either resolve through the field graph (RENAMED_FROM) or here —
// if a V2 field is
// in neither, the test fails.

export const INTENTIONALLY_DROPPED_V2_FIELDS: Record<string, string> = {
  // V27 Guardian feature — the Guardian unit was removed in V28.
  coinsStolen: 'V27 Guardian feature removed in V28',
  guardianCatches: 'V27 Guardian feature removed in V28',
  guardianCoinsStolen: 'V27 Guardian feature removed in V28',

  // V27 Berserk mechanic — replaced by new damage model in V28.
  damageGainFromBerserk: 'V27 Berserk mechanic removed in V28',
  damageTakenWhileBerserked: 'V27 Berserk mechanic removed in V28',

  // V27 elite tracking merged into totalEnemies breakdown in V28.
  totalElites: 'Merged into totalEnemies breakdown in V28',

  // Aggregate that is trivially reconstructed from tower + wall in V28.
  damageTaken: 'Aggregate; reconstruct from damageTaken_tower + damageTaken_wall',
};
