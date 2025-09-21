import { describe, expect, it } from 'vitest'
import { isExternalUrl, createNavLinkClassName, createActiveNavLinkClassName } from './nav-link-utils'

describe('NavLink Utils', () => {
  describe('isExternalUrl', () => {
    it('should return true for http URLs', () => {
      expect(isExternalUrl('http://example.com')).toBe(true)
    })

    it('should return true for https URLs', () => {
      expect(isExternalUrl('https://example.com')).toBe(true)
    })

    it('should return true for Discord invite links', () => {
      expect(isExternalUrl('https://discord.gg/J444xGFbTt')).toBe(true)
    })

    it('should return true for GitHub URLs', () => {
      expect(isExternalUrl('https://github.com/jarekb84/TowerOfTracking')).toBe(true)
    })

    it('should return false for relative paths', () => {
      expect(isExternalUrl('/runs')).toBe(false)
      expect(isExternalUrl('/charts')).toBe(false)
      expect(isExternalUrl('/settings')).toBe(false)
    })

    it('should return false for absolute paths without protocol', () => {
      expect(isExternalUrl('example.com')).toBe(false)
      expect(isExternalUrl('discord.gg/J444xGFbTt')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isExternalUrl('')).toBe(false)
    })

    it('should return false for other protocols', () => {
      expect(isExternalUrl('ftp://example.com')).toBe(false)
      expect(isExternalUrl('mailto:test@example.com')).toBe(false)
    })
  })

  describe('createNavLinkClassName', () => {
    it('should return base classes when no custom className provided', () => {
      const result = createNavLinkClassName()
      expect(result).toContain('group relative flex items-center gap-3')
      expect(result).toContain('text-slate-300 hover:text-slate-100')
      expect(result).toContain('hover:bg-slate-800/60')
      expect(result).toContain('focus-visible:ring-orange-400')
    })

    it('should append custom className when provided', () => {
      const customClass = 'custom-class'
      const result = createNavLinkClassName(customClass)
      expect(result).toContain('group relative flex items-center gap-3')
      expect(result).toContain(customClass)
    })

    it('should handle undefined custom className', () => {
      const result = createNavLinkClassName(undefined)
      expect(result).toContain('group relative flex items-center gap-3')
      expect(result).not.toContain('undefined')
    })

    it('should include all essential navigation styling', () => {
      const result = createNavLinkClassName()
      expect(result).toContain('transition-all duration-200')
      expect(result).toContain('rounded-lg')
      expect(result).toContain('px-3 py-2.5')
      expect(result).toContain('font-medium')
    })
  })

  describe('createActiveNavLinkClassName', () => {
    it('should return active state classes', () => {
      const result = createActiveNavLinkClassName()
      expect(result).toContain('bg-orange-500/15')
      expect(result).toContain('text-orange-100')
      expect(result).toContain('border-l-2 border-orange-400/80')
      expect(result).toContain('aria-current:page')
    })

    it('should include hover states for active links', () => {
      const result = createActiveNavLinkClassName()
      expect(result).toContain('hover:bg-orange-500/20')
      expect(result).toContain('hover:border-orange-400')
    })

    it('should include enhanced focus styles for active links', () => {
      const result = createActiveNavLinkClassName()
      expect(result).toContain('focus-visible:ring-orange-300')
      expect(result).toContain('focus-visible:bg-orange-500/20')
    })

    it('should include shadow enhancement', () => {
      const result = createActiveNavLinkClassName()
      expect(result).toContain('shadow-sm shadow-orange-500/10')
    })
  })
})