/**
 * Formats a version string for display in the UI
 * @param version - The version string (e.g., "0.1.0" or "0.1.0-dev")
 * @returns Formatted version string with "v" prefix (e.g., "v0.1.0")
 */
export function formatVersionForDisplay(version: string | undefined): string {
  if (!version) {
    return 'v0.0.0-dev'
  }

  // Remove any existing 'v' prefix to normalize
  const normalized = version.startsWith('v') ? version.slice(1) : version

  // Add 'v' prefix
  return `v${normalized}`
}
