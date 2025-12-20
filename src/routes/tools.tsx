import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/tools')({
  component: ToolsLayout,
})

function ToolsLayout() {
  return (
    <div className="max-w-9xl mx-auto p-6">
      <Outlet />
    </div>
  )
}
