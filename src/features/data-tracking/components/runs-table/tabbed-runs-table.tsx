import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui';
import { useData } from '../../hooks/use-data';
import { RunType } from '../../types/game-run.types';
import { FarmingRunsTable } from './farming-runs-table';
import { TournamentRunsTable } from './tournament-runs-table';
import { MilestoneRunsTable } from './milestone-runs-table';

type TabValue = 'farming' | 'tournament' | 'milestone';

export function TabbedRunsTable() {
  const { runs, removeRun } = useData();
  const [activeTab, setActiveTab] = useState<TabValue>('farming');

  // Filter runs by type
  const { farmingRuns, tournamentRuns, milestoneRuns } = useMemo(() => {
    const farming = runs.filter(run => run.runType === RunType.FARM);
    const tournament = runs.filter(run => run.runType === RunType.TOURNAMENT);
    const milestone = runs.filter(run => run.runType === RunType.MILESTONE);
    
    return {
      farmingRuns: farming,
      tournamentRuns: tournament,
      milestoneRuns: milestone,
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
        <TabsTrigger value="milestone" className="flex-1 sm:flex-initial">
          <span className="hidden sm:inline">Milestone Runs</span>
          <span className="sm:hidden">Milestone</span>
          <span className="ml-1">({milestoneRuns.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="farming">
        <FarmingRunsTable runs={farmingRuns} removeRun={removeRun} />
      </TabsContent>

      <TabsContent value="tournament">
        <TournamentRunsTable runs={tournamentRuns} removeRun={removeRun} />
      </TabsContent>

      <TabsContent value="milestone">
        <MilestoneRunsTable runs={milestoneRuns} removeRun={removeRun} />
      </TabsContent>
    </Tabs>
  );
}