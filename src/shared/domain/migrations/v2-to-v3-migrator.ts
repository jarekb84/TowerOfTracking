import { toCamelCase } from '@/features/analysis/shared/parsing/field-utils';
import { V2_TO_V3_FIELD_MAP } from './v2-to-v3-field-map';
import { INTENTIONALLY_DROPPED_V2_FIELDS } from './intentionally-dropped';
import { V3_COLUMN_PREFIX } from './storage-keys';

/**
 * Pure, transactional migrator from V2 localStorage CSV -> V3 CSV.
 *
 * Input:  tab-delimited V2 CSV (headers + rows) as it exists in the
 *         `tower-tracking-csv-data` localStorage key.
 *
 * Output: tab-delimited V3 CSV where:
 *   - Internal field columns (`_Date`, `_Time`, `_Notes`, `_Run Type`,
 *     `_Rank`) are preserved verbatim.
 *   - Game-field columns are renamed via V2_TO_V3_FIELD_MAP and emitted
 *     with the `v3_` prefix (per PRD §9.1 Option C). When multiple V2
 *     columns map to the same V3 target, the LAST non-empty value in the
 *     row wins.
 *   - Columns listed in INTENTIONALLY_DROPPED_V2_FIELDS are dropped.
 *   - V2 columns that are neither mapped nor dropped are preserved under
 *     `unrecognizedField_<camelCase>` (per PRD F11) so user-custom columns
 *     survive migration.
 *
 * This function is PURE: it does not touch localStorage, the DOM, or any
 * I/O. The caller (see commit-v3-migration.ts in the gate flow) is
 * responsible for writing results back to storage only on success.
 *
 * Transactionality: the function either returns a `success` result with a
 * fully-formed V3 CSV, OR returns an `error` result naming the offending
 * row. On error the function has mutated nothing and the caller leaves
 * V2 storage intact.
 */

interface MigrationSuccess {
  kind: 'success';
  v3Csv: string;
  runCount: number;
  unrecognizedFields: string[];
  droppedFields: string[];
}

interface MigrationError {
  kind: 'error';
  rowIndex: number;
  message: string;
}

export type MigrationResult = MigrationSuccess | MigrationError;

interface ColumnPlan {
  /** The V3 header to emit (includes `v3_`, `_Date`, or `unrecognizedField_` prefix as appropriate). */
  v3Header: string;
  /** True if this column was intentionally dropped. Its values are not emitted. */
  dropped: boolean;
}

const INTERNAL_HEADER_PREFIX = '_';
const STORAGE_DELIMITER = '\t';

function classifyV2Header(rawHeader: string): ColumnPlan {
  const trimmed = rawHeader.trim();

  // Internal fields preserve their display header verbatim. Storage format
  // uses `_Date`, `_Time`, etc. and these carry through V2 -> V3 unchanged.
  if (trimmed.startsWith(INTERNAL_HEADER_PREFIX)) {
    return { v3Header: trimmed, dropped: false };
  }

  const camel = toCamelCase(trimmed);

  if (INTENTIONALLY_DROPPED_V2_FIELDS[camel] !== undefined) {
    return { v3Header: '', dropped: true };
  }

  const mappedTarget = V2_TO_V3_FIELD_MAP[camel];
  if (mappedTarget !== undefined) {
    return { v3Header: `${V3_COLUMN_PREFIX}${mappedTarget}`, dropped: false };
  }

  // Unknown column — preserve value under the reserved namespace so it is
  // not silently lost. All V3 game-like columns carry the `v3_` prefix, so
  // unrecognized ones get `v3_unrecognizedField_<camel>`. The runtime csv
  // parser strips the `v3_` on load, leaving `unrecognizedField_<camel>`
  // as the in-memory key (which downstream code uses to surface these
  // columns in the field-mapping report).
  return { v3Header: `${V3_COLUMN_PREFIX}unrecognizedField_${camel}`, dropped: false };
}

interface ColumnBuildResult {
  plans: ColumnPlan[];
  /** Final ordered list of V3 headers (deduped; internal first, then game, then unrecognized). */
  orderedV3Headers: string[];
  /** Source column indices that write into each V3 header (last-wins order matches column order). */
  sourceIndicesByV3Header: Map<string, number[]>;
  unrecognizedFields: string[];
  droppedFields: string[];
}

