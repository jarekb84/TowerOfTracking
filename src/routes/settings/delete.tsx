import { createFileRoute } from '@tanstack/react-router'
import { DataSettings } from '@/features/settings/data-settings/data-settings'

export const Route = createFileRoute('/settings/delete')({
  component: DeletePage,
})

function DeletePage() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md">
        <DataSettings />
      </div>
    </div>
  )
}
