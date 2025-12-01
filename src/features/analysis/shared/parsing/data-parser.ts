import { formatLargeNumber } from '../../../../shared/formatting/number-scale';
import type {
  ParsedGameRun,
  RawClipboardData,
  GameRunField
} from '@/shared/types/game-run.types';
import type { RunTypeValue } from '@/shared/domain/run-types/types';
import type { ImportFormatSettings } from '@/shared/locale/types';
import { createGameRunField, createInternalField, toCamelCase } from './field-utils';
import { determineRunType } from '../filtering/run-type-filter';
import {
  parseBattleDate,
  constructDate,
  formatIsoDate,
  formatIsoTime
} from '@/shared/formatting/date-formatters';
import {
  INTERNAL_FIELD_NAMES,
  isLegacyField,
  getMigratedFieldName
} from '@/shared/domain/fields/internal-field-config';

/**
 * Derive _date and _time fields from battle_date
 * Returns { date: 'yyyy-MM-dd', time: 'HH:mm:ss' }
 */
export function deriveDateTimeFromBattleDate(battleDate: Date): { date: string; time: string } {
  return {
    date: formatIsoDate(battleDate),
    time: formatIsoTime(battleDate)
  };
}

/**
 * Construct Date from legacy _date and _time fields
 * Returns Date object or null if construction fails
 *
 * @deprecated Use constructDate from date-formatters.ts directly
 */
export function constructDateFromLegacyFields(dateStr: string, timeStr: string): Date | null {
  return constructDate(dateStr, timeStr);
}


