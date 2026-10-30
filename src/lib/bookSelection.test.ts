import { describe, expect, it } from 'vitest'
import { CHAPTERS } from '../data/book'
import type { BookSelection, BookTheme, Chapter } from '../types'
import {
  defaultSelection,
  isThemeActive,
  onlyUnits,
  parseSelection,
  selectedUnits,
  selectionFromTicks,
  toggleTheme,
  toggleUnit,
  unitsOfTheme,
} from './bookSelection'

const all: BookTheme = { section: 'pronombres' }
const imperative: BookTheme = { section: 'pronombres', tag: 'imperativo' }
const gustar: BookTheme = { section: 'pronombres', tag: 'gustar' }

function theme(...themes: BookTheme[]): BookSelection {
  return { kind: 'theme', themes, excluded: [] }
}

/** Глава нового раздела: проверяем, что выбор не расползается. */
const future = (unit: number, tags: Chapter['tags'] = []): Chapter => ({
  unit,
  title: '',
  ru: '',
  section: 'verbos' as Chapter['section'],
  tags,
  sets: [],
})

describe('themes', () => {
  it('a section takes all its chapters, a tag only its own', () => {
    expect(unitsOfTheme(all)).toEqual(CHAPTERS.map((c) => c.unit))
    expect(unitsOfTheme(imperative)).toEqual([39, 77, 78])
  })

  it('the same tag in another section is another theme', () => {
    const chapters = [...CHAPTERS, future(90, ['imperativo'])]
    expect(unitsOfTheme(imperative, chapters)).toEqual([39, 77, 78])
    expect(selectedUnits(theme(imperative), chapters)).toEqual([39, 77, 78])
  })

  it('remembers the theme: new chapters of it join, foreign ones do not', () => {
    const selection = theme(imperative)
    const chapters: Chapter[] = [
      ...CHAPTERS,
      { ...future(79, ['imperativo']), section: 'pronombres' },
      future(90),
    ]
    expect(selectedUnits(selection, chapters)).toEqual([39, 77, 78, 79])
  })

  it('combines several themes without repeats, in book order', () => {
    expect(selectedUnits(theme(imperative, gustar))).toEqual([39, 55, 77, 78])
  })
})

describe('toggleTheme', () => {
  it('adds a theme and takes it off', () => {
    const on = toggleTheme(theme(gustar), imperative)
    expect(isThemeActive(on, gustar)).toBe(true)
    expect(isThemeActive(on, imperative)).toBe(true)
    expect(isThemeActive(toggleTheme(on, gustar), gustar)).toBe(false)
  })

  it('a tag narrows the whole section, the section replaces its tags', () => {
    expect(toggleTheme(theme(all), imperative)).toEqual(theme(imperative))
    expect(toggleTheme(theme(imperative, gustar), all)).toEqual(theme(all))
  })

  it('leaves a list of chapters for a theme and forgets excluded chapters', () => {
    expect(toggleTheme(onlyUnits([12]), gustar)).toEqual(theme(gustar))
    const narrowed: BookSelection = { kind: 'theme', themes: [imperative], excluded: [39] }
    expect(toggleTheme(narrowed, gustar).kind).toBe('theme')
    expect(selectedUnits(toggleTheme(narrowed, gustar))).toEqual([39, 55, 77, 78])
  })

  it('taking off the last theme leaves nothing selected', () => {
    expect(selectedUnits(toggleTheme(theme(gustar), gustar))).toEqual([])
  })
})

describe('toggleUnit', () => {
  it('takes a chapter out of a theme and brings it back', () => {
    const off = toggleUnit(theme(imperative), 77)
    expect(selectedUnits(off)).toEqual([39, 78])
    expect(isThemeActive(off, imperative)).toBe(true)
    expect(selectedUnits(toggleUnit(off, 77))).toEqual([39, 77, 78])
  })

  it('a chapter outside the theme turns it into a list of chapters', () => {
    const next = toggleUnit(theme(imperative), 12)
    expect(next.kind).toBe('units')
    expect(selectedUnits(next)).toEqual([12, 39, 77, 78])
  })

  it('edits a list of chapters', () => {
    expect(selectedUnits(toggleUnit(onlyUnits([12, 18]), 18))).toEqual([12])
    expect(selectedUnits(toggleUnit(onlyUnits([12]), 18))).toEqual([12, 18])
  })
})

describe('saved selection', () => {
  it('survives a round trip through JSON', () => {
    const selection: BookSelection = { kind: 'theme', themes: [imperative], excluded: [39] }
    expect(parseSelection(JSON.parse(JSON.stringify(selection)))).toEqual(selection)
    expect(parseSelection(JSON.parse(JSON.stringify(onlyUnits([12]))))).toEqual(onlyUnits([12]))
  })

  it('drops unknown themes and rejects garbage', () => {
    expect(
      parseSelection({ kind: 'theme', themes: [all, { section: 'nope' }, { section: 'pronombres', tag: 'nope' }] }),
    ).toEqual(theme(all))
    expect(parseSelection({ kind: 'bogus' })).toBeUndefined()
    expect(parseSelection('units')).toBeUndefined()
  })

  it('recognizes a theme in the old ticks', () => {
    const ticks = Object.fromEntries(CHAPTERS.map((c) => [c.unit, [39, 77, 78].includes(c.unit)]))
    expect(selectionFromTicks(ticks)).toEqual(theme(imperative))
  })

  it('all ticks mean the whole section, a custom pick stays a list', () => {
    const ticks = Object.fromEntries(CHAPTERS.map((c) => [c.unit, true]))
    expect(selectionFromTicks(ticks)).toEqual(theme(all))
    const custom = Object.fromEntries(CHAPTERS.map((c) => [c.unit, [34, 36].includes(c.unit)]))
    expect(selectionFromTicks(custom)).toEqual(onlyUnits([34, 36]))
  })

  it('nothing saved before the ticks', () => {
    expect(selectionFromTicks(undefined)).toBeUndefined()
  })

  it('defaults to everything', () => {
    expect(selectedUnits(defaultSelection())).toEqual(CHAPTERS.map((c) => c.unit))
  })
})
