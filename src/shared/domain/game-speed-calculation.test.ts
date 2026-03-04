import { describe, it, expect } from 'vitest'
import { calculateGameSpeed } from './game-speed-calculation'

describe('calculateGameSpeed', () => {
  it('should calculate gameTime / realTime ratio', () => {
    expect(calculateGameSpeed(1000, 500)).toBe(2)
    expect(calculateGameSpeed(1500, 1000)).toBe(1.5)
    expect(calculateGameSpeed(4787, 1000)).toBe(4.787)
  })

  it('should return null when realTime is 0', () => {
    expect(calculateGameSpeed(1000, 0)).toBeNull()
    expect(calculateGameSpeed(0, 0)).toBeNull()
  })

  it('should round to 3 decimal places', () => {
    expect(calculateGameSpeed(1000, 3)).toBe(333.333)
    expect(calculateGameSpeed(10, 3)).toBe(3.333)
  })
})
