import { describe, expect, it } from 'vitest'
import { heatByPerson, heatColor, sumByTensePerson } from './heat'
import type { CellStat, StatsStore } from './stats'

function stat(ok: number, bad: number): CellStat {
  return { ok, bad, streak: 0, last: 0 }
}

describe('heat / sums', () => {
  it('sums ok − bad of regular verbs only', () => {
    const stats: StatsStore = {
      'hablar|presente|yo': stat(3, 1),
      'comer|presente|yo': stat(3, 0),
      'ser|presente|yo': stat(100, 0),
      'pensar|presente|yo': stat(50, 0),
      'hablar|presente|tú': stat(0, 2),
    }
    expect(sumByTensePerson(stats, 'presente', 'yo')).toBe(5)
    expect(sumByTensePerson(stats, 'presente', 'tú')).toBe(-2)
    expect(sumByTensePerson(stats, 'presente', 'él')).toBe(0)
  })

  it('maps best (max) to green and worst (min) to red', () => {
    expect(heatColor(10, 0, 10)).toMatch(/^hsl\(120(\.0)? /)
    expect(heatColor(0, 0, 10)).toMatch(/^hsl\(0(\.0)? /)
    expect(heatColor(5, 5, 5)).toBe('hsl(60 35% 92%)')
  })

  it('heatByPerson colors rows by relative sums', () => {
    const heat = heatByPerson(
      { 'hablar|presente|yo': stat(4, 0), 'comer|presente|tú': stat(1, 0) },
      'presente',
    )
    expect(heat.yo.sum).toBe(4)
    expect(heat.tú.sum).toBe(1)
    expect(heat.él.sum).toBe(0)
    expect(heat.yo.color).toMatch(/^hsl\(120/)
    expect(heat.él.color).toMatch(/^hsl\(0/)
  })
})
