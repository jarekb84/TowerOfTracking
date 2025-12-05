import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/runs/')({
  beforeLoad: () => {
    throw redirect({
      to: '/runs/farm',
    })
  },
})
