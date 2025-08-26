import { describe, it, expect } from 'vitest'
import { 
  parseColumnHeader, 
  getHeaderLineClasses, 
  isMultiLineHeader 
} from './column-header-renderer'

describe('column-header-renderer', () => {
  describe('parseColumnHeader', () => {
    it('should parse single-line headers', () => {
      const result = parseColumnHeader('Run 1')
      expect(result.lines).toEqual(['Run 1'])
      expect(result.isMultiLine).toBe(false)
    })

    it('should parse multi-line headers', () => {
      const result = parseColumnHeader('T10 6,008\n8hr 43min\n8/17 3:45 PM')
      expect(result.lines).toEqual(['T10 6,008', '8hr 43min', '8/17 3:45 PM'])
      expect(result.isMultiLine).toBe(true)
    })

    it('should handle empty strings', () => {
      const result = parseColumnHeader('')
      expect(result.lines).toEqual([''])
      expect(result.isMultiLine).toBe(false)
    })

    it('should handle headers with multiple newlines', () => {
      const result = parseColumnHeader('Line 1\nLine 2\nLine 3\nLine 4')
      expect(result.lines).toEqual(['Line 1', 'Line 2', 'Line 3', 'Line 4'])
      expect(result.isMultiLine).toBe(true)
    })
  })

  describe('getHeaderLineClasses', () => {
    it('should return base classes for single-line headers', () => {
      const classes = getHeaderLineClasses(0, 1)
      expect(classes).toBe('whitespace-nowrap')
    })

    it('should return styled classes for first line of multi-line header', () => {
      const classes = getHeaderLineClasses(0, 3)
      expect(classes).toBe('whitespace-nowrap font-bold text-base')
    })

    it('should return styled classes for second line of multi-line header', () => {
      const classes = getHeaderLineClasses(1, 3)
      expect(classes).toBe('whitespace-nowrap font-normal text-sm')
    })

    it('should return styled classes for third+ lines of multi-line header', () => {
      const classes = getHeaderLineClasses(2, 3)
      expect(classes).toBe('whitespace-nowrap font-normal text-xs text-slate-400')
      
      // Test fourth line also gets same styling
      const classes4 = getHeaderLineClasses(3, 4)
      expect(classes4).toBe('whitespace-nowrap font-normal text-xs text-slate-400')
    })

    it('should handle two-line headers correctly', () => {
      expect(getHeaderLineClasses(0, 2)).toBe('whitespace-nowrap font-bold text-base')
      expect(getHeaderLineClasses(1, 2)).toBe('whitespace-nowrap font-normal text-sm')
    })

    it('should handle edge case of zero lines', () => {
      const classes = getHeaderLineClasses(0, 0)
      expect(classes).toBe('whitespace-nowrap')
    })
  })

  describe('isMultiLineHeader', () => {
    it('should return true for headers with newlines', () => {
      expect(isMultiLineHeader('Line 1\nLine 2')).toBe(true)
      expect(isMultiLineHeader('T10 6,008\n8hr 43min\n8/17 3:45 PM')).toBe(true)
      expect(isMultiLineHeader('Header\n')).toBe(true)
    })

    it('should return false for single-line headers', () => {
      expect(isMultiLineHeader('Run 1')).toBe(false)
      expect(isMultiLineHeader('Simple Header')).toBe(false)
      expect(isMultiLineHeader('')).toBe(false)
    })

    it('should handle special characters correctly', () => {
      expect(isMultiLineHeader('Header with spaces')).toBe(false)
      expect(isMultiLineHeader('Header-with-dashes')).toBe(false)
      expect(isMultiLineHeader('Header_with_underscores')).toBe(false)
    })
  })
})