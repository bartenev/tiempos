import { describe, expect, it } from 'vitest'
import { FADE_FULL_DAYS, fadeOf, heatByCell, lastByCell, repsToGreen, runColor, sumByTensePerson } from './heat'
import { GREEN_RUN } from './runs'
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

  it('colors a cell by its streak: none → neutral, error → red, GREEN_RUN → green', () => {
    expect(runColor(undefined)).toBe('hsl(60 35% 92%)')
    expect(runColor(0)).toMatch(/^hsl\(0(\.0)? /)
    expect(runColor(GREEN_RUN)).toMatch(/^hsl\(120(\.0)? /)
    expect(runColor(GREEN_RUN + 7)).toBe(runColor(GREEN_RUN))
    expect(runColor(2)).not.toBe(runColor(3))
  })

  it('heatByCell reads each person × -ar / -er / -ir separately', () => {
    const heat = heatByCell({ 'ar|imperfecto|tú': 5, 'er|imperfecto|tú': 0 }, 'imperfecto')
    expect(heat.tú!.ar.run).toBe(5)
    expect(heat.tú!.er.run).toBe(0)
    expect(heat.tú!.ir.run).toBeUndefined()
    expect(heat.tú!.ar.color).toMatch(/^hsl\(120/)
    expect(heat.tú!.er.color).toMatch(/^hsl\(0/)
  })

  it('imperativo has no yo row', () => {
    const heat = heatByCell({}, 'imperativo')
    expect(heat.yo).toBeUndefined()
    expect(Object.keys(heat)).toHaveLength(5)
  })

  it('repsToGreen counts correct answers in a row still missing', () => {
    expect(repsToGreen(heatByCell({}, 'presente'))).toBe(18 * GREEN_RUN)
    expect(repsToGreen(heatByCell({}, 'imperativo'))).toBe(15 * GREEN_RUN)
    const heat = heatByCell({ 'ar|presente|yo': 3, 'er|presente|yo': 9, 'ir|presente|yo': 0 }, 'presente')
    expect(repsToGreen(heat)).toBe(15 * GREEN_RUN + 2 + 0 + GREEN_RUN)
  })

  it('repsToGreen is 0 once every cell has GREEN_RUN in a row', () => {
    const runs: Record<string, number> = {}
    for (const person of ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos']) {
      for (const group of ['ar', 'er', 'ir']) runs[`${group}|presente|${person}`] = GREEN_RUN
    }
    expect(repsToGreen(heatByCell(runs, 'presente'))).toBe(0)
  })
})

describe('heat / темп и давность', () => {
  const DAY = 24 * 60 * 60 * 1000

  it('a slow cell is never greener than yellow', () => {
    expect(runColor(GREEN_RUN, { slow: true })).toMatch(/^hsl\(60(\.0)? /)
    expect(runColor(0, { slow: true })).toBe(runColor(0))
  })

  it('a cell fades the longer it was not trained', () => {
    expect(fadeOf(null)).toBe(0)
    expect(fadeOf(1)).toBe(0)
    expect(fadeOf(8)).toBeCloseTo(0.5)
    expect(fadeOf(FADE_FULL_DAYS + 30)).toBe(1)
    expect(runColor(GREEN_RUN, { fade: 1 })).not.toBe(runColor(GREEN_RUN))
  })

  it('heatByCell marks slow cells and counts days since the last answer', () => {
    const now = 100 * DAY
    const heat = heatByCell({ 'ar|presente|yo': GREEN_RUN }, 'presente', {
      slow: new Set(['ar|presente|yo']),
      last: new Map([['ar|presente|yo', now - 10 * DAY]]),
      now,
    })
    expect(heat.yo!.ar).toMatchObject({ run: GREEN_RUN, slow: true, days: 10 })
    expect(heat.yo!.er).toMatchObject({ slow: false, days: null })
  })

  it('lastByCell takes the latest answer among regular verbs of the cell', () => {
    const last = lastByCell({
      'hablar|presente|yo': { ok: 1, bad: 0, streak: 1, last: 5 },
      'cantar|presente|yo': { ok: 1, bad: 0, streak: 1, last: 9 },
      'pensar|presente|yo': { ok: 1, bad: 0, streak: 1, last: 50 },
    })
    expect(last.get('ar|presente|yo')).toBe(9)
  })
})
