import { createFileRoute } from '@tanstack/react-router'
import { ExportPageContent } from '@/features/data-export/csv-export/export-page-content'

export const Route = createFileRoute('/settings/export')({
  component: ExportPage,
})

function ExportPage() {
  return <ExportPageContent />
}
