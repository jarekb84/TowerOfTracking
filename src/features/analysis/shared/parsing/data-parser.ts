import { formatLargeNumber } from '../../../../shared/formatting/number-scale';
import type {
  ParsedGameRun,
  RawClipboardData,
  GameRunField
} from '@/shared/types/game-run.types';
import type { ImportFormatSettings } from '@/shared/locale/types';
import { createGameRunField, toCamelCase } from './field-utils';
import { parseV28SectionedEntries, looksLikeV28SectionedInput } from './section-aware-parser';
import { hydrateRun } from '@/shared/domain/field-graph';
import { constructDate } from '@/shared/formatting/date-formatters';

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

// Calculate value per hour
export function calculatePerHour(value: number, durationInSeconds: number): number {
  if (durationInSeconds === 0) {
    return 0;
  }
  const hours = durationInSeconds / 3600;
  return value / hours;
}

// Parses tab-delimited clipboard text (V28 sectioned or V2 flat) into a raw
// fields map, then hands off to `hydrateRun` which owns V2-key remap, the
// derivation cascade, timestamp resolution, and cached-stat extraction.
export function parseGameRun(
  rawInput: string,
  customTimestamp?: Date,
  importFormat?: ImportFormatSettings
): ParsedGameRun {
  try {
    const rawFields = parseToRawFields(rawInput, importFormat);
    return hydrateRun(rawFields, { customTimestamp, importFormat });
  } catch (error) {
    console.error('Error parsing game run:', error);
    throw error;
  }
}

function parseToRawFields(
  rawInput: string,
  importFormat: ImportFormatSettings | undefined,
): Record<string, GameRunField> {
  // Two input shapes: V28 sectioned exports emit `{key, label, value}` triples
  // with V3-canonical composite keys; V2 flat clipboard emits whatever keys
  // were typed and gets canonicalized inside `hydrateRun` via remap.
  const rawFields: Record<string, GameRunField> = {};
  if (looksLikeV28SectionedInput(rawInput)) {
    for (const entry of parseV28SectionedEntries(rawInput)) {
      rawFields[entry.key] = createGameRunField(entry.label, entry.value, importFormat);
    }
    return rawFields;
  }
  const clipboardData = parseTabDelimitedData(rawInput);
  for (const [originalKey, rawValue] of Object.entries(clipboardData)) {
    const fieldKey = toCamelCase(originalKey);
    rawFields[fieldKey] = createGameRunField(originalKey, rawValue, importFormat);
  }
  return rawFields;
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

