import { beforeEach, describe, expect, it } from 'vitest'
import { CHAPTERS } from '../data/book'
import { IRREGULAR_INFINITIVES } from '../data/verbs'
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  bookConfigFromSettings,
  configFromSettings,
  defaultSelectedIrregular,
  defaultSelectedUnits,
  loadSettings,
  mergeSelectedIrregular,
  mergeSelectedUnits,
  saveSettings,
  selectedUnitList,
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
      track: 'book',
      selectedUnits: { ...defaultSelectedUnits(), 35: false },
      selected: { presente: true, indefinido: false, imperfecto: true, imperativo: false },
      persons: { yo: true, tú: false, él: true, nosotros: true, vosotros: false, ellos: true },
      groups: { ar: true, er: false, ir: true },
      includeRegular: true,
      includeIrregular: true,
      selectedIrregular,
      size: 30,
      mode: 'weak',
      answer: 'oral',
    })
    const loaded = loadSettings()
    expect(loaded.track).toBe('book')
    expect(loaded.selectedUnits[35]).toBe(false)
    expect(loaded.selectedUnits[36]).toBe(true)
    expect(loaded.selected.indefinido).toBe(false)
    expect(loaded.selected.imperativo).toBe(false)
    expect(loaded.selectedIrregular.ser).toBe(false)
    expect(loaded.selectedIrregular.ir).toBe(false)
    expect(loaded.selectedIrregular.tener).toBe(true)
    expect(loaded.size).toBe(30)
    expect(loaded.mode).toBe('weak')
    expect(loaded.answer).toBe('oral')
    expect(loaded.persons.tú).toBe(false)
    expect(loaded.persons.vosotros).toBe(false)
    expect(configFromSettings(loaded).persons).toEqual(['yo', 'él', 'nosotros', 'ellos'])
    expect(configFromSettings(loaded).groups).toEqual(['ar', 'ir'])
  })

  it('all persons are on by default and for settings saved before the filter', () => {
    expect(Object.values(loadSettings().persons).every(Boolean)).toBe(true)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ size: 10 }))
    expect(configFromSettings(loadSettings()).persons).toHaveLength(6)
    expect(configFromSettings(loadSettings()).groups).toEqual(['ar', 'er', 'ir'])
  })

  it('irregular ticked but none picked means no irregular verbs', () => {
    const settings = loadSettings()
    for (const inf of IRREGULAR_INFINITIVES) settings.selectedIrregular[inf] = false
    const cfg = configFromSettings(settings)
    expect(cfg.includeIrregular).toBe(false)
    expect(cfg.selectedIrregular).toEqual([])
  })

  it('falls back to text for the removed voice mode', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ answer: 'voice' }))
    expect(loadSettings().answer).toBe('text')
  })

  it('defaults to smart mode and ignores unknown modes', () => {
    expect(loadSettings().mode).toBe('smart')
    expect(loadSettings().answer).toBe('text')
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mode: 'bogus' }))
    expect(loadSettings().mode).toBe('smart')
  })

  it('turns on imperativo for settings saved before it existed', () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ selected: { presente: true, indefinido: false, imperfecto: true } }),
    )
    expect(loadSettings().selected).toEqual({
      presente: true,
      indefinido: false,
      imperfecto: true,
      imperativo: true,
    })
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

describe('textbook settings', () => {
  it('starts on verbs with every chapter selected', () => {
    const loaded = loadSettings()
    expect(loaded.track).toBe('verbs')
    expect(selectedUnitList(loaded.selectedUnits)).toEqual(CHAPTERS.map((c) => c.unit))
  })

  it('settings saved before the textbook still load', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ size: 30 }))
    const loaded = loadSettings()
    expect(loaded.size).toBe(30)
    expect(loaded.track).toBe('verbs')
    expect(loaded.selectedUnits[34]).toBe(true)
  })

  it('new chapters come in selected, unticked ones stay unticked', () => {
    const merged = mergeSelectedUnits({ 34: false, 999: true }, [34, 35])
    expect(merged).toEqual({ 34: false, 35: true })
  })

  it('builds a session config from the ticked chapters', () => {
    const selectedUnits = mergeSelectedUnits({ ...defaultSelectedUnits(), 34: false })
    const settings = { ...DEFAULT_SETTINGS, selectedUnits, size: 10 }
    const config = bookConfigFromSettings(settings, { mode: 'weak' })
    expect(config.units).not.toContain(34)
    expect(config.units).toContain(35)
    expect(config).toMatchObject({ size: 10, mode: 'weak', answer: 'text' })
  })
})
