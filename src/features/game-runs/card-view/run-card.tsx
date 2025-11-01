import { useMemo } from 'react';
import { MobileCard, MobileCardHeader, MobileCardContent, MobileCardSection } from '@/components/ui';
import { StickyNote, Skull } from 'lucide-react';
import { RunDetails } from './run-details';
import { extractRunCardData } from './run-card-utils';
import { ExpandButton, DeleteButton } from '../table-ui/table-action-buttons';
import type { ParsedGameRun } from '@/shared/types/game-run.types';

interface RunCardProps {
  run: ParsedGameRun;
  onToggleExpanded: () => void;
  isExpanded: boolean;
  onRemove: () => void;
}

export function RunCard({ run, onToggleExpanded, isExpanded, onRemove }: RunCardProps) {
  const { header, progress, economy } = useMemo(() => extractRunCardData(run), [run]);
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onToggleExpanded();
  };
  
  return (
    <MobileCard 
      variant="elevated" 
      interactive 
      className="p-4 cursor-pointer" 
      onClick={handleCardClick}
    >
      <MobileCardContent>
        {/* Card Header - Date, Time, Duration */}
        <MobileCardHeader>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="text-sm font-medium text-foreground font-mono">
              {header.dateStr}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {header.timeStr} • {header.shortDuration}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {header.hasNotes && (
              <StickyNote className="h-4 w-4 text-orange-400" />
            )}
            <ExpandButton 
              isExpanded={isExpanded}
              onToggle={onToggleExpanded}
              size="compact"
            />
            <DeleteButton onDelete={onRemove} size="compact" />
          </div>
        </MobileCardHeader>
        
        {/* Progress Info Row */}
        <MobileCardSection>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Tier</span>
                <span className="font-semibold text-orange-400">T{progress.tier}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Wave</span>
                <span className="font-medium text-foreground">W{progress.wave}</span>
              </div>
            </div>
            {progress.killedBy && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Skull className="h-3.5 w-3.5 text-red-400" />
                <span className="truncate max-w-20 text-xs">{progress.killedBy}</span>
              </div>
            )}
          </div>
        </MobileCardSection>
        
        {/* Economy Row */}
        <MobileCardSection>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/20 rounded-md p-3 space-y-1.5 transition-colors duration-200 hover:bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">Coins</span>
                <span className="font-semibold text-foreground">{economy.coins}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground/80">per hour</span>
                <span className="text-muted-foreground">{economy.coinsPerHour}</span>
              </div>
            </div>
            <div className="bg-muted/20 rounded-md p-3 space-y-1.5 transition-colors duration-200 hover:bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">Cells</span>
                <span className="font-semibold text-foreground">{economy.cells}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground/80">per hour</span>
                <span className="text-muted-foreground">{economy.cellsPerHour}</span>
              </div>
            </div>
          </div>
        </MobileCardSection>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-border/50 pt-4">
            <RunDetails run={run} />
          </div>
        )}
      </MobileCardContent>
    </MobileCard>
  );
}