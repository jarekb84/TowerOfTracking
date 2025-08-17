// Raw data structure as pasted from clipboard (flexible to handle any property names)
export type RawGameRunData = Record<string, string>;

// CamelCase version of raw data for internal use
export interface CamelCaseGameRunData {
  gameTime: string;
  realTime: string;
  tier: string;
  wave: string;
  killedBy: string;
  coinsEarned: string;
  cashEarned: string;
  interestEarned: string;
  gemBlocksTapped: string;
  cellsEarned: string;
  rerollShardsEarned: string;
  damageTaken: string;
  damageTakenWall: string;
  damageTakenWhileBerserked: string;
  damageGainFromBerserk: string;
  deathDefy: string;
  damageDealt: string;
  projectilesDamage: string;
  rendArmorDamage: string;
  projectilesCount: string;
  lifesteal: string;
  thornDamage: string;
  orbDamage: string;
  orbHits: string;
  landMineDamage: string;
  landMinesSpawned: string;
  deathRayDamage: string;
  smartMissileDamage: string;
  innerLandMineDamage: string;
  chainLightningDamage: string;
  deathWaveDamage: string;
  swampDamage: string;
  blackHoleDamage: string;
  wavesSkipped: string;
  recoveryPackages: string;
  freeAttackUpgrade: string;
  freeDefenseUpgrade: string;
  freeUtilityUpgrade: string;
  hpFromDeathWave: string;
  coinsFromDeathWave: string;
  cashFromGoldenTower: string;
  coinsFromGoldenTower: string;
  coinsFromBlackhole: string;
  coinsFromSpotlight: string;
  coinsFromOrbs: string;
  coinsFromCoinUpgrade: string;
  coinsFromCoinBonuses: string;
  totalEnemies: string;
  basic: string;
  fast: string;
  tank: string;
  ranged: string;
  boss: string;
  protector: string;
  totalElites: string;
  vampires: string;
  rays: string;
  scatters: string;
  saboteurs: string;
  commanders: string;
  overcharges: string;
  destroyedByOrbs: string;
  destroyedByThorns: string;
  destroyedByDeathRay: string;
  destroyedByLandMine: string;
  flameBotDamage: string;
  thunderBotStuns: string;
  goldenBotCoinsEarned: string;
  damage: string;
  coinsStolen: string;
  guardianCatches: string;
  coinsFetched: string;
  gems: string;
  medals: string;
  rerollShards: string;
  cannonShards: string;
  armorShards: string;
  generatorShards: string;
  coreShards: string;
  commonModules: string;
  rareModules: string;
  notes: string;
}

// Processed data for analytics (parsed numbers, durations, etc.)
export interface ProcessedGameRunData {
  gameTime: number; // in seconds
  realTime: number; // in seconds
  tier: number;
  wave: number;
  killedBy: string;
  coinsEarned: number;
  cashEarned: number;
  interestEarned: number;
  gemBlocksTapped: number;
  cellsEarned: number;
  rerollShardsEarned: number;
  damageTaken: number;
  damageTakenWall: number;
  damageTakenWhileBerserked: number;
  damageGainFromBerserk: number;
  deathDefy: number;
  damageDealt: number;
  projectilesDamage: number;
  rendArmorDamage: number;
  projectilesCount: number;
  lifesteal: number;
  thornDamage: number;
  orbDamage: number;
  orbHits: number;
  landMineDamage: number;
  landMinesSpawned: number;
  deathRayDamage: number;
  smartMissileDamage: number;
  innerLandMineDamage: number;
  chainLightningDamage: number;
  deathWaveDamage: number;
  swampDamage: number;
  blackHoleDamage: number;
  wavesSkipped: number;
  recoveryPackages: number;
  freeAttackUpgrade: number;
  freeDefenseUpgrade: number;
  freeUtilityUpgrade: number;
  hpFromDeathWave: number;
  coinsFromDeathWave: number;
  cashFromGoldenTower: number;
  coinsFromGoldenTower: number;
  coinsFromBlackhole: number;
  coinsFromSpotlight: number;
  coinsFromOrbs: number;
  coinsFromCoinUpgrade: number;
  coinsFromCoinBonuses: number;
  totalEnemies: number;
  basic: number;
  fast: number;
  tank: number;
  ranged: number;
  boss: number;
  protector: number;
  totalElites: number;
  vampires: number;
  rays: number;
  scatters: number;
  saboteurs: number;
  commanders: number;
  overcharges: number;
  destroyedByOrbs: number;
  destroyedByThorns: number;
  destroyedByDeathRay: number;
  destroyedByLandMine: number;
  flameBotDamage: number;
  thunderBotStuns: number;
  goldenBotCoinsEarned: number;
  damage: number;
  coinsStolen: number;
  guardianCatches: number;
  coinsFetched: number;
  gems: number;
  medals: number;
  rerollShards: number;
  cannonShards: number;
  armorShards: number;
  generatorShards: number;
  coreShards: number;
  commonModules: number;
  rareModules: number;
  notes: string;
}

// Main game run interface with enhanced field structure
export interface ParsedGameRun {
  id: string;
  timestamp: Date;
  
  // Single data source with rich field objects
  fields: Record<string, GameRunField>;
  
  // Cached computed properties for performance
  readonly tier: number;
  readonly wave: number;
  readonly coinsEarned: number;
  readonly cellsEarned: number;
  readonly realTime: number;
  readonly runType: 'farm' | 'tournament';
  
  // Field lookup optimization
  readonly _fieldsByOriginalKey: Map<string, string>;
}

export interface GameRunFilters {
  searchTerm?: string;
  tierRange?: { min?: number; max?: number };
  dateRange?: { start?: Date; end?: Date };
}

export interface GameRunSortConfig {
  field: keyof ParsedGameRun | keyof ProcessedGameRunData;
  direction: 'asc' | 'desc';
}

export interface GameRunTableColumn {
  id: string;
  header: string;
  accessor: keyof ParsedGameRun | keyof ProcessedGameRunData;
  sortable?: boolean;
  formatter?: (value: unknown) => string;
}

// Type for raw clipboard input
export type RawClipboardData = Record<string, string>;

// Helper type for data transformation
export type DataTransformResult = {
  camelCaseData: CamelCaseGameRunData;
  processedData: ProcessedGameRunData;
};

// NEW: Enhanced field interface for single source of truth
export interface GameRunField {
  // Computed values for analytics
  value: number | string | Date;
  
  // Display formats
  rawValue: string;           // Original clipboard value
  displayValue: string;       // Formatted for display (70.5B, 2h 45m)
  
  // Metadata
  originalKey: string;        // Original clipboard key
  dataType: 'number' | 'duration' | 'string' | 'date';
}
// Number suffixes for parsing
export type NumberSuffix = 'K' | 'M' | 'B' | 'T' | 'Q' | 'q' | 'S' | 's' | 'O';

// Duration format types
export type DurationUnit = 'd' | 'h' | 'm' | 's';
export type DurationString = string; // Format: "1d 13h 24m 51s"
