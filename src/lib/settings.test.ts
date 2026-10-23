import { beforeEach, describe, expect, it } from 'vitest'
import { IRREGULAR_INFINITIVES } from '../data/verbs'
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  defaultSelectedIrregular,
  loadSettings,
  mergeSelectedIrregular,
  saveSettings,
} from './settings'

beforeEach(() => {
  localStorage.clear()
})

describe('settings', () => {
  it('returns defaults when empty (all irregulars on)', () => {
    const loaded = loadSettings()
    expect(loaded.includeRegular).toBe(true)
    expect(loaded.includeIrregular).toBe(true)
    expect(loaded.size).toBe(20)
    for (const inf of IRREGULAR_INFINITIVES) {
      expect(loaded.selectedIrregular[inf]).toBe(true)
    }
  })

  it('round-trips checkbox and irregular picks', () => {
    const selectedIrregular = defaultSelectedIrregular()
    selectedIrregular.ser = false
    selectedIrregular.ir = false
    saveSettings({
      selected: { presente: true, indefinido: false, imperfecto: true },
      includeRegular: true,
      includeIrregular: true,
      selectedIrregular,
      size: 30,
      mode: 'weak',
    })
    const loaded = loadSettings()
    expect(loaded.selected.indefinido).toBe(false)
    expect(loaded.selectedIrregular.ser).toBe(false)
    expect(loaded.selectedIrregular.ir).toBe(false)
    expect(loaded.selectedIrregular.tener).toBe(true)
    expect(loaded.size).toBe(30)
    expect(loaded.mode).toBe('weak')
  })

  it('defaults to smart mode and ignores unknown modes', () => {
    expect(loadSettings().mode).toBe('smart')
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mode: 'bogus' }))
    expect(loadSettings().mode).toBe('smart')
  })

  it('falls back on corrupt payload', () => {
    localStorage.setItem(SETTINGS_KEY, '{not-json')
    expect(loadSettings().size).toBe(DEFAULT_SETTINGS.size)
  })

  it('mergeSelectedIrregular keeps off flags and adds new verbs as on', () => {
    const merged = mergeSelectedIrregular(
      { ser: false, ghost: true },
      ['ser', 'ir', 'nuevo'],
    )
    expect(merged).toEqual({ ser: false, ir: true, nuevo: true })
  })
})
