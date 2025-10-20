import { formatVersionForDisplay } from './format-version'

/**
 * Hook to access the application version
 * @returns The formatted version string
 */
export function useVersion(): string {
  // Access the environment variable injected at build time
  const rawVersion = import.meta.env.VITE_APP_VERSION
  return formatVersionForDisplay(rawVersion)
}