// Parse tab-delimited data from clipboard
function parseTabDelimitedData(rawData: string): RawClipboardData {
  const lines = rawData.trim().split('\n');
  const parsed: Record<string, string> = {};

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Check for numbered arrow format: "     1→Game Time        1d 13h 24m 51s"
    const arrowIndex = line.indexOf('→');
    if (arrowIndex !== -1) {
      // Extract everything after the arrow and number
      const afterArrow = line.substring(arrowIndex + 1);

      // Check if this is a header-only row (no tab delimiter)
      if (!afterArrow.includes('\t')) {
        // Skip header-only rows like "Battle Report", "Combat", "Utility"
        continue;
      }

      // Find the first occurrence of tab to separate key from value
      const tabIndex = afterArrow.indexOf('\t');
      if (tabIndex !== -1) {
        const key = afterArrow.substring(0, tabIndex).trim();
        const value = afterArrow.substring(tabIndex + 1).trim();

        if (key && value) {
          parsed[key] = value;
        }
        continue;
      }

      // Fallback: Find the first occurrence of multiple spaces to separate key from value
      const match = afterArrow.match(/^(\S+(?:\s+\S+)*)\s{2,}(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();

        if (key && value) {
          parsed[key] = value;
        }
        continue;
      }
    }

    // Handle simple format: "Game Time        1d 13h 24m 51s"
    const match = line.match(/^(\S+(?:\s+\S+)*)\s{2,}(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();

      if (key && value) {
        parsed[key] = value;
      }
      continue;
    }

    // Handle tab-delimited format as fallback
    const tabIndex = line.indexOf('\t');
    if (tabIndex !== -1) {
      const key = line.substring(0, tabIndex).trim();
      const value = line.substring(tabIndex + 1).trim();

      if (key && value) {
        parsed[key] = value;
      }
    }
  }

  return parsed;
}

function extractKeyStatsFromFields(fields: Record<string, GameRunField>): {
  tier: number;
  wave: number;
  coinsEarned: number;
  cellsEarned: number;
  realTime: number;
  runType: RunTypeValue;
} {
  const tierStr = (fields.tier?.rawValue) || '';
  const runType: RunTypeValue = determineRunType(tierStr);
  
  // Extract numeric tier value from both numeric fields and tournament strings like "8+"
  let tier: number;
  if (fields.tier?.dataType === 'number') {
    tier = fields.tier.value as number;
  } else {
    // For tournament tiers like "8+", extract the numeric part
    const match = tierStr.match(/^(\d+)/);
    tier = match ? parseInt(match[1], 10) : 0;
  }
  tier = tier || 0;
  
  return {
    tier,
    wave: (fields.wave?.value as number) || 0,
    coinsEarned: (fields.coinsEarned?.value as number) || 0,
    cellsEarned: (fields.cellsEarned?.value as number) || 0,
    realTime: (fields.realTime?.value as number) || 0,
    runType
  };
}

// Calculate value per hour
export function calculatePerHour(value: number, durationInSeconds: number): number {
  if (durationInSeconds === 0) {
    return 0;
  }
  const hours = durationInSeconds / 3600;
  return value / hours;
}

// Main parsing function with enhanced field structure and battle_date support
export function parseGameRun(
  rawInput: string,
  customTimestamp?: Date,
  importFormat?: ImportFormatSettings
): ParsedGameRun {
  try {
    const clipboardData = parseTabDelimitedData(rawInput);

    // Generate field-based structure
    const fields: Record<string, GameRunField> = {};
    const dateFormat = importFormat?.dateFormat ?? 'month-first';

    for (const [originalKey, rawValue] of Object.entries(clipboardData)) {
      const camelKey = toCamelCase(originalKey);
      const field = createGameRunField(originalKey, rawValue, importFormat);

      fields[camelKey] = field;
    }

    // Determine timestamp using hierarchy: battle_date > customTimestamp > current time
    let timestamp: Date;
    let hasBattleDate = false;

    // Check for battle_date field (new game export format)
    if (fields.battleDate) {
      const battleDate = parseBattleDate(fields.battleDate.rawValue, dateFormat);
      if (battleDate) {
        timestamp = battleDate;
        hasBattleDate = true;

        // Derive _date and _time from battle_date
        const derived = deriveDateTimeFromBattleDate(battleDate);

        // Add derived internal fields (these won't be in the original game export)
        fields[INTERNAL_FIELD_NAMES.DATE] = createInternalField('Date', derived.date);
        fields[INTERNAL_FIELD_NAMES.TIME] = createInternalField('Time', derived.time);
      } else {
        // battle_date parsing failed, fall back to customTimestamp or current time
        timestamp = customTimestamp || new Date();
      }
    } else {
      // No battle_date - use customTimestamp or current time
      timestamp = customTimestamp || new Date();
    }

    // Handle legacy data migration: fields without underscore prefix
    // Migrate legacy field names to new internal field names
    for (const [fieldName, field] of Object.entries(fields)) {
      if (isLegacyField(fieldName)) {
        const migratedName = getMigratedFieldName(fieldName);
        if (migratedName) {
          // Special handling for date/time fields with battle_date present
          if (hasBattleDate && (fieldName === 'date' || fieldName === 'time')) {
            // Skip migration if battle_date is present (we already derived from battle_date)
            delete fields[fieldName];
            continue;
          }

          // Migrate field to internal name
          fields[migratedName] = { ...field };
          delete fields[fieldName];
        }
      }
    }

    // Extract key stats from field structure
    const fieldKeyStats = extractKeyStatsFromFields(fields);

    return {
      id: crypto.randomUUID(),
      timestamp,
      fields,
      ...fieldKeyStats,
    };
  } catch (error) {
    console.error('Error parsing game run:', error);
    throw error;
  }
}

// Map tournament tier (with '+') to league label
export function getTournamentLeague(tierNumber: number): string | null {
  if (!Number.isFinite(tierNumber) || tierNumber <= 0) return null;
  if (tierNumber >= 14) return 'Legend';
  if (tierNumber >= 11) return 'Champion';
  if (tierNumber >= 8) return 'Platinum';
  if (tierNumber >= 5) return 'Gold';
  if (tierNumber >= 3) return 'Silver';
  return 'Copper';
}

// Format tier label including tournament league when applicable, e.g., '8+ Platinum'
export function formatTierLabel(camelTier: string | undefined, numericTier: number | undefined): string {
  const hasPlus = typeof camelTier === 'string' && /\+/.test(camelTier);
  if (hasPlus) {
    // For tournament tiers, use the numeric tier if available, otherwise extract from raw string
    let tierNum: number;
    if (numericTier && numericTier > 0) {
      tierNum = numericTier;
    } else {
      // Extract numeric part from string like "8+"
      const match = (camelTier || '').match(/^(\d+)/);
      tierNum = match ? parseInt(match[1], 10) : 0;
    }
    
    if (tierNum > 0) {
      const league = getTournamentLeague(tierNum);
      const base = `${tierNum}+`;
      return league ? `${base} ${league}` : base;
    } else {
      // Fallback to raw string if we can't parse the number
      return camelTier || '-';
    }
  }
  // For regular farming tiers
  if (numericTier && numericTier > 0) return String(numericTier);
  return camelTier || '-';
}

// Re-export formatLargeNumber as formatNumber for backward compatibility
export { formatLargeNumber as formatNumber };

// Format duration in seconds back to readable format
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);
  
  return parts.join(' ') || '0s';
}

