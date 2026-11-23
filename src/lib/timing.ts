import type { CardReason } from '../types'

/** Почему карточка пришла: подпись темпа, повтор ошибки или то же правило на другом глаголе. */
export type TimingReason = CardReason | 'retry' | 'sibling'

/**
 * Время ответов по формам глаголов — основа для разогрева в умном режиме:
 * какие группы вспоминаются медленно, какой у вас обычный темп.
 * Храним последние MAX_TIMINGS ответов (старые вытесняются).
 */
export const TIMING_KEY = 'tiempos.timing.v1'

/** Сколько последних ответов хранить: хватает на эталон и группы, не раздувая хранилище. */
export const MAX_TIMINGS = 2000

export interface Timing {
  /** Форма: cellKey (`hablar|presente|yo`). */
  k: string
  /** Когда ответили (ms). */
  at: number
  /**
   * Время вспоминания, ms: устно — до «показать ответ», текстом — до первой буквы
   * (скорость печати не считается).
   */
  ms: number
  /** От показа карточки до ответа целиком, ms. */
  total: number
  ok: boolean
  oral: boolean
  /** Длина предложения на карточке: часть времени уходит на чтение. */
  len: number
  /** Повтор после ошибки: форма только что была на экране — темп завышен. */
  retry?: boolean
  /** Что ввели при ошибке текстом (у устных ошибок ввода нет). */
  given?: string
  /** Почему карточка пришла (нет — обычная умная очередь или «Проверка»). */
  reason?: TimingReason
}

/** Сколько заняла карточка — то, что знает экран тренировки. */
export interface AnswerTiming {
  ms: number
  total: number
}

function isTiming(value: unknown): value is Timing {
  if (!value || typeof value !== 'object') return false
  const t = value as Record<string, unknown>
  return (
    typeof t.k === 'string' &&
    (['at', 'ms', 'total', 'len'] as const).every((k) => typeof t[k] === 'number' && Number.isFinite(t[k])) &&
    typeof t.ok === 'boolean' &&
    typeof t.oral === 'boolean'
  )
}

export function loadTimings(): Timing[] {
  try {
    const raw = localStorage.getItem(TIMING_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter(isTiming) : []
  } catch {
    return []
  }
}

function saveTimings(list: Timing[]): void {
  try {
    localStorage.setItem(TIMING_KEY, JSON.stringify(list))
  } catch {
    /* хранилище недоступно — время не сохранится */
  }
}

export function recordTiming(timing: Timing): void {
  const list = loadTimings()
  list.push(timing)
  saveTimings(list.slice(-MAX_TIMINGS))
}

/** Отмена ответа: убрать его время (ответ с этой формой и этим моментом). */
export function dropTiming(k: string, at: number): void {
  const list = loadTimings()
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i]!.k !== k || list[i]!.at !== at) continue
    list.splice(i, 1)
    saveTimings(list)
    return
  }
}
