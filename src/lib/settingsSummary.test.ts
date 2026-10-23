import { describe, expect, it } from 'vitest'
import { IRREGULAR_INFINITIVES } from '../data/verbs'
import { DEFAULT_SETTINGS, defaultSelectedIrregular } from './settings'
import type { SetupSettings } from './settings'
import { describeSettings, irregularLabel } from './settingsSummary'

function make(overrides: Partial<SetupSettings> = {}): SetupSettings {
  return {
    ...DEFAULT_SETTINGS,
    selected: { ...DEFAULT_SETTINGS.selected },
    persons: { ...DEFAULT_SETTINGS.persons },
    groups: { ...DEFAULT_SETTINGS.groups },
    selectedIrregular: defaultSelectedIrregular(),
    ...overrides,
  }
}

function onlyIrregular(...picked: string[]): Record<string, boolean> {
  return Object.fromEntries(IRREGULAR_INFINITIVES.map((inf) => [inf, picked.includes(inf)]))
}

describe('describeSettings', () => {
  it('everything on by default', () => {
    expect(describeSettings(make())).toEqual({
      tenses: 'все',
      persons: 'все',
      groups: 'все',
      verbs: 'все',
      size: '20 карточек',
    })
  })

  it('lists partial picks', () => {
    const summary = describeSettings(
      make({
        selected: { presente: true, indefinido: false, imperfecto: true, imperativo: false },
        persons: { yo: true, tú: true, él: false, nosotros: false, vosotros: false, ellos: false },
        groups: { ar: true, er: false, ir: true },
        size: 10,
      }),
    )
    expect(summary.tenses).toBe('Presente, Imperfecto')
    expect(summary.persons).toBe('yo, tú')
    expect(summary.groups).toBe('-ar, -ir')
    expect(summary.size).toBe('10 карточек')
  })

  it('describes the verb filter', () => {
    expect(describeSettings(make({ includeIrregular: false })).verbs).toBe('только правильные')
    expect(describeSettings(make({ includeRegular: false })).verbs).toBe('только неправильные')
    expect(
      describeSettings(make({ selectedIrregular: onlyIrregular('ser', 'ir') })).verbs,
    ).toBe('правильные + 2 неправильных')
    expect(
      describeSettings(make({ includeRegular: false, selectedIrregular: onlyIrregular('ser') })).verbs,
    ).toBe('1 неправильный')
    expect(describeSettings(make({ includeRegular: false, includeIrregular: false })).verbs).toBe('—')
  })

  it('shows a dash when nothing is picked', () => {
    const summary = describeSettings(
      make({ selected: { presente: false, indefinido: false, imperfecto: false, imperativo: false } }),
    )
    expect(summary.tenses).toBe('—')
  })
})

describe('irregularLabel', () => {
  it('agrees with the number', () => {
    expect(irregularLabel(1)).toBe('1 неправильный')
    expect(irregularLabel(2)).toBe('2 неправильных')
    expect(irregularLabel(11)).toBe('11 неправильных')
    expect(irregularLabel(21)).toBe('21 неправильный')
  })
})
