import type { ParsedGameRun, CsvDelimiter } from '../types/game-run.types';
import { format } from 'date-fns';
import { getDelimiterString } from './csv-parser';

// App-specific field mappings for generated fields
const APP_FIELD_MAPPINGS: Record<string, string> = {
  date: 'Date',
  time: 'Time', 
  notes: 'Notes'
};

// Interface for field information
interface FieldInfo {
  fieldName: string;      // camelCase internal name
  originalKey: string;    // Original key for CSV header
  isAppGenerated: boolean; // Whether this is an app-generated field
}

// Interface for delimiter conflict information
export interface DelimiterConflict {
  fieldName: string;
  originalKey: string;
  conflictingValues: string[];
  affectedRunCount: number;
}

// Interface for export configuration
export interface CsvExportConfig {
  delimiter: CsvDelimiter;
  customDelimiter?: string;
  includeAppFields: boolean; // Whether to include Date/Time columns
}

// Interface for export result
export interface CsvExportResult {
  csvContent: string;
  conflicts: DelimiterConflict[];
  fieldCount: number;
  rowCount: number;
}

/**
 * Get all unique field keys from runs with their original keys
 */
function getAllFieldKeys(runs: ParsedGameRun[]): FieldInfo[] {
  const fieldMap = new Map<string, FieldInfo>();
  
  // Add app-generated fields if requested
  for (const [fieldName, originalKey] of Object.entries(APP_FIELD_MAPPINGS)) {
    fieldMap.set(fieldName, {
      fieldName,
      originalKey,
      isAppGenerated: true
    });
  }
  
  // Collect all fields from runs
  for (const run of runs) {
    for (const [fieldName, field] of Object.entries(run.fields)) {
      if (!fieldMap.has(fieldName)) {
        fieldMap.set(fieldName, {
          fieldName,
          originalKey: field.originalKey,
          isAppGenerated: false
        });
      }
    }
  }
  
  return Array.from(fieldMap.values()).sort((a, b) => {
    // Sort app-generated fields first (Date, Time, Notes), then alphabetically
    if (a.isAppGenerated && !b.isAppGenerated) return -1;
    if (!a.isAppGenerated && b.isAppGenerated) return 1;
    return a.originalKey.localeCompare(b.originalKey);
  });
}

/**
 * Detect delimiter conflicts in the data
 */
export function detectDelimiterConflicts(
  runs: ParsedGameRun[], 
  delimiter: string,
  includeAppFields: boolean = true
): DelimiterConflict[] {
  const conflicts: Map<string, DelimiterConflict> = new Map();
  const fieldKeys = getAllFieldKeys(runs);
  
  for (const run of runs) {
    for (const fieldInfo of fieldKeys) {
      // Skip app fields if not included
      if (fieldInfo.isAppGenerated && !includeAppFields) continue;
      
      let value = '';
      
      if (fieldInfo.isAppGenerated) {
        // Handle app-generated fields
        if (fieldInfo.fieldName === 'date') {
          value = format(run.timestamp, 'yyyy-MM-dd');
        } else if (fieldInfo.fieldName === 'time') {
          value = format(run.timestamp, 'HH:mm:ss');
        } else if (fieldInfo.fieldName === 'notes') {
          value = run.fields.notes?.rawValue || '';
        }
      } else {
        // Handle regular fields
        const field = run.fields[fieldInfo.fieldName];
        value = field?.rawValue || '';
      }
      
      // Check if value contains delimiter
      if (value.includes(delimiter)) {
        const key = fieldInfo.fieldName;
        
        if (!conflicts.has(key)) {
          conflicts.set(key, {
            fieldName: fieldInfo.fieldName,
            originalKey: fieldInfo.originalKey,
            conflictingValues: [],
            affectedRunCount: 0
          });
        }
        
        const conflict = conflicts.get(key)!;
        conflict.affectedRunCount++;
        
        // Add unique conflicting values (max 3 examples)
        if (conflict.conflictingValues.length < 3 && !conflict.conflictingValues.includes(value)) {
          conflict.conflictingValues.push(value);
        }
      }
    }
  }
  
  return Array.from(conflicts.values());
}

/**
 * Escape CSV value if it contains delimiter, quotes, or newlines
 */
function escapeCsvValue(value: string, delimiter: string): string {
  // If value contains delimiter, quotes, or newlines, wrap in quotes and escape internal quotes
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export runs to CSV format
 */
export function exportToCsv(
  runs: ParsedGameRun[],
  config: CsvExportConfig
): CsvExportResult {
  if (runs.length === 0) {
    return {
      csvContent: '',
      conflicts: [],
      fieldCount: 0,
      rowCount: 0
    };
  }
  
  const delimiter = config.delimiter === 'custom' 
    ? config.customDelimiter || ','
    : getDelimiterString(config.delimiter);
  
  // Get field information
  const fieldKeys = getAllFieldKeys(runs).filter(field => 
    !field.isAppGenerated || config.includeAppFields
  );
  
  // Detect conflicts
  const conflicts = detectDelimiterConflicts(runs, delimiter, config.includeAppFields);
  
  // Build CSV content
  const lines: string[] = [];
  
  // Header row
  const headers = fieldKeys.map(field => escapeCsvValue(field.originalKey, delimiter));
  lines.push(headers.join(delimiter));
  
  // Data rows
  for (const run of runs) {
    const values: string[] = [];
    
    for (const fieldInfo of fieldKeys) {
      let rawValue = '';
      
      if (fieldInfo.isAppGenerated) {
        // Handle app-generated fields
        if (fieldInfo.fieldName === 'date') {
          rawValue = format(run.timestamp, 'yyyy-MM-dd');
        } else if (fieldInfo.fieldName === 'time') {
          rawValue = format(run.timestamp, 'HH:mm:ss');
        } else if (fieldInfo.fieldName === 'notes') {
          rawValue = run.fields.notes?.rawValue || '';
        }
      } else {
        // Handle regular fields
        const field = run.fields[fieldInfo.fieldName];
        rawValue = field?.rawValue || '';
      }
      
      values.push(escapeCsvValue(rawValue, delimiter));
    }
    
    lines.push(values.join(delimiter));
  }
  
  return {
    csvContent: lines.join('\n'),
    conflicts,
    fieldCount: fieldKeys.length,
    rowCount: runs.length
  };
}

/**
 * Generate filename for export
 */
export function generateExportFilename(runCount: number): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  return `tower_tracking_export_${runCount}_runs_${timestamp}.csv`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }
  
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    throw new Error('Failed to copy to clipboard');
  }
}

/**
 * Download text as file
 */
export function downloadAsFile(content: string, filename: string): void {
  try {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      throw new Error('File download not supported');
    }
  } catch (error) {
    throw new Error('Failed to download file');
  }
}