import { beforeEach, describe, expect, it } from 'vitest'
import type { Timing } from './timing'
import { MAX_TIMINGS, TIMING_KEY, dropTiming, loadTimings, recordTiming } from './timing'

function timing(at: number, k = 'hablar|presente|yo'): Timing {
  return { k, at, ms: 1000, total: 1500, ok: true, oral: false, len: 20 }
}

describe('timing', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('records answers and keeps only the latest MAX_TIMINGS', () => {
    localStorage.setItem(TIMING_KEY, JSON.stringify(Array.from({ length: MAX_TIMINGS }, (_, i) => timing(i))))
    recordTiming(timing(MAX_TIMINGS))
    const list = loadTimings()
    expect(list).toHaveLength(MAX_TIMINGS)
    expect(list[0]!.at).toBe(1)
    expect(list.at(-1)!.at).toBe(MAX_TIMINGS)
  })

  it('drops exactly the undone answer', () => {
    recordTiming(timing(1))
    recordTiming(timing(2, 'comer|presente|yo'))
    recordTiming(timing(3))
    dropTiming('hablar|presente|yo', 3)
    dropTiming('hablar|presente|yo', 99)
    expect(loadTimings().map((t) => t.at)).toEqual([1, 2])
  })

  it('ignores broken storage', () => {
    localStorage.setItem(TIMING_KEY, JSON.stringify([timing(1), { k: 'x' }, null]))
    expect(loadTimings()).toHaveLength(1)
    localStorage.setItem(TIMING_KEY, '{oops')
    expect(loadTimings()).toEqual([])
  })
})
