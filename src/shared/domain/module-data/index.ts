/**
 * Module Data Public API
 *
 * Exports all types, configurations, and utilities for working with
 * module data across the application.
 */

// Types
export type {
  Rarity,
  ModuleType,
  SubEffectConfig,
} from './types';

// Rarity Configuration
export {
  RARITY_CONFIG_MAP,
  RARITY_ORDER,
  getRarityProbability,
  getRarityColor,
} from './rarities/rarity-config';

// Module Type Configuration
export {
  MODULE_TYPE_CONFIGS,
  getModuleTypeColor,
} from './modules/module-types';

// Slot Unlock Rules
export {
  MIN_MODULE_LEVEL,
  getSlotsForLevel,
  isValidModuleLevel,
} from './modules/slot-unlock-rules';

// Lock Costs
export {  
  getLockCost,
} from './modules/lock-costs';

// Sub-Effect Data
export {
  getSubEffectsForModule,
  getSubEffectById,
} from './sub-effects/sub-effect-data';

// Sub-Effect Utilities
export {
  getAvailableRarities,
  hasRarity,
  filterByModuleRarity,  
  formatEffectValue,
  countPoolCombinations,
} from './sub-effects/sub-effect-utils';
