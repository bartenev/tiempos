import { describe, expect, it } from 'vitest'
import { heatByCell, heatColor, sumByTensePerson } from './heat'
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

  it('heatByCell scores each person × -ar / -er / -ir separately', () => {
    const heat = heatByCell(
      {
        'hablar|imperfecto|tú': stat(4, 0),
        'trabajar|imperfecto|tú': stat(1, 0),
        'comer|imperfecto|tú': stat(0, 3),
        'vivir|imperfecto|tú': stat(1, 1),
        'ser|imperfecto|tú': stat(50, 0),
      },
      'imperfecto',
    )
    expect(heat.tú!.ar.sum).toBe(5)
    expect(heat.tú!.er.sum).toBe(-3)
    expect(heat.tú!.ir.sum).toBe(0)
    expect(heat.tú!.ar.color).toMatch(/^hsl\(120/)
    expect(heat.tú!.er.color).toMatch(/^hsl\(0/)
    // одна строка — разные цвета ячеек
    expect(heat.tú!.ar.color).not.toBe(heat.tú!.ir.color)
  })

  it('imperativo has no yo row', () => {
    const heat = heatByCell({}, 'imperativo')
    expect(heat.yo).toBeUndefined()
    expect(Object.keys(heat)).toHaveLength(5)
  })
})
