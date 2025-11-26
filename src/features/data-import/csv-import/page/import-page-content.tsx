import { Card, CardContent, CardHeader, CardTitle, InfoBox } from '@/components/ui';
import { CheckCircle } from 'lucide-react';
import { DuplicateInfo } from '@/shared/domain/duplicate-detection/duplicate-info';
import { useCsvImport } from '../use-csv-import';
import { CsvInputSection } from '../input/csv-input-section';
import { DelimiterControls } from '../delimiter/delimiter-controls';
import { FieldMappingReport } from '../field-mapping/field-mapping-report';
import { ImportStatusCard } from '../validation/import-status-card';
import { ImportPreview } from '../preview/import-preview';
import { StickyActionFooter } from './sticky-action-footer';
import { getImportButtonText } from './import-button-text';

/**
 * Full-page import content component for the /settings/import route.
 * Displays the import workflow without modal wrapper.
 */
export function ImportPageContent() {
  const {
    inputData,
    parseResult,
    selectedDelimiter,
    customDelimiter,
    duplicateResult,
    resolution,
    importSuccess,
    handlePaste,
    handleInputChange,
    handleDelimiterChange,
    handleCustomDelimiterChange,
    handleImport,
    handleClear,
    setResolution,
    importFile
  } = useCsvImport({ pageMode: true });

  const canImport = parseResult?.success && parseResult.success.length > 0;
  const hasData = inputData.trim().length > 0;

  const importButtonText = getImportButtonText(duplicateResult, resolution, parseResult);

  return (
    <div className="relative pb-24">
      {/* Success Alert */}
      {importSuccess && (
        <InfoBox
          variant="success"
          icon={<CheckCircle className="h-5 w-5" />}
          title="Import Successful"
          className="mb-4"
        >
          Game runs imported successfully! You can view them in the Game Runs page.
        </InfoBox>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Import Game Runs</CardTitle>
          <p className="text-sm text-muted-foreground">
            Import game run data from any CSV format. Column headers will be automatically
            mapped to supported fields. Use any field names - they will be converted to
            camelCase and validated against the 84 supported fields.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <CsvInputSection
            inputData={inputData}
            onInputChange={handleInputChange}
            onPaste={handlePaste}
            onFileImport={importFile}
          />

          <DelimiterControls
            selectedDelimiter={selectedDelimiter}
            customDelimiter={customDelimiter}
            onDelimiterChange={handleDelimiterChange}
            onCustomDelimiterChange={handleCustomDelimiterChange}
          />

          {parseResult && <FieldMappingReport parseResult={parseResult} />}

          {parseResult && <ImportStatusCard parseResult={parseResult} />}

          {parseResult?.success && <ImportPreview runs={parseResult.success} />}

          {/* Duplicate Detection - shows immediately when duplicates are found */}
          {duplicateResult && duplicateResult.duplicates.length > 0 && (
            <DuplicateInfo
              batchResult={duplicateResult}
              onResolutionChange={setResolution}
              resolution={resolution}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      {/* Sticky Action Footer */}
      <StickyActionFooter
        visible={hasData}
        onClear={handleClear}
        onImport={handleImport}
        canImport={!!canImport}
        importButtonText={importButtonText}
      />
    </div>
  );
}
