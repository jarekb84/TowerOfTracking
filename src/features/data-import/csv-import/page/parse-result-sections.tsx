import { FieldMappingReport } from '../field-mapping/field-mapping-report';
import { ImportStatusCard } from '../validation/import-status-card';
import { ImportPreview } from '../preview/import-preview';
import type { CsvParseResult } from '../types';

interface ParseResultSectionsProps {
  parseResult: CsvParseResult | null;
}

/**
 * Renders the parse result dependent sections of the import page.
 * Groups together field mapping, status, and preview components.
 */
export function ParseResultSections({ parseResult }: ParseResultSectionsProps) {
  if (!parseResult) return null;

  return (
    <>
      <FieldMappingReport parseResult={parseResult} />
      <ImportStatusCard parseResult={parseResult} />
      {parseResult.success && <ImportPreview runs={parseResult.success} />}
    </>
  );
}
