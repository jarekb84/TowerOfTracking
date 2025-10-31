import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui';
import { format } from 'date-fns';
import { formatNumber, formatDuration, calculatePerHour, formatTierLabel } from '@/features/analysis/shared/data-parser';
import { getFieldValue, getFieldRaw } from '@/features/analysis/shared/field-utils';
import { capitalizeFirst } from '../../data-tracking/utils/string-formatters';
import { ParsedGameRun, RunType } from '../../data-tracking/types/game-run.types';
import { RunTypeIndicator } from '../../data-tracking/components/run-type-indicator';

interface DataInputPreviewProps {
  previewData: ParsedGameRun;
  selectedRunType: string;
}

export function DataInputPreview({ previewData, selectedRunType }: DataInputPreviewProps) {
  return (
    <Card className="border-orange-500/30 bg-card/60 backdrop-blur-sm mt-6 shadow-lg shadow-orange-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Preview</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Here&apos;s how your data will be interpreted
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <h4 className="font-medium text-sm mb-2.5 text-foreground/90">Key Stats</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Type:</span>
                <div className="flex items-center gap-2">
                  <RunTypeIndicator runType={selectedRunType as RunType} size="md" />
                  <span className="text-foreground">{capitalizeFirst(selectedRunType)}</span>
                </div>
              </div>
              {previewData.realTime && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Duration:</span>
                  <span className="text-foreground font-medium">{formatDuration(previewData.realTime)}</span>
                </div>
              )}
              {previewData && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Tier:</span>
                  <span className="text-foreground font-medium">{formatTierLabel(getFieldRaw(previewData, 'tier'), previewData.tier)}</span>
                </div>
              )}
              {previewData.wave && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Wave:</span>
                  <span className="text-foreground font-medium">{formatNumber(previewData.wave)}</span>
                </div>
              )}
              {getFieldValue<string>(previewData, 'killedBy') && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Killed By:</span>
                  <span className="text-foreground">{getFieldValue<string>(previewData, 'killedBy')}</span>
                </div>
              )}
              {previewData.coinsEarned && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Coins:</span>
                  <span className="text-foreground font-medium">
                    {formatNumber(previewData.coinsEarned)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({formatNumber(calculatePerHour(previewData.coinsEarned, previewData.realTime || 0))}/hr)
                    </span>
                  </span>
                </div>
              )}
              {previewData.cellsEarned && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Cells:</span>
                  <span className="text-foreground font-medium">
                    {formatNumber(previewData.cellsEarned)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({formatNumber(calculatePerHour(previewData.cellsEarned, previewData.realTime || 0))}/hr)
                    </span>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Timestamp:</span>
                <span className="text-foreground text-xs">{format(previewData.timestamp, "PPp")}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}