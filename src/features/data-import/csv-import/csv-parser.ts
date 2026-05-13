import type {
  ParsedGameRun,
  GameRunField
} from '@/shared/types/game-run.types';
import type {
  CsvParseConfig,
  CsvParseResult,
  CsvDelimiter,
  DateValidationWarning,
} from './types';
import { createGameRunField, toCamelCase } from '@/features/analysis/shared/parsing/field-utils';
import { hydrateRun } from '@/shared/domain/field-graph';
import { validateBattleDate, parseTimestampFromFields } from '@/shared/formatting/date-formatters';
import { tryDeriveFromInternalFields } from '@/shared/formatting/date-issue-detection';
import { detectDelimiter } from './csv-helpers';
import { createFieldMappingReport } from './csv-field-mapping';
import { V3_COLUMN_PREFIX } from '@/shared/domain/migrations/storage-keys';
import supportedFieldsData from '../../../../sampleData/supportedFields.json';

// Load supported fields from JSON
const SUPPORTED_FIELDS: string[] = supportedFieldsData;

// Delimiter mapping
const DELIMITER_MAP: Record<CsvDelimiter, string> = {
  tab: '\t',
  comma: ',',
  semicolon: ';',
  custom: ','  // Default fallback, will be overridden
};

/** Empty result for when no data is provided */
function createEmptyResult(): CsvParseResult {
  return {
    success: [],
    failed: 0,
    errors: ['No data provided'],
    fieldMappingReport: {
      mappedFields: [],
      newFields: [],
      similarFields: [],
      unsupportedFields: [],
      skippedFields: []
    }
  };
}

/** Build mapping from CSV column index to camelCase field name.
 *
 * Legacy V1 / V2 column headers (`Date`, `tier`, `Coins From Black Hole`)
 * are normalized to camelCase here; the canonical-key remap lives in
 * `remapV2FieldKeys` (graph-driven), which runs once per row downstream.
 *
 * TRANSITIONAL — collapses to a one-line graph call in commit 11b
 * (parser-boundary resolver centralization). The same per-shape
 * normalization lives in `field-utils.ts:deriveCanonicalKey`,
 * `csv-field-mapping.ts`, and `v2-to-v3-migrator.ts:classifyV2Header`;
 * commit 11b consolidates all four. Decision shape captured in
 * `docs/field-graph/EXPLORATION-parser-boundary-resolution.md`.
 */
function buildColumnToFieldMap(headers: string[]): Map<number, string> {
  const columnToFieldMap = new Map<number, string>();

  headers.forEach((header, index) => {
    let camelCase: string;

    // V3 storage format: `<V3_COLUMN_PREFIX><sectionCamel>_<labelCamel>`
    // game-field headers. Strip the prefix to recover the in-memory key.
    if (header.startsWith(V3_COLUMN_PREFIX)) {
      camelCase = header.substring(V3_COLUMN_PREFIX.length);
    } else if (header.startsWith('unrecognizedField_')) {
      // Preserve unrecognized columns under their own namespaced key so
      // downstream code can still surface them in the mapping report.
      camelCase = header;
    } else if (header.startsWith('_')) {
      // Internal fields (`_Date`, `_Time`, ...) keep the underscore prefix.
      const withoutUnderscore = header.substring(1);
      camelCase = '_' + toCamelCase(withoutUnderscore);
    } else {
      camelCase = toCamelCase(header);
    }

    columnToFieldMap.set(index, camelCase);
  });

  return columnToFieldMap;
}

/** Find the column index for battleDate field (V3 or V2 shape). */
function findBattleDateColumnIndex(columnToFieldMap: Map<number, string>): number | undefined {
  for (const [columnIndex, fieldName] of columnToFieldMap.entries()) {
    if (fieldName === 'battleReport_battleDate' || fieldName === 'battleDate') {
      return columnIndex;
    }
  }
  return undefined;
}

/** Context for processing a single CSV row */
interface RowParseContext {
  values: string[];
  headers: string[];
  columnToFieldMap: Map<number, string>;
  battleDateColumnIndex: number | undefined;
  importFormat: CsvParseConfig['importFormat'];
  rowNumber: number;
}

/** Extract numeric field value safely */
function extractNumericFieldValue(field: GameRunField | undefined): number | undefined {
  if (!field) return undefined;
  const num = Number(field.value);
  return isNaN(num) ? undefined : num;
}

/** Create warning context from fields (tolerates V3 and V2 shape). */
function createWarningContext(fields: Record<string, GameRunField>): DateValidationWarning['context'] {
  const tierField = fields.battleReport_tier ?? fields.tier;
  const waveField = fields.battleReport_wave ?? fields.wave;
  const realTimeField = fields.battleReport_realTime ?? fields.realTime;
  return {
    tier: extractNumericFieldValue(tierField),
    wave: extractNumericFieldValue(waveField),
    duration: realTimeField?.rawValue,
  };
}

/** Check if row can be fixed by deriving battleDate from _date/_time fields */
function detectFixability(
  fields: Record<string, GameRunField>
): { isFixable: boolean; dateFieldValue?: string; timeFieldValue?: string; derivedBattleDate?: Date } {
  // Use the shared derivation logic
  const result = tryDeriveFromInternalFields(fields);

  return {
    isFixable: result.success,
    dateFieldValue: result.dateValue,
    timeFieldValue: result.timeValue,
    derivedBattleDate: result.date ?? undefined,
  };
}

