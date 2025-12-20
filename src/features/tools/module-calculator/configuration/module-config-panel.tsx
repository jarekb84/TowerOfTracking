/**
 * Module Configuration Panel
 *
 * UI for selecting module type, level, and rarity.
 * Displays available slots based on level.
 */

import type { ModuleType, Rarity } from '@/shared/domain/module-data';
import {
  MODULE_TYPE_CONFIGS,
  getModuleTypeColor,
  getRarityColor,
  RARITY_CONFIG_MAP,
} from '@/shared/domain/module-data';
import { ROLLABLE_MODULE_RARITIES } from './module-config-logic';
import { Input, Select, FormControl } from '@/components/ui';

interface ModuleConfigPanelProps {
  moduleType: ModuleType;
  moduleLevel: number;
  moduleRarity: Rarity;
  slotCount: number;
  onModuleTypeChange: (type: ModuleType) => void;
  onModuleLevelChange: (level: number) => void;
  onModuleRarityChange: (rarity: Rarity) => void;
}

export function ModuleConfigPanel({
  moduleType,
  moduleLevel,
  moduleRarity,
  slotCount,
  onModuleTypeChange,
  onModuleLevelChange,
  onModuleRarityChange,
}: ModuleConfigPanelProps) {
  return (
    <div className="space-y-4">
      {/* Module Type Tabs */}
      <ModuleTypeTabs
        selected={moduleType}
        onSelect={onModuleTypeChange}
      />

      {/* Level and Rarity Controls */}
      <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <LevelInput
          value={moduleLevel}
          onChange={onModuleLevelChange}
        />
        <RaritySelect
          value={moduleRarity}
          onChange={onModuleRarityChange}
        />
        <SlotDisplay count={slotCount} />
      </div>
    </div>
  );
}

interface ModuleTypeTabsProps {
  selected: ModuleType;
  onSelect: (type: ModuleType) => void;
}

function ModuleTypeTabs({ selected, onSelect }: ModuleTypeTabsProps) {
  return (
    <div className="flex rounded-lg bg-slate-800/30 p-1.5 border border-slate-700/50 gap-1">
      {MODULE_TYPE_CONFIGS.map((config) => {
        const isSelected = config.id === selected;
        const color = getModuleTypeColor(config.id);

        return (
          <button
            key={config.id}
            type="button"
            onClick={() => onSelect(config.id)}
            aria-pressed={isSelected}
            className={`
              flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200
              ${isSelected
                ? 'text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }
            `}
            style={isSelected ? {
              backgroundColor: color,
              boxShadow: `0 2px 8px ${color}40`
            } : undefined}
          >
            {config.displayName}
          </button>
        );
      })}
    </div>
  );
}

interface LevelInputProps {
  value: number;
  onChange: (level: number) => void;
}

function LevelInput({ value, onChange }: LevelInputProps) {
  return (
    <FormControl label="Module Level" layout="horizontal">
      <Input
        type="number"
        min={1}
        max={999}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 1)}
        className="w-20 h-9 min-h-0 px-3 py-1.5 text-sm"
      />
    </FormControl>
  );
}

interface RaritySelectProps {
  value: Rarity;
  onChange: (rarity: Rarity) => void;
}

function RaritySelect({ value, onChange }: RaritySelectProps) {
  return (
    <FormControl label="Module Rarity" layout="horizontal">
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as Rarity)}
        className="h-9 min-h-0 py-1.5"
        style={{ color: getRarityColor(value) }}
      >
        {ROLLABLE_MODULE_RARITIES.map((rarity) => (
          <option
            key={rarity}
            value={rarity}
            style={{ color: getRarityColor(rarity) }}
          >
            {RARITY_CONFIG_MAP[rarity].displayName}
          </option>
        ))}
      </Select>
    </FormControl>
  );
}

interface SlotDisplayProps {
  count: number;
}

function SlotDisplay({ count }: SlotDisplayProps) {
  return (
    <FormControl label="Available Slots" layout="horizontal">
      <div className="flex gap-1.5">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="w-7 h-7 flex items-center justify-center text-xs font-medium
                       bg-slate-700/50 border border-slate-600/50 rounded-md text-slate-300"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </FormControl>
  );
}
