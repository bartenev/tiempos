import { IRREGULAR_INFINITIVES } from '../data/verbs'
import type { Tense } from '../types'
import { PERSONS, TENSES, VERB_GROUPS } from '../types'
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
  const word = n % 10 === 1 && n % 100 !== 11 ? 'неправильный' : 'неправильных'
  return `${n} ${word}`
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
