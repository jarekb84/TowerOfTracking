import { createFileRoute } from '@tanstack/react-router'
import { ChartPageLayout } from '@/shared/layouts'
import { ActivityHeatmap } from '@/features/analysis/activity-heatmap/activity-heatmap'

export const Route = createFileRoute('/charts/activity')({
  component: ActivityHeatmapRoute,
})

function ActivityHeatmapRoute() {
  return (
    <ChartPageLayout
      accentColor="amber"
      title="Activity Heatmap"
      description="Visualize your play sessions across a weekly calendar to identify patterns and optimize your gaming schedule."
    >
      <ActivityHeatmap />
    </ChartPageLayout>
  )
}
