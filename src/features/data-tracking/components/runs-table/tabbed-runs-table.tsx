import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui';
import { useData } from '../../hooks/use-data';
import { RunType } from '../../types/game-run.types';
import { FarmingRunsTable } from './farming-runs-table';
import { TournamentRunsTable } from './tournament-runs-table';

type TabValue = 'farming' | 'tournament' | 'milestone';

export function TabbedRunsTable() {
  const { runs, removeRun } = useData();
  const [activeTab, setActiveTab] = useState<TabValue>('farming');

  // Filter runs by type
  const { farmingRuns, tournamentRuns } = useMemo(() => {
    const farming = runs.filter(run => run.runType === RunType.FARM);
    const tournament = runs.filter(run => run.runType === RunType.TOURNAMENT);
    
    return {
      farmingRuns: farming,
      tournamentRuns: tournament,
    };
  }, [runs]);

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
      <TabsList className="mb-6 w-full sm:w-auto">
        <TabsTrigger value="farming" className="flex-1 sm:flex-initial">
          <span className="hidden sm:inline">Farming Runs</span>
          <span className="sm:hidden">Farming</span>
          <span className="ml-1">({farmingRuns.length})</span>
        </TabsTrigger>
        <TabsTrigger value="tournament" className="flex-1 sm:flex-initial">
          <span className="hidden sm:inline">Tournament Runs</span>
          <span className="sm:hidden">Tournament</span>
          <span className="ml-1">({tournamentRuns.length})</span>
        </TabsTrigger>
        <TabsTrigger value="milestone" disabled className="flex-1 sm:flex-initial">
          <span className="hidden sm:inline">Milestone Runs</span>
          <span className="sm:hidden">Milestone</span>
          <span className="ml-1">(0)</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="farming">
        <FarmingRunsTable runs={farmingRuns} removeRun={removeRun} />
      </TabsContent>

      <TabsContent value="tournament">
        <TournamentRunsTable runs={tournamentRuns} removeRun={removeRun} />
      </TabsContent>

      <TabsContent value="milestone">
        <div className="text-center py-12 text-muted-foreground">
          Milestone runs feature coming soon...
        </div>
      </TabsContent>
    </Tabs>
  );
}