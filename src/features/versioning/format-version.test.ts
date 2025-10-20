import { describe, it, expect } from 'vitest'
import { formatVersionForDisplay } from './format-version'

describe('formatVersionForDisplay', () => {
  describe('standard version formats', () => {
    it('formats version without prefix correctly', () => {
      expect(formatVersionForDisplay('0.1.0')).toBe('v0.1.0')
    })

    it('formats version with existing v prefix correctly', () => {
      expect(formatVersionForDisplay('v0.1.0')).toBe('v0.1.0')
    })

    it('handles version with multiple segments', () => {
      expect(formatVersionForDisplay('1.2.3')).toBe('v1.2.3')
    })
  })

  describe('pre-release and dev versions', () => {
    it('handles dev versions', () => {
      expect(formatVersionForDisplay('0.1.0-dev')).toBe('v0.1.0-dev')
    })

    it('handles pre-release versions', () => {
      expect(formatVersionForDisplay('0.1.0-beta.1')).toBe('v0.1.0-beta.1')
    })

    it('handles alpha versions', () => {
      expect(formatVersionForDisplay('1.0.0-alpha.2')).toBe('v1.0.0-alpha.2')
    })

    it('handles rc versions', () => {
      expect(formatVersionForDisplay('2.5.0-rc.1')).toBe('v2.5.0-rc.1')
    })
  })

  describe('edge cases and fallbacks', () => {
    it('handles undefined version', () => {
      expect(formatVersionForDisplay(undefined)).toBe('v0.0.0-dev')
    })

    it('handles empty string', () => {
      expect(formatVersionForDisplay('')).toBe('v0.0.0-dev')
    })

    it('handles whitespace-only string', () => {
      expect(formatVersionForDisplay('   ')).toBe('v   ')
    })

    it('handles version with leading whitespace', () => {
      expect(formatVersionForDisplay('  1.2.3')).toBe('v  1.2.3')
    })

    it('handles version with trailing whitespace', () => {
      expect(formatVersionForDisplay('1.2.3  ')).toBe('v1.2.3  ')
    })
  })

  describe('unusual but valid formats', () => {
    it('handles very large version numbers', () => {
      expect(formatVersionForDisplay('999.999.999')).toBe('v999.999.999')
    })

    it('handles single-digit version components', () => {
      expect(formatVersionForDisplay('1.0.0')).toBe('v1.0.0')
    })

    it('handles build metadata', () => {
      expect(formatVersionForDisplay('1.0.0+20130313144700')).toBe('v1.0.0+20130313144700')
    })

    it('handles complex pre-release with build metadata', () => {
      expect(formatVersionForDisplay('1.0.0-beta+exp.sha.5114f85')).toBe('v1.0.0-beta+exp.sha.5114f85')
    })
  })

  describe('malformed inputs (graceful degradation)', () => {
    it('handles version with double v prefix', () => {
      expect(formatVersionForDisplay('vv1.2.3')).toBe('vv1.2.3')
    })

    it('handles non-standard version format', () => {
      expect(formatVersionForDisplay('release-2024')).toBe('vrelease-2024')
    })

    it('handles version with special characters', () => {
      expect(formatVersionForDisplay('1.2.3-feature/test')).toBe('v1.2.3-feature/test')
    })
  })
})
