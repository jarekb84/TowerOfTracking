import { createFileRoute } from '@tanstack/react-router'
import { LocaleSettingsContent } from '@/features/settings/locale-settings/locale-settings-content'

export const Route = createFileRoute('/settings/locale')({
  component: LocalePage,
})

function LocalePage() {
  return <LocaleSettingsContent />
}
