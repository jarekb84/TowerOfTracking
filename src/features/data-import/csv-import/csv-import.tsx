import { Button, DialogTrigger, ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogBody, ResponsiveDialogFooter } from '@/components/ui';
import { FileText } from 'lucide-react';
import { DuplicateInfo } from '@/shared/domain/duplicate-detection/duplicate-info';
import { useCsvImport } from './use-csv-import';
import { CsvInputSection } from './input/csv-input-section';
import { DelimiterControls } from './delimiter/delimiter-controls';
import { FieldMappingReport } from './field-mapping/field-mapping-report';
import { ImportStatusCard } from './validation/import-status-card';
import { ImportPreview } from './preview/import-preview';

interface CsvImportProps {
  className?: string;
}

export function CsvImport({ className }: CsvImportProps) {
  const {
    inputData,
    isDialogOpen,
    parseResult,
    selectedDelimiter,
    customDelimiter,
    duplicateResult,
    resolution,
    setIsDialogOpen,
    handlePaste,
    handleInputChange,
    handleDelimiterChange,
    handleCustomDelimiterChange,
    handleImport,
    handleCancel,
    setResolution,
    importFile
  } = useCsvImport();

  return (
    <div className={className}>
      <ResponsiveDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        trigger={
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Import CSV/TSV
            </Button>
        </DialogTrigger>
        }
      >
        <ResponsiveDialogContent className="sm:max-w-7xl">
          <ResponsiveDialogHeader
            title="Import CSV/Tab-Delimited Data"
            description="Import game run data from any CSV format. Column headers will be automatically mapped to supported fields. Use any field names - they'll be converted to camelCase and validated against the 84 supported fields."
          />
          
          <ResponsiveDialogBody>
            <div className="space-y-4">
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
            </div>
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter mobileLayout="1-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!parseResult?.success || parseResult.success.length === 0}
              className="h-11"
            >
              {duplicateResult && duplicateResult.duplicates.length > 0
                ? (resolution === 'overwrite' 
                    ? `Import ${duplicateResult.newRuns.length} + Overwrite ${duplicateResult.duplicates.length}`
                    : `Import ${duplicateResult.newRuns.length} New Only`
                  )
                : `Import ${parseResult?.success?.length || 0} Runs`
              }
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}