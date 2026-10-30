import { beforeEach, describe, expect, it } from 'vitest'
import {
  BOOK_STATS_KEY,
  LEGACY_BOOK_STATS_KEY,
  STATS_KEY,
  cellKey,
  cellWeight,
  isDue,
  isWeak,
  loadBookStats,
  loadStats,
  masteryOf,
  migrateBookStats,
  recordAttempt,
  recoveryStreak,
  restoreStat,
  reviewDays,
} from './stats'

beforeEach(() => {
  localStorage.clear()
})

describe('stats', () => {
  it('restoreStat puts back the previous history or removes a new form', () => {
    recordAttempt('ser', 'presente', 'yo', true, 1)
    const before = loadStats()[cellKey('ser', 'presente', 'yo')]
    recordAttempt('ser', 'presente', 'yo', false, 2)
    restoreStat('ser', 'presente', 'yo', before)
    expect(loadStats()[cellKey('ser', 'presente', 'yo')]).toEqual({ ok: 1, bad: 0, streak: 1, last: 1 })

    recordAttempt('ir', 'presente', 'yo', true, 3)
    restoreStat('ir', 'presente', 'yo', undefined)
    expect(loadStats()[cellKey('ir', 'presente', 'yo')]).toBeUndefined()
  })

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
    const solid = cellWeight({ ok: 8, bad: 0, streak: 8, last: 0 }, 0)
    expect(weak).toBeGreaterThan(fresh)
    expect(fresh).toBeGreaterThan(solid)
    expect(masteryOf({ ok: 8, bad: 0, streak: 8, last: 0 })).toBe('solid')
  })

  it('the pause before a review doubles with the streak, up to a limit', () => {
    expect([1, 2, 3, 5, 6, 20].map(reviewDays)).toEqual([2, 4, 8, 32, 60, 60])
  })

  it('a learned form comes back when its review is due', () => {
    const stat = { ok: 3, bad: 0, streak: 3, last: 0 }
    const day = 24 * 60 * 60 * 1000
    expect(isDue(stat, 7 * day)).toBe(false)
    expect(isDue(stat, 8 * day)).toBe(true)
    expect(cellWeight(stat, 7 * day)).toBeLessThan(cellWeight(undefined))
    expect(cellWeight(stat, 8 * day)).toBe(cellWeight(undefined))
  })

  it('a weak form stays above any review', () => {
    const weak = { ok: 0, bad: 1, streak: 0, last: 0 }
    expect(cellWeight(weak, 1e12)).toBeGreaterThan(cellWeight({ ok: 9, bad: 0, streak: 9, last: 0 }, 1e12))
  })

  it('ignores corrupt entries', () => {
    localStorage.setItem(STATS_KEY, JSON.stringify({ a: { ok: 'x' }, b: { ok: 1, bad: 0, streak: 1, last: 0 } }))
    expect(Object.keys(loadStats())).toEqual(['b'])
  })

  it('moves textbook progress to the new keys and drops the old store', () => {
    const stat = { ok: 2, bad: 1, streak: 2, last: 5 }
    localStorage.setItem(LEGACY_BOOK_STATS_KEY, JSON.stringify({ old: stat, gone: stat }))
    migrateBookStats({ old: '18.1.1' })
    expect(loadBookStats()).toEqual({ '18.1.1': stat })
    expect(localStorage.getItem(LEGACY_BOOK_STATS_KEY)).toBeNull()
  })

  it('never overwrites newer progress and does nothing without the old store', () => {
    const newer = { ok: 9, bad: 0, streak: 9, last: 9 }
    localStorage.setItem(BOOK_STATS_KEY, JSON.stringify({ '18.1.1': newer }))
    migrateBookStats({ old: '18.1.1' })
    expect(loadBookStats()).toEqual({ '18.1.1': newer })

    localStorage.setItem(LEGACY_BOOK_STATS_KEY, JSON.stringify({ old: { ok: 1, bad: 0, streak: 1, last: 1 } }))
    migrateBookStats({ old: '18.1.1' })
    expect(loadBookStats()).toEqual({ '18.1.1': newer })
  })
})
