// Hand-authored V2 -> V3 field map.
//
// STATUS: best-effort draft — needs human domain review.
// Open `v2-to-v3-field-map.generated.ts` to see each V2 field's candidates
// with disambiguation hints: "(seen in N/6)" presence count and
// "[LAST in: <file>]" markers. For any V2 field where two or more V28
// candidates existed, the hand-authored value below is a GUESS. When the
// reviewer has time, walk the generated file and override here.
//
// Why it's ambiguous: V2 storage is a flat key/value map. When users
// imported V28 exports through the old parser during the transition window,
// repeated labels (e.g. "Black Hole" appearing in Damage, Coins, Enemies
// Hit By, Enemies Destroyed By) collapsed under last-write-wins. A given
// V2 column can therefore hold:
//   - V27-era value  (pure V27 run; single-section meaning)
//   - V28 last-in-file value (V28 run shoehorned through V27 parser)
// and there is no column-level signal to tell them apart. The mapping
// picks ONE interpretation; wrong rows are recoverable from the raw
// pre-migration backup the gate preserves.
//
// This file is the AUTHORITATIVE mapping used by the runtime migration.
// Every value must exist in sampleData/supportedFields.json (enforced by
// inverse-check test). Do not import from the .generated file in app code.
//
// Initial draft heuristic:
// - Bare effect names (Black Hole, Death Wave, Projectiles, ...) ->
//   enemiesHitBy_<effect> because V2 tracked hit counts there. Damage
//   columns (`<Effect> Damage`) -> damage_<effect>.
// - Effects without a separate "<effect> Damage" column in V2 (Electrons,
//   Rend Armor) tracked damage directly; bare -> damage_<effect>.
// - Coins Earned, Cells Earned -> battleReport_* (summary section).
// - Golden Tower, Golden Bot, Spotlight (bare) -> killedWithEffectActive_*
//   because V2 had separate `Coins From <X>` and `Cash From <X>` columns.
// - V27 guardian features (coinsStolen, guardianCatches, guardianCoinsStolen)
//   -> intentionally-dropped.ts (feature removed in V28).
// - Multiple V2 spellings for the same concept (coinsFromOrb/coinsFromOrbs,
//   coinsFromBlackhole/coinsFromBlackHole, taggedByDeathwave/taggedByDeathWave)
//   all map to the same V3 key. Last non-empty value wins at migration time.

