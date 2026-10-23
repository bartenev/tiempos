import { beforeEach, describe, expect, it } from 'vitest'
import { currentStreak, daysLabel, loadDaily, markPracticed } from './daily'

beforeEach(() => {
  localStorage.clear()
})

describe('daily streak', () => {
  it('grows on consecutive days and resets after a gap', () => {
    markPracticed(new Date(2026, 0, 1, 10))
    markPracticed(new Date(2026, 0, 1, 20))
    expect(loadDaily().streak).toBe(1)
    markPracticed(new Date(2026, 0, 2, 9))
    expect(loadDaily().streak).toBe(2)
    markPracticed(new Date(2026, 0, 5, 9))
    expect(loadDaily()).toMatchObject({ streak: 1, best: 2 })
  })

  it('current streak expires after a missed day', () => {
    markPracticed(new Date(2026, 0, 1))
    expect(currentStreak(loadDaily(), new Date(2026, 0, 2))).toBe(1)
    expect(currentStreak(loadDaily(), new Date(2026, 0, 3))).toBe(0)
  })

  it('pluralizes days in Russian', () => {
    expect(daysLabel(1)).toBe('1 день')
    expect(daysLabel(3)).toBe('3 дня')
    expect(daysLabel(5)).toBe('5 дней')
    expect(daysLabel(11)).toBe('11 дней')
    expect(daysLabel(21)).toBe('21 день')
    expect(daysLabel(22)).toBe('22 дня')
  })
})
