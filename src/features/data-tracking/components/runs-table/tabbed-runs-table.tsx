import { useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui';
import { useData } from '../../hooks/use-data';
import { RunType } from '../../types/game-run.types';
import { FarmingRunsTable } from './farming-runs-table';
import { TournamentRunsTable } from './tournament-runs-table';
import { MilestoneRunsTable } from './milestone-runs-table';
import { useRunsNavigation, RunsTabType } from '../../hooks/use-runs-navigation';
import { RunTypeIndicator } from '../run-type-indicator';

export function TabbedRunsTable() {
  const { runs, removeRun } = useData();
  const { activeTab, setActiveTab } = useRunsNavigation();

  const handleTabChange = (value: string) => {
    setActiveTab(value as RunsTabType);
  };

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
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="mb-6 w-full sm:w-auto">
        <TabsTrigger value={RunType.FARM} className="flex-1 sm:flex-initial gap-1.5">
          <RunTypeIndicator runType={RunType.FARM} size="sm" />
          <span className="hidden sm:inline">Farm Runs</span>
          <span className="sm:hidden">Farm</span>
          <span className="ml-0.5">({farmingRuns.length})</span>
        </TabsTrigger>
        <TabsTrigger value={RunType.TOURNAMENT} className="flex-1 sm:flex-initial gap-1.5">
          <RunTypeIndicator runType={RunType.TOURNAMENT} size="sm" />
          <span className="hidden sm:inline">Tournament Runs</span>
          <span className="sm:hidden">Tournament</span>
          <span className="ml-0.5">({tournamentRuns.length})</span>
        </TabsTrigger>
        <TabsTrigger value={RunType.MILESTONE} className="flex-1 sm:flex-initial gap-1.5">
          <RunTypeIndicator runType={RunType.MILESTONE} size="sm" />
          <span className="hidden sm:inline">Milestone Runs</span>
          <span className="sm:hidden">Milestone</span>
          <span className="ml-0.5">({milestoneRuns.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value={RunType.FARM}>
        <FarmingRunsTable runs={farmingRuns} removeRun={removeRun} />
      </TabsContent>

      <TabsContent value={RunType.TOURNAMENT}>
        <TournamentRunsTable runs={tournamentRuns} removeRun={removeRun} />
      </TabsContent>

      <TabsContent value={RunType.MILESTONE}>
        <MilestoneRunsTable runs={milestoneRuns} removeRun={removeRun} />
      </TabsContent>
    </Tabs>
  );
}