export const V2_TO_V3_FIELD_MAP: Record<string, string> = {
  // --- Battle Report (summary fields) ---
  battleDate: 'battleReport_battleDate',
  tier: 'battleReport_tier',
  wave: 'battleReport_wave',
  killedBy: 'battleReport_killedBy',
  gameTime: 'battleReport_gameTime',
  realTime: 'battleReport_realTime',
  coinsEarned: 'battleReport_coinsEarned',
  coinsPerHour: 'battleReport_coinsPerHour',
  cellsEarned: 'battleReport_cellsEarned',
  cellsPerHour: 'battleReport_cellsPerHour',

  // --- Currencies ---
  adGems: 'currencies_adGems',
  armorShards: 'currencies_armorShards',
  cannonShards: 'currencies_cannonShards',
  commonModules: 'currencies_commonModules',
  coreShards: 'currencies_coreShards',
  fetchGems: 'currencies_fetchGems',
  gemBlocksTapped: 'currencies_gemBlocksTapped',
  gems: 'currencies_gems',
  generatorShards: 'currencies_generatorShards',
  medals: 'currencies_medals',
  rareModules: 'currencies_rareModules',
  rerollShards: 'currencies_rerollShardsEarned', // V2 pre-v27 legacy; later split into earned/fetched
  rerollShardsEarned: 'currencies_rerollShardsEarned',
  rerollShardsFetched: 'currencies_rerollShardsFetched',

  // --- Cash ---
  cashEarned: 'cash_cashEarned',
  cashFromGoldenTower: 'cash_goldenTower',
  interestEarned: 'cash_interestEarned',

  // --- Coins ---
  bountyCoins: 'coins_bountyCoins',
  coinBonusUpgrade: 'coins_coinBonusUpgrade',
  coinsFromCoinUpgrade: 'coins_coinBonusUpgrade', // legacy alias
  coinsFromCoinBonuses: 'coins_coinsFromCoinBonuses',
  coinsWave: 'coins_coinsWave',
  coinsFetched: 'coins_coinsFetched',
  coinsFromBlackHole: 'coins_blackHole',
  coinsFromBlackhole: 'coins_blackHole', // lowercase-h spelling variant
  coinsFromDeathWave: 'coins_deathWave',
  coinsFromGoldenTower: 'coins_goldenTower',
  coinsFromOrb: 'coins_orbs', // singular legacy
  coinsFromOrbs: 'coins_orbs',
  coinsFromSpotlight: 'coins_spotlight',
  criticalCoin: 'coins_criticalCoin',
  goldenBotCoinsEarned: 'coins_goldenBot',
  goldenCombo: 'coins_goldenCombo',
  waveSkip: 'coins_waveSkip',

  // --- Damage (dealt) ---
  damage: 'damage_damageDealt', // legacy alias; same metric as damageDealt
  damageDealt: 'damage_damageDealt',
  projectilesDamage: 'damage_projectiles',
  rendArmorDamage: 'damage_rendArmor',
  rendArmor: 'damage_rendArmor', // V2 bare; V28 has no enemiesHitBy_rendArmor
  deathRayDamage: 'damage_deathRay',
  thornDamage: 'damage_thorns',
  orbDamage: 'damage_orbs',
  landMineDamage: 'damage_landMines',
  innerLandMineDamage: 'damage_innerLandMines',
  chainLightningDamage: 'damage_chainLightning',
  smartMissileDamage: 'damage_smartMissiles',
  blackHoleDamage: 'damage_blackHole',
  swampDamage: 'damage_poisonSwamp',
  electronsDamage: 'damage_electrons',
  electrons: 'damage_electrons', // V2 bare; V28 has no enemiesHitBy_electrons
  flameBotDamage: 'damage_flameBot',
  deathWaveDamage: 'damage_deathWave',

  // --- Damage Blocked ---
  defense: 'damageBlocked_defense',
  defenseAbsolute: 'damageBlocked_defenseAbsolute',
  chronoField: 'damageBlocked_chronoField',
  chainThunder: 'damageBlocked_chainThunder',
  primordialCollapse: 'damageBlocked_primordialCollapse',
  negativeMassProjector: 'damageBlocked_negativeMassProjector',

  // --- Damage Taken ---
  tower: 'damageTaken_tower',
  wall: 'damageTaken_wall',
  damageTakenWall: 'damageTaken_wall', // legacy alias

  // --- Health Regenerated ---
  lifesteal: 'healthRegenerated_lifesteal',
  towerHealthRegen: 'healthRegenerated_towerHealthRegen',
  wallHealthRegen: 'healthRegenerated_wallHealthRegen',

  // --- Bonus Health Gained ---
  fromDeathWave: 'bonusHealthGained_fromDeathWave',
  hpFromDeathWave: 'bonusHealthGained_fromDeathWave', // duplicate legacy name

  // --- Enemies Hit By ---
  attackChip: 'enemiesHitBy_attackChip',
  blackHole: 'enemiesHitBy_blackHole',
  chainLightning: 'enemiesHitBy_chainLightning',
  deathRay: 'enemiesHitBy_deathRay',
  deathWave: 'enemiesHitBy_deathWave',
  flameBot: 'enemiesHitBy_flameBot',
  innerLandMines: 'enemiesHitBy_innerLandMines',
  landMines: 'enemiesHitBy_landMines',
  orbitalAugment: 'enemiesHitBy_orbitalAugment',
  orbs: 'enemiesHitBy_orbs',
  enemiesHitByOrbs: 'enemiesHitBy_orbs', // duplicate legacy
  orbHits: 'enemiesHitBy_orbs', // duplicate legacy
  poisonSwamp: 'enemiesHitBy_poisonSwamp',
  projectiles: 'enemiesHitBy_projectiles',
  smartMissiles: 'enemiesHitBy_smartMissiles',
  thorns: 'enemiesHitBy_thorns',
  thunderBot: 'enemiesHitBy_thunderBot',

  // --- Enemies Destroyed By ---
  destroyedByDeathRay: 'enemiesDestroyedBy_deathRay',
  destroyedByLandMine: 'enemiesDestroyedBy_landMines',
  destroyedByOrbs: 'enemiesDestroyedBy_orbs',
  destroyedByThorns: 'enemiesDestroyedBy_thorns',
  other: 'enemiesDestroyedBy_other',

  // --- Killed With Effect Active ---
  amplifyBot: 'killedWithEffectActive_amplifyBot',
  deathPenalty: 'killedWithEffectActive_deathPenalty',
  taggedByDeathWave: 'killedWithEffectActive_deathWave',
  taggedByDeathwave: 'killedWithEffectActive_deathWave', // lowercase-w variant
  goldenBot: 'killedWithEffectActive_goldenBot',
  goldenTower: 'killedWithEffectActive_goldenTower',
  spotlight: 'killedWithEffectActive_spotlight',
  destroyedInGoldenBot: 'killedWithEffectActive_goldenBot', // legacy alt name
  destroyedInSpotlight: 'killedWithEffectActive_spotlight', // legacy alt name

  // --- Counts ---
  deathDefy: 'counts_deathDefy',
  demonMode: 'counts_demonMode',
  hitsAbsorbedByEnergyShield: 'counts_hitsAbsorbedByEnergyShield',
  landMinesSpawned: 'counts_landMinesSpawned',
  nuke: 'counts_nuke',
  projectilesCount: 'counts_projectilesCount',
  secondWind: 'counts_secondWind',
  thunderBotStuns: 'counts_thunderBotStuns',
  wavesSkipped: 'counts_wavesSkipped',

  // --- Utility ---
  enemyAttackLevelsSkipped: 'utility_enemyAttackLevelsSkipped',
  enemyHealthLevelsSkipped: 'utility_enemyHealthLevelsSkipped',
  freeAttackUpgrade: 'utility_freeAttackUpgrade',
  freeDefenseUpgrade: 'utility_freeDefenseUpgrade',
  freeUtilityUpgrade: 'utility_freeUtilityUpgrade',
  recoveryPackages: 'utility_recoveryPackages',

  // --- Records ---
  highestCoinsMinute: 'records_highestCoinsMinute',
  largestGoldenCombo: 'records_largestGoldenCombo',
  largestInnerLandmineCharge: 'records_largestInnerLandmineCharge',
  largestSmartMissileStack: 'records_largestSmartMissileStack',
  largestWaveSkip: 'records_largestWaveSkip',
  mostCellsFromWaveSkip: 'records_mostCellsFromWaveSkip',
  mostCoinsFromGoldenCombo: 'records_mostCoinsFromGoldenCombo',
  mostCoinsFromWaveSkip: 'records_mostCoinsFromWaveSkip',

  // --- Total Enemies ---
  basic: 'totalEnemies_basic',
  boss: 'totalEnemies_boss',
  commander: 'totalEnemies_commander',
  commanders: 'totalEnemies_commander', // plural legacy
  fast: 'totalEnemies_fast',
  overcharge: 'totalEnemies_overcharge',
  overcharges: 'totalEnemies_overcharge', // plural legacy
  protector: 'totalEnemies_protector',
  ranged: 'totalEnemies_ranged',
  rays: 'totalEnemies_rays',
  saboteur: 'totalEnemies_saboteur',
  saboteurs: 'totalEnemies_saboteur', // plural legacy
  scatters: 'totalEnemies_scatters',
  summonedEnemies: 'totalEnemies_summonedEnemies',
  tank: 'totalEnemies_tank',
  totalEnemies: 'totalEnemies_totalEnemies',
  vampires: 'totalEnemies_vampires',
};
