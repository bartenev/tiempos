import { beforeEach, describe, expect, it } from 'vitest'
import {
  STATS_KEY,
  cellKey,
  cellWeight,
  isWeak,
  loadStats,
  masteryOf,
  recordAttempt,
  recoveryStreak,
} from './stats'

beforeEach(() => {
  localStorage.clear()
})

describe('stats', () => {
  it('records ok / bad and resets streak on error', () => {
    recordAttempt('ser', 'presente', 'yo', true, 1)
    recordAttempt('ser', 'presente', 'yo', true, 2)
    const stat = recordAttempt('ser', 'presente', 'yo', false, 3)
    expect(stat).toEqual({ ok: 2, bad: 1, streak: 0, last: 3 })
    expect(loadStats()[cellKey('ser', 'presente', 'yo')]).toEqual(stat)
  })

  it('a form is weak after an error until two correct in a row', () => {
    recordAttempt('ir', 'indefinido', 'él', false)
    expect(isWeak(loadStats()[cellKey('ir', 'indefinido', 'él')])).toBe(true)
    recordAttempt('ir', 'indefinido', 'él', true)
    expect(isWeak(loadStats()[cellKey('ir', 'indefinido', 'él')])).toBe(true)
    recordAttempt('ir', 'indefinido', 'él', true)
    expect(isWeak(loadStats()[cellKey('ir', 'indefinido', 'él')])).toBe(false)
  })

  it('more mistakes need a longer correct streak to recover', () => {
    expect([1, 2, 3, 4, 5, 6, 10].map(recoveryStreak)).toEqual([2, 2, 3, 3, 4, 4, 4])
    expect(isWeak({ ok: 2, bad: 3, streak: 2, last: 0 })).toBe(true)
    expect(isWeak({ ok: 3, bad: 3, streak: 3, last: 0 })).toBe(false)
    expect(isWeak({ ok: 3, bad: 5, streak: 3, last: 0 })).toBe(true)
    expect(isWeak({ ok: 4, bad: 5, streak: 4, last: 0 })).toBe(false)
  })

  it('«learning» stays between weak and solid even after many mistakes', () => {
    expect(masteryOf({ ok: 4, bad: 5, streak: 4, last: 0 })).toBe('learning')
    expect(masteryOf({ ok: 5, bad: 5, streak: 5, last: 0 })).toBe('solid')
    expect(masteryOf({ ok: 2, bad: 1, streak: 2, last: 0 })).toBe('learning')
    expect(masteryOf({ ok: 3, bad: 1, streak: 3, last: 0 })).toBe('solid')
  })

  it('a form without history is new, not weak', () => {
    expect(isWeak(undefined)).toBe(false)
    expect(masteryOf(undefined)).toBe('new')
  })

  it('weak forms weigh more than new, new more than solid', () => {
    const weak = cellWeight({ ok: 0, bad: 2, streak: 0, last: 0 })
    const fresh = cellWeight(undefined)
    const solid = cellWeight({ ok: 8, bad: 0, streak: 8, last: 0 })
    expect(weak).toBeGreaterThan(fresh)
    expect(fresh).toBeGreaterThan(solid)
    expect(masteryOf({ ok: 8, bad: 0, streak: 8, last: 0 })).toBe('solid')
  })

  it('ignores corrupt entries', () => {
    localStorage.setItem(STATS_KEY, JSON.stringify({ a: { ok: 'x' }, b: { ok: 1, bad: 0, streak: 1, last: 0 } }))
    expect(Object.keys(loadStats())).toEqual(['b'])
  })
})
