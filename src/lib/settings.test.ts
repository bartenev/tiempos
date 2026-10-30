import { beforeEach, describe, expect, it } from 'vitest'
import { CHAPTERS } from '../data/book'
import { IRREGULAR_INFINITIVES } from '../data/verbs'
import { defaultSelection, onlyUnits, selectedUnits } from './bookSelection'
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  bookConfigFromSettings,
  configFromSettings,
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
      track: 'book',
      bookSelection: { kind: 'theme', themes: [{ section: 'pronombres' }], excluded: [35] },
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
    expect(selectedUnits(loaded.bookSelection)).not.toContain(35)
    expect(selectedUnits(loaded.bookSelection)).toContain(36)
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
    expect(selectedUnits(loaded.bookSelection)).toEqual(CHAPTERS.map((c) => c.unit))
  })

  it('settings saved before the textbook still load', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ size: 30 }))
    const loaded = loadSettings()
    expect(loaded.size).toBe(30)
    expect(loaded.track).toBe('verbs')
    expect(selectedUnits(loaded.bookSelection)).toContain(34)
  })

  it('turns the old chapter ticks into a selection', () => {
    const selectedUnitsTicks = Object.fromEntries(CHAPTERS.map((c) => [c.unit, c.unit === 12]))
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ selectedUnits: selectedUnitsTicks }))
    expect(selectedUnits(loadSettings().bookSelection)).toEqual([12])
  })

  it('falls back to everything on a broken selection', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ bookSelection: { kind: 'bogus' } }))
    expect(loadSettings().bookSelection).toEqual(defaultSelection())
  })

  it('builds a session config from the selection', () => {
    const settings = { ...DEFAULT_SETTINGS, bookSelection: onlyUnits([35, 36]), size: 10 }
    const config = bookConfigFromSettings(settings, { mode: 'weak' })
    expect(config.units).toEqual([35, 36])
    expect(config).toMatchObject({ size: 10, mode: 'weak', answer: 'text' })
  })
})
