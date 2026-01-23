import { createFileRoute } from '@tanstack/react-router'
import { SpendingPlanner } from '@/features/spending-planner/spending-planner'

export const Route = createFileRoute('/tools/spending-planner')({
  component: SpendingPlannerPage,
})

function SpendingPlannerPage() {
  return <SpendingPlanner />
}
