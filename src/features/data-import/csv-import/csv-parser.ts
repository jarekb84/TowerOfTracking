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
import { createGameRunField, createInternalField, toCamelCase } from '@/features/analysis/shared/parsing/field-utils';
import { deriveDateTimeFromBattleDate } from '@/features/analysis/shared/parsing/data-parser';
import { INTERNAL_FIELD_NAMES, isLegacyField, getMigratedFieldName } from '@/shared/domain/fields/internal-field-config';
import { validateBattleDate, parseTimestampFromFields, constructDate } from '@/shared/formatting/date-formatters';
import { detectDelimiter } from './csv-helpers';
import { createFieldMappingReport, extractKeyStatsFromFields } from './csv-field-mapping';
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

/** Build mapping from CSV column index to camelCase field name */
function buildColumnToFieldMap(headers: string[]): Map<number, string> {
  const columnToFieldMap = new Map<number, string>();

  headers.forEach((header, index) => {
    let camelCase: string;

    // Handle underscore-prefixed headers (new format): "_Date" → "_date"
    if (header.startsWith('_')) {
      const withoutUnderscore = header.substring(1);
      camelCase = '_' + toCamelCase(withoutUnderscore);
    } else {
      camelCase = toCamelCase(header);

      // Apply legacy field migration for old headers
      if (isLegacyField(camelCase)) {
        const migratedName = getMigratedFieldName(camelCase);
        if (migratedName) {
          camelCase = migratedName;
        }
      }
    }

    columnToFieldMap.set(index, camelCase);
  });

  return columnToFieldMap;
}

/** Find the column index for battleDate field */
function findBattleDateColumnIndex(columnToFieldMap: Map<number, string>): number | undefined {
  for (const [columnIndex, fieldName] of columnToFieldMap.entries()) {
    if (fieldName === 'battleDate') {
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

/** Create warning context from fields */
function createWarningContext(fields: Record<string, GameRunField>): DateValidationWarning['context'] {
  return {
    tier: extractNumericFieldValue(fields.tier),
    wave: extractNumericFieldValue(fields.wave),
    duration: fields.realTime?.rawValue,
  };
}

/** Check if we should derive _date/_time from battleDate */
function shouldDeriveDateTimeFields(
  fields: Record<string, GameRunField>
): boolean {
  const hasExistingDateFields = !!(fields[INTERNAL_FIELD_NAMES.DATE] && fields[INTERNAL_FIELD_NAMES.TIME]);
  return !hasExistingDateFields;
}

/** Check if row can be fixed by deriving battleDate from _date/_time fields */
function detectFixability(
  fields: Record<string, GameRunField>
): { isFixable: boolean; dateFieldValue?: string; timeFieldValue?: string; derivedBattleDate?: Date } {
  const dateField = fields[INTERNAL_FIELD_NAMES.DATE];
  const timeField = fields[INTERNAL_FIELD_NAMES.TIME];

  const dateFieldValue = dateField?.rawValue;
  const timeFieldValue = timeField?.rawValue;

  // Both fields must exist to be fixable
  if (!dateFieldValue || !timeFieldValue) {
    return {
      isFixable: false,
      dateFieldValue,
      timeFieldValue,
    };
  }

  // Attempt to construct a Date from the fields
  const derivedBattleDate = constructDate(dateFieldValue, timeFieldValue);

  return {
    isFixable: derivedBattleDate !== null,
    dateFieldValue,
    timeFieldValue,
    derivedBattleDate: derivedBattleDate ?? undefined,
  };
}

/** Process battleDate field: validate and derive _date/_time if needed */
function processBattleDateField(
  fields: Record<string, GameRunField>,
  context: RowParseContext
): DateValidationWarning | null {
  const { values, battleDateColumnIndex, importFormat, rowNumber } = context;

  // No battleDate column - nothing to validate
  if (battleDateColumnIndex === undefined) {
    return null;
  }

  const battleDateValue = values[battleDateColumnIndex] || '';
  const validationResult = validateBattleDate(battleDateValue, {
    format: importFormat?.dateFormat,
    warnFutureDates: false,
  });

  if (validationResult.success) {
    // Only derive _date/_time if they don't already exist in the data
    if (shouldDeriveDateTimeFields(fields)) {
      const derived = deriveDateTimeFromBattleDate(validationResult.date);
      fields[INTERNAL_FIELD_NAMES.DATE] = createInternalField('Date', derived.date);
      fields[INTERNAL_FIELD_NAMES.TIME] = createInternalField('Time', derived.time);
    }
    return null;
  }

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
  const fields: Record<string, GameRunField> = {};

  // Process each column value
  for (const [columnIndex, fieldName] of columnToFieldMap.entries()) {
    const rawValue = values[columnIndex] || '';
    if (!rawValue) continue;

    const originalHeader = headers[columnIndex];
    fields[fieldName] = createGameRunField(originalHeader, rawValue, importFormat);
  }

  // Process battleDate and derive _date/_time
  const warning = processBattleDateField(fields, context);

  const parsedRun: ParsedGameRun = {
    id: crypto.randomUUID(),
    timestamp: parseTimestampFromFields(fields),
    fields,
    ...extractKeyStatsFromFields(fields),
  };

  return { run: parsedRun, warning };
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