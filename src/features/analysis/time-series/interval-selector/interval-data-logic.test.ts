import { describe, it, expect } from 'vitest'
import { sliceToInterval } from './interval-data-logic'

describe('sliceToInterval', () => {
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('returns full array when interval is "all"', () => {
    expect(sliceToInterval(data, 'all')).toEqual(data)
  })

  it('returns last N items when interval is a number', () => {
    expect(sliceToInterval(data, 3)).toEqual([8, 9, 10])
    expect(sliceToInterval(data, 5)).toEqual([6, 7, 8, 9, 10])
    expect(sliceToInterval(data, 1)).toEqual([10])
  })

  it('returns full array when interval exceeds data length', () => {
    expect(sliceToInterval(data, 20)).toEqual(data)
  })

  it('returns full array when interval equals data length', () => {
    expect(sliceToInterval(data, 10)).toEqual(data)
  })

  it('handles empty array', () => {
    expect(sliceToInterval([], 5)).toEqual([])
    expect(sliceToInterval([], 'all')).toEqual([])
  })

  it('works with object arrays', () => {
    const objects = [{ id: 1 }, { id: 2 }, { id: 3 }]
    expect(sliceToInterval(objects, 2)).toEqual([{ id: 2 }, { id: 3 }])
  })
})
