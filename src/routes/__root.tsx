import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { PostHogProvider } from 'posthog-js/react'

import { ThemeProvider } from '../features/theming'
import { DataProvider } from '../features/data-tracking'

import { useEffect, useState } from 'react'

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
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

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
              <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-6">
                  <Link to="/" className="flex items-center gap-2 font-semibold">
                    <span className="text-xl">Tower of Tracking</span>
                  </Link>
                  <nav className="flex items-center gap-6 text-sm">
                    <Link to="/" className="text-muted-foreground hover:text-foreground">
                      Game Runs
                    </Link>
                    <Link to="/charts" className="text-muted-foreground hover:text-foreground">
                      Charts
                    </Link>
                    <Link to="/settings" className="text-muted-foreground hover:text-foreground">
                      Settings
                    </Link>
                  </nav>
                </div>
              </header>
              {children}
            </DataProvider>
          </ThemeProvider>
        </PostHogClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
