import { beforeEach, describe, expect, it } from 'vitest'
import { DAILY_KEY } from './daily'
import { SETTINGS_KEY } from './settings'
import { STATS_KEY } from './stats'
import { OBSOLETE_KEYS, removeObsoleteKeys } from './storage'
import { THEME_KEY } from './theme'

beforeEach(() => {
  localStorage.clear()
})

describe('removeObsoleteKeys', () => {
  it('removes the old progress store', () => {
    localStorage.setItem('tiempos.progress.v2', '{}')
    removeObsoleteKeys()
    expect(localStorage.getItem('tiempos.progress.v2')).toBeNull()
  })

  it('keeps every key the app still uses', () => {
    const live = [STATS_KEY, DAILY_KEY, SETTINGS_KEY, THEME_KEY]
    for (const key of live) localStorage.setItem(key, 'x')
    removeObsoleteKeys()
    for (const key of live) expect(localStorage.getItem(key)).toBe('x')
    expect(live.some((key) => OBSOLETE_KEYS.includes(key))).toBe(false)
  })
})
