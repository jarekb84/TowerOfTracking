/**
 * Rarity Cell Component
 *
 * Clickable cell showing a sub-effect value at a specific rarity.
 * Highlights when selected as the minimum rarity threshold.
 */

import type { Rarity, SubEffectConfig } from '@/shared/domain/module-data';
import { getRarityColor, formatEffectValue, hasRarity } from '@/shared/domain/module-data';
import { isRaritySelected, isMinimumRarity } from './table-state-logic';
import type { EffectSelection } from '../types';

interface RarityCellProps {
  effect: SubEffectConfig;
  rarity: Rarity;
  selection: EffectSelection;
  isDisabled: boolean;
  onClick: () => void;
}

interface CellState {
  hasValue: boolean;
  isDisabled: boolean;
  isBanned: boolean;
  isSelected: boolean;
  isMinimum: boolean;
  isClickable: boolean;
}

/**
 * Compute the cell state from props
 */
function computeCellState(
  effect: SubEffectConfig,
  rarity: Rarity,
  selection: EffectSelection,
  isDisabled: boolean
): CellState {
  const hasValue = hasRarity(effect, rarity);
  const isBanned = selection.isBanned;
  const isSelected = isRaritySelected(selection, rarity);
  const isMinimum = isMinimumRarity(selection, rarity);
  const isClickable = !isBanned && hasValue && !isDisabled;

  return {
    hasValue,
    isDisabled,
    isBanned,
    isSelected,
    isMinimum,
    isClickable,
  };
}

/**
 * Build the className string based on cell state
 */
function buildCellClassName(state: CellState): string {
  const base = 'w-full px-2 py-1.5 text-sm text-center transition-all duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-1 focus:ring-offset-slate-900';
  const cursor = state.isClickable ? 'cursor-pointer hover:bg-slate-700/40' : 'cursor-default';
  const disabled = state.isDisabled ? 'opacity-40' : '';
  const banned = state.isBanned ? 'opacity-30 line-through' : '';
  const selected = state.isSelected && !state.isMinimum ? 'bg-slate-700/20' : '';
  const minimum = state.isMinimum ? 'ring-2 ring-offset-1 ring-offset-slate-900 font-semibold' : '';

  return [base, cursor, disabled, banned, selected, minimum].filter(Boolean).join(' ');
}

/**
 * Build the style object based on cell state and color
 */
function buildCellStyle(
  state: CellState,
  color: string
): React.CSSProperties {
  const textColor = state.isDisabled || state.isBanned ? 'inherit' : color;

  if (state.isMinimum) {
    return {
      color: textColor,
      '--tw-ring-color': color,
      backgroundColor: `${color}15`,
    } as React.CSSProperties;
  }

  return { color: textColor };
}

function RarityCell({
  effect,
  rarity,
  selection,
  isDisabled,
  onClick,
}: RarityCellProps) {
  const state = computeCellState(effect, rarity, selection, isDisabled);
  const value = formatEffectValue(effect, rarity);
  const color = getRarityColor(rarity);
  const className = buildCellClassName(state);
  const style = buildCellStyle(state, color);

  return (
    <button
      type="button"
      onClick={state.isClickable ? onClick : undefined}
      disabled={!state.isClickable}
      aria-pressed={state.isMinimum}
      className={className}
      style={style}
    >
      {value}
    </button>
  );
}

interface RarityCellsRowProps {
  effect: SubEffectConfig;
  selection: EffectSelection;
  moduleRarity: Rarity;
  onRarityClick: (rarity: Rarity) => void;
}

/**
 * All rarity cells for a single effect row
 */
export function RarityCellsRow({
  effect,
  selection,
  moduleRarity,
  onRarityClick,
}: RarityCellsRowProps) {
  const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic', 'ancestral'];
  const moduleRarityIndex = rarities.indexOf(moduleRarity);

  return (
    <>
      {rarities.map((rarity) => {
        const rarityIndex = rarities.indexOf(rarity);
        const isDisabled = rarityIndex > moduleRarityIndex;

        return (
          <td key={rarity} className="px-1">
            <RarityCell
              effect={effect}
              rarity={rarity}
              selection={selection}
              isDisabled={isDisabled}
              onClick={() => onRarityClick(rarity)}
            />
          </td>
        );
      })}
    </>
  );
}
