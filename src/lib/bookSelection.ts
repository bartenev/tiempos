import { CHAPTERS, SECTIONS } from '../data/book'
import type { BookSection, BookSelection, BookTag, BookTheme, Chapter } from '../types'

/** По умолчанию — весь учебник: новые разделы подхватываются сами. */
export function defaultSelection(): BookSelection {
  return { kind: 'theme', themes: SECTIONS.map(({ section }) => ({ section })), excluded: [] }
}

function sameTheme(a: BookTheme, b: BookTheme): boolean {
  return a.section === b.section && a.tag === b.tag
}

function inTheme(chapter: Chapter, theme: BookTheme): boolean {
  if (chapter.section !== theme.section) return false
  return theme.tag === undefined || chapter.tags.includes(theme.tag)
}

export function unitsOfTheme(theme: BookTheme, chapters: Chapter[] = CHAPTERS): number[] {
  return chapters.filter((c) => inTheme(c, theme)).map((c) => c.unit)
}

/** Номера выбранных глав; порядок — как в учебнике. */
export function selectedUnits(
  selection: BookSelection,
  chapters: Chapter[] = CHAPTERS,
): number[] {
  const picked =
    selection.kind === 'units'
      ? chapters.filter((c) => selection.units.includes(c.unit))
      : chapters.filter(
          (c) =>
            !selection.excluded.includes(c.unit) && selection.themes.some((t) => inTheme(c, t)),
        )
  return picked.map((c) => c.unit)
}

export function isThemeActive(selection: BookSelection, theme: BookTheme): boolean {
  return selection.kind === 'theme' && selection.themes.some((t) => sameTheme(t, theme))
}

/**
 * Тема добавляется к выбранным или снимается. Весь раздел заменяет свои подтемы,
 * подтема сужает раздел; снятые вручную главы сбрасываются.
 */
export function toggleTheme(selection: BookSelection, theme: BookTheme): BookSelection {
  const current = selection.kind === 'theme' ? selection.themes : []
  if (current.some((t) => sameTheme(t, theme))) {
    return { kind: 'theme', themes: current.filter((t) => !sameTheme(t, theme)), excluded: [] }
  }
  const kept = current.filter(
    (t) => t.section !== theme.section || (t.tag !== undefined && theme.tag !== undefined),
  )
  return { kind: 'theme', themes: [...kept, theme], excluded: [] }
}

function toggled(units: number[], unit: number): number[] {
  return units.includes(unit) ? units.filter((u) => u !== unit) : [...units, unit]
}

/** Глава вне выбранных тем превращает выбор в свой список глав. */
export function toggleUnit(
  selection: BookSelection,
  unit: number,
  chapters: Chapter[] = CHAPTERS,
): BookSelection {
  if (selection.kind === 'units') return { ...selection, units: toggled(selection.units, unit) }
  const chapter = chapters.find((c) => c.unit === unit)
  if (chapter && selection.themes.some((t) => inTheme(chapter, t))) {
    return { ...selection, excluded: toggled(selection.excluded, unit) }
  }
  return { kind: 'units', units: [...selectedUnits(selection, chapters), unit] }
}

export function onlyUnits(units: number[]): BookSelection {
  return { kind: 'units', units }
}

function isTheme(value: unknown): value is BookTheme {
  if (!value || typeof value !== 'object') return false
  const { section, tag } = value as { section?: unknown; tag?: unknown }
  const known = SECTIONS.find((s) => s.section === (section as BookSection))
  if (!known) return false
  return tag === undefined || known.tags.some((t) => t.tag === (tag as BookTag))
}

function numbers(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((n) => typeof n === 'number') : []
}

/** Сохранённый выбор; undefined — если данные не подходят. */
export function parseSelection(raw: unknown): BookSelection | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const value = raw as { kind?: unknown; themes?: unknown; excluded?: unknown; units?: unknown }
  if (value.kind === 'units') return { kind: 'units', units: numbers(value.units) }
  if (value.kind !== 'theme' || !Array.isArray(value.themes)) return undefined
  return { kind: 'theme', themes: value.themes.filter(isTheme), excluded: numbers(value.excluded) }
}

/** Прежние галочки глав: новые главы были включены, снятые оставались снятыми. */
export function selectionFromTicks(
  saved: unknown,
  chapters: Chapter[] = CHAPTERS,
): BookSelection | undefined {
  if (!saved || typeof saved !== 'object') return undefined
  const ticks = saved as Record<number, unknown>
  const units = chapters.map((c) => c.unit).filter((unit) => ticks[unit] !== false)
  const themes = SECTIONS.flatMap(({ section, tags }) => [
    { section },
    ...tags.map(({ tag }) => ({ section, tag })),
  ])
  const same = themes.find((theme) => {
    const of = unitsOfTheme(theme, chapters)
    return of.length === units.length && of.every((u) => units.includes(u))
  })
  return same ? { kind: 'theme', themes: [same], excluded: [] } : onlyUnits(units)
}
