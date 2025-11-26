import { Button, Textarea, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription } from '@/components/ui';
import { Download, Copy, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { DelimiterConflict } from './csv-exporter';
import {
  getCopyButtonClassName,
  getDownloadButtonClassName,
  formatConflictExamples,
  getCopyButtonText,
  getDownloadButtonText
} from './csv-export-helpers';

interface ConflictsCardProps {
  conflicts: DelimiterConflict[];
}

/**
 * Displays delimiter conflict warnings when field values contain the selected delimiter.
 */
export function ConflictsCard({ conflicts }: ConflictsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-orange-400">
          <AlertTriangle className="h-5 w-5" />
          Delimiter Conflicts Detected
        </CardTitle>
        <CardDescription>
          Some field values contain the selected delimiter. These will be automatically quoted in the CSV.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {conflicts.map((conflict, index) => (
            <div key={index} className="bg-orange-500/10 border border-orange-500/30 rounded p-3">
              <div className="font-medium text-orange-300 mb-1">
                {conflict.originalKey} ({conflict.affectedRunCount} runs affected)
              </div>
              <div className="text-sm text-orange-200/80">
                Examples: {formatConflictExamples(conflict.conflictingValues)}
              </div>
            </div>
          ))}
          <Alert className="bg-orange-500/10 border-orange-500/30">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-200/80">
              Consider using a different delimiter (Tab or Semicolon) to avoid quoting.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}

interface CsvPreviewCardProps {
  csvContent: string;
  isGenerating: boolean;
  copySuccess: boolean;
  downloadSuccess: boolean;
  onCopy: () => void;
  onDownload: () => void;
}

/**
 * Displays the CSV preview with copy and download actions.
 */
export function CsvPreviewCard({
  csvContent,
  isGenerating,
  copySuccess,
  downloadSuccess,
  onCopy,
  onDownload
}: CsvPreviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">CSV Preview</CardTitle>
        <CardDescription>
          Preview of the CSV data that will be exported
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Textarea
            value={csvContent}
            readOnly
            className="font-mono text-sm h-48 resize-none"
            placeholder="Generated CSV content will appear here..."
          />

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={onCopy}
              disabled={isGenerating}
              className={`w-full sm:w-auto ${getCopyButtonClassName(copySuccess)}`}
            >
              {copySuccess ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {getCopyButtonText(copySuccess)}
            </Button>

            <Button
              onClick={onDownload}
              disabled={isGenerating}
              variant="outline"
              className={`w-full sm:w-auto ${getDownloadButtonClassName(downloadSuccess)}`}
            >
              {downloadSuccess ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {getDownloadButtonText(downloadSuccess)}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ExportErrorAlertProps {
  error: string;
}

/**
 * Displays export error message.
 */
export function ExportErrorAlert({ error }: ExportErrorAlertProps) {
  return (
    <Alert className="bg-red-500/10 border-red-500/30">
      <XCircle className="h-4 w-4 text-red-400" />
      <AlertDescription className="text-red-300">
        {error}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Displays loading state during CSV generation.
 */
export function ExportLoadingAlert() {
  return (
    <Alert className="bg-blue-500/10 border-blue-500/30">
      <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
      <AlertDescription className="text-blue-300">
        Generating CSV export...
      </AlertDescription>
    </Alert>
  );
}

