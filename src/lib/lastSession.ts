import type { SessionMistake, Track } from '../types'

/**
 * Незакрытая сессия: счёт сохраняется после каждого ответа. Если приложение закрыли,
 * не открыв итог, он покажется при следующем входе.
 */
export const LAST_SESSION_KEY = 'tiempos.session.v1'

export interface SavedSession {
  track: Track
  correct: number
  wrong: number
  skipped: number
  bestStreak: number
  startedAt: number
  /** Последний ответ (ms): по нему считается длительность. */
  lastAt: number
  mistakes: SessionMistake[]
}

const NUMBERS = ['correct', 'wrong', 'skipped', 'bestStreak', 'startedAt', 'lastAt'] as const

function isMistake(value: unknown): value is SessionMistake {
  if (!value || typeof value !== 'object') return false
  const m = value as Record<string, unknown>
  return (['key', 'meta', 'answer', 'given'] as const).every((k) => typeof m[k] === 'string')
}

export function loadLastSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(LAST_SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Record<string, unknown>
    if (!s || typeof s !== 'object') return null
    if (!NUMBERS.every((k) => typeof s[k] === 'number' && Number.isFinite(s[k]))) return null
    if (!['verbs', 'articles', 'book'].includes(s.track as string)) return null
    if (!Array.isArray(s.mistakes)) return null
    const saved = { ...s, mistakes: s.mistakes.filter(isMistake) } as unknown as SavedSession
    return saved.correct + saved.wrong + saved.skipped > 0 ? saved : null
  } catch {
    return null
  }
}

export function saveLastSession(session: SavedSession): void {
  try {
    localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(session))
  } catch {
    /* хранилище недоступно — итог пропадёт вместе со вкладкой */
  }
}

export function clearLastSession(): void {
  try {
    localStorage.removeItem(LAST_SESSION_KEY)
  } catch {
    /* нечего чистить */
  }
}
