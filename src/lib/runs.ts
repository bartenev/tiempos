import { REGULAR_INFINITIVES } from '../data/verbs'
import type { Person, Tense, Verb, VerbGroup } from '../types'

/**
 * Серии верных подряд по ячейкам «Таблиц»: время × лицо × группа (-ar / -er / -ir).
 * Ячейка объединяет все правильные глаголы группы, поэтому серия своя —
 * из серий отдельных форм её не восстановить. Ключа нет — ответов ещё не было;
 * 0 — последний ответ в ячейке был ошибкой.
 */
export const RUNS_KEY = 'tiempos.tables.v1'

/** Столько верных подряд — и ячейка таблицы полностью зелёная. */
export const GREEN_RUN = 5

export type RunStore = Record<string, number>

export function runKey(group: VerbGroup, tense: Tense, person: Person): string {
  return `${group}|${tense}|${person}`
}

export function loadRuns(): RunStore {
  try {
    const raw = localStorage.getItem(RUNS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const store: RunStore = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0) store[key] = value
    }
    return store
  } catch {
    return {}
  }
}

function saveRuns(store: RunStore): void {
  try {
    localStorage.setItem(RUNS_KEY, JSON.stringify(store))
  } catch {
    /* хранилище недоступно — серия не сохранится */
  }
}

/** Серия ячейки, в которую попадает форма; null — форма не из таблиц (неправильный глагол). */
export function runOf(verb: Verb, tense: Tense, person: Person): number | undefined | null {
  if (!REGULAR_INFINITIVES.has(verb.infinitive)) return null
  return loadRuns()[runKey(verb.group, tense, person)]
}

/** Ответ в правильном глаголе: верный продлевает серию ячейки, ошибка обнуляет. */
export function recordRun(verb: Verb, tense: Tense, person: Person, correct: boolean): void {
  if (!REGULAR_INFINITIVES.has(verb.infinitive)) return
  const store = loadRuns()
  const key = runKey(verb.group, tense, person)
  store[key] = correct ? (store[key] ?? 0) + 1 : 0
  saveRuns(store)
}

/** Отмена ответа: вернуть ячейке прежнюю серию (undefined — ответов не было). */
export function restoreRun(verb: Verb, tense: Tense, person: Person, previous: number | undefined | null): void {
  if (previous === null || !REGULAR_INFINITIVES.has(verb.infinitive)) return
  const store = loadRuns()
  const key = runKey(verb.group, tense, person)
  if (previous === undefined) delete store[key]
  else store[key] = previous
  saveRuns(store)
}
