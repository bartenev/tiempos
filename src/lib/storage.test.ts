import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DAILY_KEY } from './daily'
import { SETTINGS_KEY } from './settings'
import { STATS_KEY } from './stats'
import { OBSOLETE_KEYS, removeObsoleteKeys, requestPersistentStorage } from './storage'
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

describe('requestPersistentStorage', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'storage')

  function mockStorage(value: unknown) {
    Object.defineProperty(navigator, 'storage', { value, configurable: true })
  }

  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'storage', original)
    else delete (navigator as { storage?: unknown }).storage
  })

  it('asks the browser when storage is not persistent yet', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    mockStorage({ persisted: vi.fn().mockResolvedValue(false), persist })
    expect(await requestPersistentStorage()).toBe(true)
    expect(persist).toHaveBeenCalledOnce()
  })

  it('does not ask again when storage is already persistent', async () => {
    const persist = vi.fn()
    mockStorage({ persisted: vi.fn().mockResolvedValue(true), persist })
    expect(await requestPersistentStorage()).toBe(true)
    expect(persist).not.toHaveBeenCalled()
  })

  it('a refusal is just false', async () => {
    mockStorage({ persisted: vi.fn().mockResolvedValue(false), persist: vi.fn().mockResolvedValue(false) })
    expect(await requestPersistentStorage()).toBe(false)
  })

  it('works without the Storage API and swallows errors', async () => {
    mockStorage(undefined)
    expect(await requestPersistentStorage()).toBe(false)
    mockStorage({ persist: vi.fn().mockRejectedValue(new Error('nope')) })
    expect(await requestPersistentStorage()).toBe(false)
  })
})
