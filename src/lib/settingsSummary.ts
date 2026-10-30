import { CHAPTERS, TAGS } from '../data/book'
import { IRREGULAR_INFINITIVES } from '../data/verbs'
import type { Tense } from '../types'
import { PERSONS, TENSES, VERB_GROUPS } from '../types'
import { chapterSize, unitsWithTag } from './book'
import { pluralRu } from './plural'
import type { SetupSettings } from './settings'
import { selectedIrregularList, selectedUnitList } from './settings'

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

/** Название выбора: тема, если отмечены ровно её главы, иначе номера глав или «своя подборка». */
function describeTheme(units: number[]): string {
  if (units.length === 0) return NOTHING
  const same = (other: number[]) =>
    other.length === units.length && other.every((u) => units.includes(u))
  const theme = TAGS.find(({ tag }) => same(unitsWithTag(tag)))
  if (theme) return theme.label
  return units.length === 1 ? `Глава ${units[0]}` : 'своя подборка'
}

export function describeBook(settings: SetupSettings): BookSummary {
  const units = selectedUnitList(settings.selectedUnits)
  const exercises = CHAPTERS.filter((c) => units.includes(c.unit)).reduce(
    (sum, c) => sum + chapterSize(c),
    0,
  )
  return {
    theme: describeTheme(units),
    chapters: units.length === 0 ? NOTHING : `${units.length} из ${CHAPTERS.length}`,
    exercises: String(exercises),
    size: `${settings.size} карточек`,
  }
}
