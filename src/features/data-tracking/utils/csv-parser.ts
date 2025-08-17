import type { 
  ParsedGameRun,
  CsvParseConfig,
  CsvParseResult,
  FieldMappingReport,
  GameRunField,
  CsvDelimiter
} from '../types/game-run.types';
import { createGameRunField, toCamelCase } from './field-utils';
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

/**
 * Generic CSV parser that works with any column headers by mapping them to supported fields
 */
export function parseGenericCsv(
  rawInput: string, 
  config: Partial<CsvParseConfig> = {}
): CsvParseResult {
  const fullConfig: CsvParseConfig = {
    delimiter: undefined, // Auto-detect if not provided
    supportedFields: SUPPORTED_FIELDS,
    skipUnknownFields: true,
    ...config
  };

  const lines = rawInput.trim().split('\n');
  if (lines.length === 0) {
    return {
      success: [],
      failed: 0,
      errors: ['No data provided'],
      fieldMappingReport: {
        mappedFields: [],
        unsupportedFields: [],
        skippedFields: []
      }
    };
  }

  const success: ParsedGameRun[] = [];
  const errors: string[] = [];
  let failed = 0;

  // Parse header and determine delimiter
  const firstLine = lines[0];
  const delimiter = config.delimiter || detectDelimiter(firstLine);
  
  // Parse headers and create field mapping
  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/["']/g, ''));
  const fieldMappingReport = createFieldMappingReport(headers, fullConfig.supportedFields);

  // Build mapping from CSV column index to camelCase field name (only for supported fields)
  const columnToFieldMap = new Map<number, string>();
  headers.forEach((header, index) => {
    const camelCase = toCamelCase(header);
    if (fullConfig.supportedFields.includes(camelCase)) {
      columnToFieldMap.set(index, camelCase);
    }
  });

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = line.split(delimiter).map(v => v.trim().replace(/["']/g, ''));
      
      // Allow for fewer columns than headers (missing trailing columns are OK)
      if (values.length > headers.length) {
        errors.push(`Row ${i + 1}: Too many columns (expected max ${headers.length}, got ${values.length})`);
        failed++;
        continue;
      }

      // Build field structure using only supported fields
      const fields: Record<string, GameRunField> = {};
      const fieldsByOriginalKey = new Map<string, string>();
      
      // Process each column that maps to a supported field
      for (const [columnIndex, fieldName] of columnToFieldMap.entries()) {
        const rawValue = values[columnIndex] || '';
        if (!rawValue) continue; // Skip empty values
        
        const originalHeader = headers[columnIndex];
        const field = createGameRunField(originalHeader, rawValue);
        
        fields[fieldName] = field;
        fieldsByOriginalKey.set(originalHeader.toLowerCase(), fieldName);
      }

      // Parse timestamp if date/time fields are available
      const timestamp = parseTimestamp(fields);
      
      // Extract key stats from field structure
      const keyStats = extractKeyStatsFromFields(fields);

      const parsedRun: ParsedGameRun = {
        id: crypto.randomUUID(),
        timestamp,
        fields,
        _fieldsByOriginalKey: fieldsByOriginalKey,
        ...keyStats,
      };

      success.push(parsedRun);
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failed++;
    }
  }

  return { 
    success, 
    failed, 
    errors, 
    fieldMappingReport 
  };
}

/**
 * Auto-detect delimiter from the first line
 */
function detectDelimiter(firstLine: string): string {
  // Count occurrences of potential delimiters
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;

  // Return the delimiter with the highest count
  if (tabCount >= commaCount && tabCount >= semicolonCount) {
    return '\t';
  } else if (commaCount >= semicolonCount) {
    return ',';
  } else {
    return ';';
  }
}

/**
 * Create field mapping report showing which CSV headers map to supported fields
 */
function createFieldMappingReport(
  headers: string[], 
  supportedFields: string[]
): FieldMappingReport {
  const mappedFields = headers.map(header => {
    const camelCase = toCamelCase(header);
    const supported = supportedFields.includes(camelCase);
    return { csvHeader: header, camelCase, supported };
  });

  const unsupportedFields = mappedFields
    .filter(field => !field.supported)
    .map(field => field.csvHeader);

  const skippedFields = unsupportedFields; // For now, all unsupported fields are skipped

  return {
    mappedFields,
    unsupportedFields,
    skippedFields
  };
}

/**
 * Parse timestamp from date and time fields if available
 */
function parseTimestamp(fields: Record<string, GameRunField>): Date {
  const dateField = fields.date;
  const timeField = fields.time;

  try {
    if (dateField && timeField) {
      const dateStr = dateField.rawValue;
      const timeStr = timeField.rawValue;
      const timestamp = new Date(`${dateStr} ${timeStr}`);
      
      if (!isNaN(timestamp.getTime())) {
        return timestamp;
      }
    } else if (dateField) {
      const timestamp = new Date(dateField.rawValue);
      if (!isNaN(timestamp.getTime())) {
        return timestamp;
      }
    }
  } catch {
    // Fall through to default
  }

  return new Date(); // Default to current time
}

/**
 * Extract key statistics from fields for cached properties
 */
function extractKeyStatsFromFields(fields: Record<string, GameRunField>): {
  tier: number;
  wave: number;
  coinsEarned: number;
  cellsEarned: number;
  realTime: number;
  runType: 'farm' | 'tournament';
} {
  const tier = (fields.tier?.value as number) || 0;
  const tierStr = (fields.tier?.rawValue) || '';
  const runType: 'farm' | 'tournament' = /\+/.test(tierStr) ? 'tournament' : 'farm';
  
  return {
    tier,
    wave: (fields.wave?.value as number) || 0,
    coinsEarned: (fields.coinsEarned?.value as number) || 0,
    cellsEarned: (fields.cellsEarned?.value as number) || 0,
    realTime: (fields.realTime?.value as number) || 0,
    runType
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

/**
 * Get list of supported fields for validation
 */
export function getSupportedFields(): string[] {
  return [...SUPPORTED_FIELDS];
}