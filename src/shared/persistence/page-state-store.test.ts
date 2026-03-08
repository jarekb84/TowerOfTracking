import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadPageValue,
  savePageValue,
  clearPageState,
  clearAllPageState,
  resetCache,
} from './page-state-store'

const STORAGE_KEY = 'tower-tracking-page-state'

describe('page-state-store', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCache()
  })

  describe('loadPageValue', () => {
    it('returns default when nothing stored', () => {
      expect(loadPageValue('page/a', 'key', 'default')).toBe('default')
    })

    it('returns default when stored JSON is malformed', () => {
      localStorage.setItem(STORAGE_KEY, '{bad json')
      expect(loadPageValue('page/a', 'key', 42)).toBe(42)
    })

    it('returns stored value', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ 'page/a': { color: 'red' } })
      )
      expect(loadPageValue('page/a', 'color', 'blue')).toBe('red')
    })

    it('returns default when key not present in page scope', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ 'page/a': { other: 1 } })
      )
      expect(loadPageValue('page/a', 'missing', 'fallback')).toBe('fallback')
    })
  })

  describe('savePageValue', () => {
    it('writes correctly to localStorage', () => {
      savePageValue('page/a', 'color', 'green')
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored['page/a'].color).toBe('green')
    })

    it('merges sibling keys within same page', () => {
      savePageValue('page/a', 'key1', 'val1')
      savePageValue('page/a', 'key2', 'val2')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored['page/a'].key1).toBe('val1')
      expect(stored['page/a'].key2).toBe('val2')
    })

    it('merges across page scopes without clobbering', () => {
      savePageValue('page/a', 'key', 'a-value')
      savePageValue('page/b', 'key', 'b-value')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored['page/a'].key).toBe('a-value')
      expect(stored['page/b'].key).toBe('b-value')
    })

    it('concurrent writes: both keys present after sequential saves', () => {
      savePageValue('page/x', 'alpha', 1)
      savePageValue('page/x', 'beta', 2)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored['page/x'].alpha).toBe(1)
      expect(stored['page/x'].beta).toBe(2)
    })
  })

  describe('clearPageState', () => {
    it('removes one page scope without affecting others', () => {
      savePageValue('page/a', 'k', 1)
      savePageValue('page/b', 'k', 2)

      clearPageState('page/a')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored['page/a']).toBeUndefined()
      expect(stored['page/b'].k).toBe(2)
    })
  })

  describe('clearAllPageState', () => {
    it('removes entire storage key', () => {
      savePageValue('page/a', 'k', 1)
      clearAllPageState()
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  describe('resetCache', () => {
    it('clears in-memory cache so next load reads from storage', () => {
      savePageValue('page/a', 'k', 'cached')
      // Manually change localStorage behind the cache
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ 'page/a': { k: 'from-storage' } })
      )
      // Cache still returns old value
      expect(loadPageValue('page/a', 'k', '')).toBe('cached')

      resetCache()
      // Now reads from storage
      expect(loadPageValue('page/a', 'k', '')).toBe('from-storage')
    })
  })
})
