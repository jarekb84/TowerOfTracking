import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { PostHogProvider } from 'posthog-js/react'

import { ThemeProvider } from '../features/theming'
import { DataProvider } from '../shared/domain/data-provider'
import { GlobalDataInputProvider } from '../features/data-import/global-data-input-provider'
import { NavigationProvider, AppLayout } from '../features/navigation'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Tower of Tracking',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})


const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST
}

function PostHogClientProvider({ children }: { children: React.ReactNode }) {
  // Use synchronous check to avoid re-render flash
  const isClient = typeof window !== 'undefined'

  if (!isClient) {
    return <>{children}</>
  }

  return (
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
      {children}
    </PostHogProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <PostHogClientProvider>
          <ThemeProvider>
            <DataProvider>
              <GlobalDataInputProvider>
                <NavigationProvider>
                  <AppLayout>
                    {children}
                  </AppLayout>
                </NavigationProvider>
              </GlobalDataInputProvider>
            </DataProvider>
          </ThemeProvider>
        </PostHogClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
