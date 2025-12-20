import { createFileRoute } from '@tanstack/react-router'
import { ModuleCalculator } from '@/features/tools/module-calculator/module-calculator'

export const Route = createFileRoute('/tools/module-calculator')({
  component: ModuleCalculatorPage,
})

function ModuleCalculatorPage() {
  return <ModuleCalculator />
}
