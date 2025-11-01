import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import type { CsvParseResult } from '@/shared/types/game-run.types';

interface ImportStatusCardProps {
  parseResult: CsvParseResult;
}

export function ImportStatusCard({ parseResult }: ImportStatusCardProps) {
  if (!parseResult || (parseResult.success.length === 0 && parseResult.failed === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Import Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">✓ {parseResult.success.length} runs will be imported</span>
            {parseResult.failed > 0 && (
              <span className="text-red-600">✗ {parseResult.failed} rows failed to parse</span>
            )}
          </div>
          {parseResult.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
              <ul className="text-sm text-red-600 space-y-1">
                {parseResult.errors.slice(0, 5).map((error, index) => (
                  <li key={index} className="text-xs">• {error}</li>
                ))}
                {parseResult.errors.length > 5 && (
                  <li className="text-xs">• ... and {parseResult.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
