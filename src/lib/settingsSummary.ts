import { CHAPTERS, SECTIONS } from '../data/book'
import { IRREGULAR_INFINITIVES } from '../data/verbs'
import type { BookSelection, BookTheme, Tense } from '../types'
import { PERSONS, TENSES, VERB_GROUPS } from '../types'
import { chapterSize } from './book'
import { selectedUnits } from './bookSelection'
import { pluralRu } from './plural'
import type { SetupSettings } from './settings'
import { selectedIrregularList } from './settings'

/** Короткие названия времён для сводки на главной. */
export const TENSE_SHORT_NAMES: Record<Tense, string> = {
  presente: 'Presente',
  indefinido: 'Indefinido',
  imperfecto: 'Imperfecto',
  imperativo: 'Imperativo',
}

export interface SettingsSummary {
  tenses: string
  persons: string
  groups: string
  verbs: string
  size: string
}

const NOTHING = '—'

/** «все» — если отмечено всё, иначе перечисление; ничего — «—». */
function listOrAll(picked: string[], total: number): string {
  if (picked.length === 0) return NOTHING
  if (picked.length === total) return 'все'
  return picked.join(', ')
}

/** «1 неправильный», «2 / 5 / 11 неправильных». */
export function irregularLabel(n: number): string {
  return `${n} ${pluralRu(n, 'неправильный', 'неправильных', 'неправильных')}`
}

function describeVerbs(settings: SetupSettings): string {
  const total = IRREGULAR_INFINITIVES.length
  const picked = settings.includeIrregular
    ? selectedIrregularList(settings.selectedIrregular).length
    : 0
  const regular = settings.includeRegular
  if (regular && picked === total) return 'все'
  if (regular && picked > 0) return `правильные + ${irregularLabel(picked)}`
  if (regular) return 'только правильные'
  if (picked === total) return 'только неправильные'
  if (picked > 0) return irregularLabel(picked)
  return NOTHING
}

/** Что сейчас тренируется — по строке на каждый фильтр. */
export function describeSettings(settings: SetupSettings): SettingsSummary {
  return {
    tenses: listOrAll(
      TENSES.filter((t) => settings.selected[t]).map((t) => TENSE_SHORT_NAMES[t]),
      TENSES.length,
    ),
    persons: listOrAll(
      PERSONS.filter((p) => settings.persons[p]),
      PERSONS.length,
    ),
    groups: listOrAll(
      VERB_GROUPS.filter((g) => settings.groups[g]).map((g) => `-${g}`),
      VERB_GROUPS.length,
    ),
    verbs: describeVerbs(settings),
    size: `${settings.size} карточек`,
  }
}

export interface BookSummary {
  theme: string
  chapters: string
  exercises: string
  size: string
}

function themeLabel({ section, tag }: BookTheme): string {
  const known = SECTIONS.find((s) => s.section === section)
  return known?.tags.find((t) => t.tag === tag)?.label ?? known?.all ?? section
}

/** Название выбора: темы (и сколько глав из них снято) или номер главы / «своя подборка». */
function describeTheme(selection: BookSelection, units: number[]): string {
  if (units.length === 0) return NOTHING
  if (selection.kind === 'units') {
    return units.length === 1 ? `Глава ${units[0]}` : 'своя подборка'
  }
  const names = selection.themes.map(themeLabel).join(', ')
  const removed = selectedUnits({ ...selection, excluded: [] }).length - units.length
  return removed > 0 ? `${names}, без ${removed} гл.` : names
}

export function describeBook(settings: SetupSettings): BookSummary {
  const units = selectedUnits(settings.bookSelection)
  const exercises = CHAPTERS.filter((c) => units.includes(c.unit)).reduce(
    (sum, c) => sum + chapterSize(c),
    0,
  )
  return {
    theme: describeTheme(settings.bookSelection, units),
    chapters: units.length === 0 ? NOTHING : `${units.length} из ${CHAPTERS.length}`,
    exercises: String(exercises),
    size: `${settings.size} карточек`,
  }
}
