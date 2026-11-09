import { describe, expect, it } from 'vitest'
import { heatByCell, heatColor, repsToGreen, sumByTensePerson } from './heat'
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
    expect(heatColor(0, 0, 0)).toBe('hsl(60 35% 92%)')
    expect(heatColor(-2, -2, -2)).toBe('hsl(60 35% 92%)')
    // все ячейки равны и в плюсе — таблица зелёная
    expect(heatColor(5, 5, 5)).toMatch(/^hsl\(120(\.0)? /)
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

  it('repsToGreen counts correct answers needed to bring every cell up to the best', () => {
    // пустая таблица: каждой из 18 ячеек нужно по +1
    expect(repsToGreen(heatByCell({}, 'presente'))).toBe(18)
    // в императиве 5 лиц → 15 ячеек
    expect(repsToGreen(heatByCell({}, 'imperativo'))).toBe(15)

    const heat = heatByCell(
      {
        'hablar|presente|yo': stat(3, 0), // ar yo = 3 — лучшая
        'comer|presente|tú': stat(1, 2), // er tú = −1
      },
      'presente',
    )
    // 16 ячеек по 0 → +3 каждой, er tú −1 → +4
    expect(repsToGreen(heat)).toBe(16 * 3 + 4)
  })

  it('repsToGreen is 0 once every cell is equal and positive', () => {
    const stats: StatsStore = {}
    for (const person of ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos']) {
      for (const inf of ['hablar', 'comer', 'vivir']) stats[`${inf}|presente|${person}`] = stat(2, 0)
    }
    const heat = heatByCell(stats, 'presente')
    expect(repsToGreen(heat)).toBe(0)
    expect(heat.yo!.ar.color).toMatch(/^hsl\(120/)
  })
})
