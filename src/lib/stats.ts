import type { Person, Tense } from '../types'

/**
 * История по каждой форме глагол × время × местоимение —
 * единственное хранилище прогресса (смарт-очередь, «Прогресс», «Таблицы»).
 */
export const STATS_KEY = 'tiempos.stats.v1'

/** То же по упражнениям учебника: ключ — BookCard.key. */
export const BOOK_STATS_KEY = 'tiempos.book.v2'

/** Прежний прогресс по учебнику: ключом был текст упражнения. */
export const LEGACY_BOOK_STATS_KEY = 'tiempos.book.v1'

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

/** Минимум верных подряд, чтобы форма перестала быть «слабой» (при 1–2 ошибках). */
export const RECOVER_STREAK = 2
/** Потолок: даже при многих ошибках хватит стольких верных подряд. */
export const MAX_RECOVER_STREAK = 4
/** С какой серии форма без ошибок считается выученной. */
export const SOLID_STREAK = 3

/**
 * Сколько верных подряд нужно, чтобы выйти из слабых: чем больше ошибок
 * в форме за всё время, тем выше планка. 1–2 ошибки → 2, 3–4 → 3, 5+ → 4.
 */
export function recoveryStreak(bad: number): number {
  if (bad <= 0) return 0
  return Math.min(MAX_RECOVER_STREAK, RECOVER_STREAK + Math.floor((bad - 1) / 2))
}

/** С какой серии форма выучена: на одну больше, чем нужно для выхода из слабых. */
export function solidStreak(bad: number): number {
  return Math.max(SOLID_STREAK, recoveryStreak(bad) + 1)
}

/** Предел паузы перед повторением, дней. */
export const MAX_REVIEW_DAYS = 60

const DAY_MS = 24 * 60 * 60 * 1000

/** Через сколько дней вернуться к форме: каждый верный ответ подряд удваивает срок. */
export function reviewDays(streak: number): number {
  return Math.min(MAX_REVIEW_DAYS, 2 ** streak)
}

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

function loadStore(storageKey: string): StatsStore {
  try {
    const raw = localStorage.getItem(storageKey)
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

export function loadStats(): StatsStore {
  return loadStore(STATS_KEY)
}

export function saveStats(store: StatsStore): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(store))
}

export function loadBookStats(): StatsStore {
  return loadStore(BOOK_STATS_KEY)
}

/** Перенести прогресс на новые ключи при запуске; старый ключ стираем после записи. */
export function migrateBookStats(newKeys: Record<string, string>): void {
  try {
    if (localStorage.getItem(LEGACY_BOOK_STATS_KEY) === null) return
    const store = loadStore(BOOK_STATS_KEY)
    for (const [oldKey, stat] of Object.entries(loadStore(LEGACY_BOOK_STATS_KEY))) {
      const key = newKeys[oldKey]
      if (key && !store[key]) store[key] = stat
    }
    localStorage.setItem(BOOK_STATS_KEY, JSON.stringify(store))
    localStorage.removeItem(LEGACY_BOOK_STATS_KEY)
  } catch {
    /* хранилище недоступно — старый ключ остаётся до следующего запуска */
  }
}

function record(storageKey: string, key: string, correct: boolean, now: number): CellStat {
  const store = loadStore(storageKey)
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
  localStorage.setItem(storageKey, JSON.stringify(store))
  return stat
}

export function recordAttempt(
  infinitive: string,
  tense: Tense,
  person: Person,
  correct: boolean,
  now: number = Date.now(),
): CellStat {
  return record(STATS_KEY, cellKey(infinitive, tense, person), correct, now)
}

export function recordBookAttempt(
  key: string,
  correct: boolean,
  now: number = Date.now(),
): CellStat {
  return record(BOOK_STATS_KEY, key, correct, now)
}

function restore(storageKey: string, key: string, previous: CellStat | undefined): void {
  const store = loadStore(storageKey)
  if (previous) store[key] = previous
  else delete store[key]
  localStorage.setItem(storageKey, JSON.stringify(store))
}

/** Вернуть форме прежнюю историю (отмена ответа); undefined — истории не было. */
export function restoreStat(
  infinitive: string,
  tense: Tense,
  person: Person,
  previous: CellStat | undefined,
): void {
  restore(STATS_KEY, cellKey(infinitive, tense, person), previous)
}

export function restoreBookStat(key: string, previous: CellStat | undefined): void {
  restore(BOOK_STATS_KEY, key, previous)
}

/** Слабая форма: были ошибки и с тех пор меньше recoveryStreak(bad) верных подряд. */
export function isWeak(stat: CellStat | undefined): boolean {
  if (!stat) return false
  return stat.bad > 0 && stat.streak < recoveryStreak(stat.bad)
}

export function masteryOf(stat: CellStat | undefined): Mastery {
  if (isWeak(stat)) return 'weak'
  if (!stat) return 'new'
  return stat.streak >= solidStreak(stat.bad) ? 'solid' : 'learning'
}

/** Пора повторить: с последнего ответа прошло больше reviewDays(streak) дней. */
export function isDue(stat: CellStat, now: number = Date.now()): boolean {
  return now - stat.last >= reviewDays(stat.streak) * DAY_MS
}

/**
 * Вес формы для смарт-очереди: слабые ×~4 чаще новых,
 * выученные — всё реже с ростом серии, пока не подойдёт срок повторения.
 */
export function cellWeight(stat: CellStat | undefined, now: number = Date.now()): number {
  if (!stat) return 2.5
  if (isWeak(stat)) return 8 + Math.min(stat.bad, 5)
  if (isDue(stat, now)) return 2.5
  return Math.max(0.4, 2.5 / (1 + stat.streak * 0.5))
}

/** Доля ошибок — для сортировки «топ слабых». */
export function errorRate(stat: CellStat): number {
  const total = stat.ok + stat.bad
  return total === 0 ? 0 : stat.bad / total
}
