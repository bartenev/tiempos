import type { Person, Tense } from '../types'

/**
 * Подробная история по каждой форме глагол × время × местоимение.
 * В отличие от progress (счёт только для правильных глаголов),
 * ошибки пишутся для всех глаголов — по ним строится смарт-очередь.
 */
export const STATS_KEY = 'tiempos.stats.v1'

export interface CellStat {
  /** Верных ответов всего. */
  ok: number
  /** Ошибок всего (включая «почти»). */
  bad: number
  /** Верных подряд с последней ошибки. */
  streak: number
  /** Время последнего ответа (ms). */
  last: number
}

export type StatsStore = Record<string, CellStat>

/** Сколько верных подряд нужно, чтобы форма перестала быть «слабой». */
export const RECOVER_STREAK = 2
/** С какой серии форма считается выученной. */
export const SOLID_STREAK = 3

export type Mastery = 'new' | 'weak' | 'learning' | 'solid'

export function cellKey(infinitive: string, tense: Tense, person: Person): string {
  return `${infinitive}|${tense}|${person}`
}

export function parseCellKey(
  key: string,
): { infinitive: string; tense: Tense; person: Person } {
  const [infinitive, tense, person] = key.split('|') as [string, Tense, Person]
  return { infinitive, tense, person }
}

function isCellStat(value: unknown): value is CellStat {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (['ok', 'bad', 'streak', 'last'] as const).every(
    (k) => typeof obj[k] === 'number' && Number.isFinite(obj[k]),
  )
}

export function loadStats(): StatsStore {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const store: StatsStore = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isCellStat(value)) store[key] = value
    }
    return store
  } catch {
    return {}
  }
}

export function saveStats(store: StatsStore): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(store))
}

export function recordAttempt(
  infinitive: string,
  tense: Tense,
  person: Person,
  correct: boolean,
  now: number = Date.now(),
): CellStat {
  const store = loadStats()
  const key = cellKey(infinitive, tense, person)
  const stat = store[key] ?? { ok: 0, bad: 0, streak: 0, last: 0 }
  if (correct) {
    stat.ok += 1
    stat.streak += 1
  } else {
    stat.bad += 1
    stat.streak = 0
  }
  stat.last = now
  store[key] = stat
  saveStats(store)
  return stat
}

/**
 * Слабая форма: была ошибка и с тех пор меньше RECOVER_STREAK верных подряд.
 * Без истории — смотрим на старый счёт progress (минус = слабая).
 */
export function isWeak(stat: CellStat | undefined, score = 0): boolean {
  if (!stat) return score < 0
  return stat.bad > 0 && stat.streak < RECOVER_STREAK
}

export function masteryOf(stat: CellStat | undefined, score = 0): Mastery {
  if (isWeak(stat, score)) return 'weak'
  if (!stat) return score > 0 ? 'learning' : 'new'
  return stat.streak >= SOLID_STREAK ? 'solid' : 'learning'
}

/**
 * Вес формы для смарт-очереди: слабые ×~4 чаще новых,
 * выученные — всё реже с ростом серии.
 */
export function cellWeight(stat: CellStat | undefined, score = 0): number {
  if (isWeak(stat, score)) return 8 + Math.min(stat?.bad ?? 1, 5)
  if (!stat) return score > 0 ? 1.5 : 2.5
  return Math.max(0.4, 2.5 / (1 + stat.streak * 0.5))
}

/** Доля ошибок — для сортировки «топ слабых». */
export function errorRate(stat: CellStat): number {
  const total = stat.ok + stat.bad
  return total === 0 ? 0 : stat.bad / total
}
