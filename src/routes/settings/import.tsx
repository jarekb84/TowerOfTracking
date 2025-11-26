import { createFileRoute } from '@tanstack/react-router'
import { ImportPageContent } from '@/features/data-import/csv-import/page/import-page-content'

export const Route = createFileRoute('/settings/import')({
  component: ImportPage,
})

function ImportPage() {
  return <ImportPageContent />
}
