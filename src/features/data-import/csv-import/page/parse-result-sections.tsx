import { FieldMappingReport } from '../field-mapping/field-mapping-report';
import { ImportStatusCard } from './import-status-card';
import { BulkImportDateWarning } from '../date-warning/bulk-import-date-warning';
import { MissingBattleDateWarning } from '../date-warning/missing-battle-date-warning';
import { ImportPreview } from '../preview/import-preview';
import type { CsvParseResult } from '../types';

interface ParseResultSectionsProps {
  parseResult: CsvParseResult | null;
  /** Whether to derive battleDate from _date/_time fields */
  deriveEnabled: boolean;
  /** Callback when user toggles the auto-fix option */
  onDeriveToggle: (enabled: boolean) => void;
}

/**
 * Renders the parse result dependent sections of the import page.
 * Groups together field mapping, status, and preview components.
 */
export function ParseResultSections({
  parseResult,
  deriveEnabled,
  onDeriveToggle,
}: ParseResultSectionsProps) {
  if (!parseResult) return null;

  const totalRuns = parseResult.success.length + parseResult.failed;

  return (
    <>
      {/* Missing battleDate column warning - most severe, shown first */}
      {parseResult.missingBattleDateColumn && parseResult.success.length > 0 && (
        <MissingBattleDateWarning totalRuns={parseResult.success.length} />
      )}

      {/* Per-row date validation warnings */}
      {parseResult.dateWarnings && parseResult.dateWarnings.length > 0 && (
        <BulkImportDateWarning
          dateWarnings={parseResult.dateWarnings}
          totalRuns={totalRuns}
          deriveEnabled={deriveEnabled}
          onDeriveToggle={onDeriveToggle}
        />
      )}
      <FieldMappingReport parseResult={parseResult} />
      <ImportStatusCard parseResult={parseResult} />
      {parseResult.success && <ImportPreview runs={parseResult.success} />}
    </>
  );
}
