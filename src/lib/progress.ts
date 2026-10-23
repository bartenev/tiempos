import { REGULAR_INFINITIVES, VERBS } from '../data/verbs'
import type { Person, Tense } from '../types'
import { PERSONS } from '../types'
import { isDarkTheme } from './theme'

/** v2: глагол × время × местоимение */
export const PROGRESS_KEY = 'tiempos.progress.v2'

export const PROGRESS_TENSES: Tense[] = ['presente', 'indefinido', 'imperfecto']

export type PersonScores = Record<Person, number>
export type VerbScores = Record<Tense, PersonScores>
export type ProgressStore = Record<string, VerbScores>

function emptyPersonScores(): PersonScores {
  return {
    yo: 0,
    tú: 0,
    él: 0,
    nosotros: 0,
    vosotros: 0,
    ellos: 0,
  }
}

function emptyScores(): VerbScores {
  return {
    presente: emptyPersonScores(),
    indefinido: emptyPersonScores(),
    imperfecto: emptyPersonScores(),
  }
}

/** Полная матрица: глагол × время × местоимение = 0. */
export function createEmptyProgress(
  infinitives: string[] = VERBS.map((v) => v.infinitive),
): ProgressStore {
  const store: ProgressStore = {}
  for (const inf of infinitives) {
    store[inf] = emptyScores()
  }
  return store
}

function isPersonScores(value: unknown): value is PersonScores {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return PERSONS.every((p) => typeof obj[p] === 'number' && Number.isFinite(obj[p]))
}

function isScores(value: unknown): value is VerbScores {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return PROGRESS_TENSES.every((t) => isPersonScores(obj[t]))
}

/** Слить сохранённое с актуальным банком глаголов. */
export function mergeProgress(saved: unknown): ProgressStore {
  const base = createEmptyProgress()
  if (!saved || typeof saved !== 'object') return base

  const raw = saved as Record<string, unknown>
  for (const inf of Object.keys(base)) {
    const entry = raw[inf]
    if (!isScores(entry)) continue
    for (const tense of PROGRESS_TENSES) {
      for (const person of PERSONS) {
        base[inf]![tense][person] = Math.floor(entry[tense][person])
      }
    }
  }
  return base
}

export function loadProgress(): ProgressStore {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return createEmptyProgress()
    return mergeProgress(JSON.parse(raw) as unknown)
  } catch {
    return createEmptyProgress()
  }
}

export function saveProgress(store: ProgressStore): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(store))
}

/** +1 за верный ответ: глагол × время × местоимение. */
export function recordCorrect(
  infinitive: string,
  tense: Tense,
  person: Person,
): number {
  const store = loadProgress()
  if (!store[infinitive]) {
    store[infinitive] = emptyScores()
  }
  store[infinitive]![tense][person] += 1
  saveProgress(store)
  return store[infinitive]![tense][person]
}

/**
 * −1 за ошибку, только для правильных (регулярных) глаголов.
 * Счётчик может уходить в минус.
 */
export function recordWrong(
  infinitive: string,
  tense: Tense,
  person: Person,
): number | null {
  if (!REGULAR_INFINITIVES.has(infinitive)) return null
  const store = loadProgress()
  if (!store[infinitive]) {
    store[infinitive] = emptyScores()
  }
  store[infinitive]![tense][person] -= 1
  saveProgress(store)
  return store[infinitive]![tense][person]
}

export function getScore(infinitive: string, tense: Tense, person: Person): number {
  const store = loadProgress()
  return store[infinitive]?.[tense]?.[person] ?? 0
}

/**
 * Сумма очков для пары время × местоимение (верные − ошибки).
 * Учитываются только правильные (регулярные) глаголы.
 */
export function sumByTensePerson(
  store: ProgressStore,
  tense: Tense,
  person: Person,
  infinitives: ReadonlySet<string> = REGULAR_INFINITIVES,
): number {
  let total = 0
  for (const inf of infinitives) {
    total += store[inf]?.[tense]?.[person] ?? 0
  }
  return total
}

export type PersonHeat = Record<Person, { sum: number; color: string }>

/**
 * Цвет ячеек строки по сумме верных ответов (не ошибок):
 * зелёный = лучше знаю (больше сумма), красный = хуже (меньше).
 * Нормализация внутри одного времени.
 */
export function heatByPerson(
  store: ProgressStore,
  tense: Tense,
): PersonHeat {
  const sums = Object.fromEntries(
    PERSONS.map((p) => [p, sumByTensePerson(store, tense, p)]),
  ) as Record<Person, number>

  const values = PERSONS.map((p) => sums[p])
  const min = Math.min(...values)
  const max = Math.max(...values)

  const result = {} as PersonHeat
  for (const person of PERSONS) {
    result[person] = {
      sum: sums[person],
      color: heatColor(sums[person], min, max),
    }
  }
  return result
}

/**
 * t=1 (max, больше верных) → зелёный, t=0 (min) → красный.
 * Считаются только успешные ответы; ошибки в прогресс не пишутся.
 */
export function heatColor(score: number, min: number, max: number): string {
  const dark = isDarkTheme()
  if (max <= min) return dark ? 'hsl(60 18% 22%)' : 'hsl(60 35% 92%)'
  const t = (score - min) / (max - min)
  // hue: 0 (red, плохо) → 120 (green, хорошо)
  const hue = 120 * t
  return dark
    ? `hsl(${hue.toFixed(1)} 42% 28%)`
    : `hsl(${hue.toFixed(1)} 65% 88%)`
}
