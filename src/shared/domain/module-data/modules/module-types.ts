/**
 * Module Type Configuration
 *
 * Defines the four module types with their display properties.
 */

import type { ModuleType, ModuleTypeConfig } from '../types';

/**
 * All module type configurations
 */
export const MODULE_TYPE_CONFIGS: ModuleTypeConfig[] = [
  {
    id: 'cannon',
    displayName: 'Cannon',
    description: 'Attack-focused effects for damage and critical hits',
    color: '#ef4444', // Red
  },
  {
    id: 'armor',
    displayName: 'Armor',
    description: 'Defense-focused effects for survival and protection',
    color: '#3b82f6', // Blue
  },
  {
    id: 'generator',
    displayName: 'Generator',
    description: 'Utility effects for economy and upgrades',
    color: '#22c55e', // Green
  },
  {
    id: 'core',
    displayName: 'Core',
    description: 'Ultimate weapon effects for special abilities',
    color: '#a855f7', // Purple
  },
];

/**
 * Lookup map for quick access by module type ID
 */
const MODULE_TYPE_CONFIG_MAP: Record<ModuleType, ModuleTypeConfig> = Object.fromEntries(
  MODULE_TYPE_CONFIGS.map((config) => [config.id, config])
) as Record<ModuleType, ModuleTypeConfig>;

/**
 * Get display color for a module type
 */
export function getModuleTypeColor(moduleType: ModuleType): string {
  return MODULE_TYPE_CONFIG_MAP[moduleType].color;
}