function planColumns(v2Headers: string[]): ColumnBuildResult {
  const plans = v2Headers.map((h) => classifyV2Header(h));
  const sourceIndicesByV3Header = new Map<string, number[]>();
  const order: string[] = [];
  const seen = new Set<string>();
  const unrecognizedFields: string[] = [];
  const droppedFields: string[] = [];

  plans.forEach((plan, i) => {
    if (plan.dropped) {
      droppedFields.push(v2Headers[i].trim());
      return;
    }
    if (!seen.has(plan.v3Header)) {
      seen.add(plan.v3Header);
      order.push(plan.v3Header);
      sourceIndicesByV3Header.set(plan.v3Header, []);
    }
    sourceIndicesByV3Header.get(plan.v3Header)!.push(i);

    if (plan.v3Header.startsWith(`${V3_COLUMN_PREFIX}unrecognizedField_`)) {
      unrecognizedFields.push(v2Headers[i].trim());
    }
  });

  // Reorder so internal fields come first, then v3_ game fields, then
  // v3_unrecognizedField_ columns. Within each group, preserve discovery order.
  const internal: string[] = [];
  const game: string[] = [];
  const unrecognized: string[] = [];
  for (const header of order) {
    if (header.startsWith(INTERNAL_HEADER_PREFIX)) {
      internal.push(header);
    } else if (header.startsWith(`${V3_COLUMN_PREFIX}unrecognizedField_`)) {
      unrecognized.push(header);
    } else if (header.startsWith(V3_COLUMN_PREFIX)) {
      game.push(header);
    } else {
      // Should not happen — every non-internal header was mapped into the
      // v3_ namespace. Fall back to the tail so oddities are visible.
      unrecognized.push(header);
    }
  }
  const orderedV3Headers = [...internal, ...game, ...unrecognized];

  return { plans, orderedV3Headers, sourceIndicesByV3Header, unrecognizedFields, droppedFields };
}

function pickLastNonEmpty(values: string[], sourceIndices: number[]): string {
  for (let i = sourceIndices.length - 1; i >= 0; i--) {
    const raw = values[sourceIndices[i]];
    if (raw !== undefined && raw.length > 0) return raw;
  }
  return '';
}

function emptySuccess(): MigrationSuccess {
  return { kind: 'success', v3Csv: '', runCount: 0, unrecognizedFields: [], droppedFields: [] };
}

function transformRow(
  line: string,
  plan: ColumnBuildResult
): string {
  const values = line.split(STORAGE_DELIMITER);
  const outValues = plan.orderedV3Headers.map((v3Header) => {
    const indices = plan.sourceIndicesByV3Header.get(v3Header) ?? [];
    return pickLastNonEmpty(values, indices);
  });
  return outValues.join(STORAGE_DELIMITER);
}

interface RowProcessingResult {
  outputLines: string[];
  runCount: number;
  error?: MigrationError;
}

function processDataRows(lines: string[], plan: ColumnBuildResult): RowProcessingResult {
  const outputLines: string[] = [plan.orderedV3Headers.join(STORAGE_DELIMITER)];
  let runCount = 0;

  for (let rowIdx = 1; rowIdx < lines.length; rowIdx++) {
    const line = lines[rowIdx];
    if (!line || !line.trim()) continue;
    try {
      outputLines.push(transformRow(line, plan));
      runCount++;
    } catch (error) {
      return {
        outputLines,
        runCount,
        error: {
          kind: 'error',
          rowIndex: rowIdx,
          message: `Row ${rowIdx + 1}: ${error instanceof Error ? error.message : String(error)}`,
        },
      };
    }
  }

  return { outputLines, runCount };
}

export function migrateV2CsvToV3(rawV2Csv: string): MigrationResult {
  if (!rawV2Csv || !rawV2Csv.trim()) return emptySuccess();

  const lines = rawV2Csv.split(/\r?\n/);
  if (lines.length === 0) return emptySuccess();

  let plan: ColumnBuildResult;
  try {
    plan = planColumns(lines[0].split(STORAGE_DELIMITER));
  } catch (error) {
    return {
      kind: 'error',
      rowIndex: 0,
      message: `Header classification failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const { outputLines, runCount, error } = processDataRows(lines, plan);
  if (error) return error;

  return {
    kind: 'success',
    v3Csv: outputLines.join('\n'),
    runCount,
    unrecognizedFields: plan.unrecognizedFields,
    droppedFields: plan.droppedFields,
  };
}