/** Validate the battleDate column when present; emit a warning on failure. */
function processBattleDateField(
  fields: Record<string, GameRunField>,
  context: RowParseContext
): DateValidationWarning | null {
  const { values, battleDateColumnIndex, importFormat, rowNumber } = context;

  if (battleDateColumnIndex === undefined) return null;

  const battleDateValue = values[battleDateColumnIndex] || '';
  const validationResult = validateBattleDate(battleDateValue, {
    format: importFormat?.dateFormat,
    warnFutureDates: false,
  });
  if (validationResult.success) return null;

  // BattleDate validation failed - check if we can derive from _date/_time
  const fixability = detectFixability(fields);

  return {
    rowNumber,
    rawValue: battleDateValue,
    error: validationResult.error,
    context: createWarningContext(fields),
    fallbackUsed: 'import-time',
    isFixable: fixability.isFixable,
    dateFieldValue: fixability.dateFieldValue,
    timeFieldValue: fixability.timeFieldValue,
    derivedBattleDate: fixability.derivedBattleDate,
  };
}

/** Parse a single CSV row into a ParsedGameRun */
function parseRow(context: RowParseContext): { run: ParsedGameRun; warning: DateValidationWarning | null } {
  const { values, headers, columnToFieldMap, importFormat } = context;
  const rawFields: Record<string, GameRunField> = {};

  for (const [columnIndex, fieldName] of columnToFieldMap.entries()) {
    const rawValue = values[columnIndex] || '';
    if (!rawValue) continue;
    const originalHeader = headers[columnIndex];
    rawFields[fieldName] = createGameRunField(originalHeader, rawValue, importFormat);
  }

  const hydrated = hydrateRun(rawFields, { importFormat });

  // CSV-specific timestamp refinement: legacy V2 CSVs may carry `_date` /
  // `_time` without a battleReport_battleDate column. `parseTimestampFromFields`
  // walks that fallback chain after hydration. For modern V3 storage this is
  // a no-op (battleDate present → already used by hydrateRun).
  const timestamp = parseTimestampFromFields(hydrated.fields, hydrated.timestamp);
  const run: ParsedGameRun = { ...hydrated, timestamp };

  const warning = processBattleDateField(run.fields, context);
  return { run, warning };
}

/** Context for CSV parsing operation */
interface CsvParseContext {
  lines: string[];
  delimiter: string;
  headers: string[];
  columnToFieldMap: Map<number, string>;
  battleDateColumnIndex: number | undefined;
  importFormat: CsvParseConfig['importFormat'];
}

/** Initialize parse context from raw input */
function initializeParseContext(rawInput: string, config: Partial<CsvParseConfig>): CsvParseContext | null {
  const lines = rawInput.trim().split('\n');
  if (lines.length === 0) return null;

  const firstLine = lines[0];
  const delimiter = config.delimiter || detectDelimiter(firstLine);
  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/["']/g, ''));
  const columnToFieldMap = buildColumnToFieldMap(headers);

  return {
    lines,
    delimiter,
    headers,
    columnToFieldMap,
    battleDateColumnIndex: findBattleDateColumnIndex(columnToFieldMap),
    importFormat: config.importFormat,
  };
}

/** Parse CSV values from a line */
function parseLineValues(line: string, delimiter: string): string[] {
  return line.split(delimiter).map(v => v.trim().replace(/["']/g, ''));
}

/**
 * Generic CSV parser that works with any column headers by mapping them to supported fields
 */
export function parseGenericCsv(
  rawInput: string,
  config: Partial<CsvParseConfig> = {}
): CsvParseResult {
  const fullConfig: CsvParseConfig = {
    delimiter: undefined,
    supportedFields: SUPPORTED_FIELDS,
    ...config
  };

  const ctx = initializeParseContext(rawInput, config);
  if (!ctx) return createEmptyResult();

  const fieldMappingReport = createFieldMappingReport(ctx.headers, fullConfig.supportedFields);
  const success: ParsedGameRun[] = [];
  const errors: string[] = [];
  const dateWarnings: DateValidationWarning[] = [];
  let failed = 0;

  for (let i = 1; i < ctx.lines.length; i++) {
    const line = ctx.lines[i].trimEnd();
    if (!line.trim()) continue;

    try {
      const values = parseLineValues(line, ctx.delimiter);

      if (values.length > ctx.headers.length) {
        errors.push(`Row ${i + 1}: Too many columns (expected max ${ctx.headers.length}, got ${values.length})`);
        failed++;
        continue;
      }

      const { run, warning } = parseRow({
        values,
        headers: ctx.headers,
        columnToFieldMap: ctx.columnToFieldMap,
        battleDateColumnIndex: ctx.battleDateColumnIndex,
        importFormat: ctx.importFormat,
        rowNumber: i,
      });

      success.push(run);
      if (warning) dateWarnings.push(warning);
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failed++;
    }
  }

  return {
    success,
    failed,
    errors,
    fieldMappingReport,
    dateWarnings: dateWarnings.length > 0 ? dateWarnings : undefined,
    missingBattleDateColumn: ctx.battleDateColumnIndex === undefined,
  };
}

/**
 * Get delimiter string from CsvDelimiter type
 */
export function getDelimiterString(delimiterType: CsvDelimiter, customDelimiter?: string): string {
  if (delimiterType === 'custom' && customDelimiter) {
    return customDelimiter;
  }
  return DELIMITER_MAP[delimiterType];
}