import { VERBS, isRegularIn } from '../data/verbs'
import type { Person, Tense, VerbGroup } from '../types'
import { TENSES, VERB_GROUPS, personsFor } from '../types'
import type { StatsStore } from './stats'
import { cellKey } from './stats'
import type { RunStore } from './runs'
import { GREEN_RUN, runKey } from './runs'
import { isDarkTheme } from './theme'

/**
 * Счёт пары время × местоимение: Σ (верные − ошибки).
 * Учитываются только правильные формы — таблицы про окончания: правильные времена
 * любых глаголов (tener в imperfecto — да; abrir в perfecto — нет).
 */
export function sumByTensePerson(stats: StatsStore, tense: Tense, person: Person): number {
  let total = 0
  for (const verb of VERBS) {
    if (!isRegularIn(verb, tense)) continue
    const stat = stats[cellKey(verb.infinitive, tense, person)]
    if (stat) total += stat.ok - stat.bad
  }
  return total
}

export interface CellHeat {
  /** Верных подряд в ячейке; undefined — ответов ещё не было. */
  run: number | undefined
  /** Верно, но медленно: клетка в разогреве умной очереди. */
  slow: boolean
  /** Сколько дней не было ответов (null — не было вовсе). */
  days: number | null
  color: string
}

/** Что ещё знаем о ячейках, кроме серии: медленные (runKey) и последний ответ (runKey → ms). */
export interface HeatExtras {
  slow?: Set<string>
  last?: Map<string, number>
  now?: number
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Клетка остыла: столько дней без ответов (как у разогрева умного режима — такую он проверит).
 * Остывшая клетка бледнеет одной ступенькой, без плавного перехода: иначе зелёная таблица
 * пестрит оттенками и не понять, всё ли в порядке.
 */
export const FADE_FROM_DAYS = 2
/** Насколько бледнеет остывшая клетка. */
export const COLD_FADE = 0.6

/** Насколько клетка побледнела: 0 — свежая, COLD_FADE — остыла. */
export function fadeOf(days: number | null): number {
  return days !== null && days >= FADE_FROM_DAYS ? COLD_FADE : 0
}

/** Последний ответ по ячейкам «Таблиц» (runKey) — из истории правильных форм. */
export function lastByCell(stats: StatsStore): Map<string, number> {
  const last = new Map<string, number>()
  for (const verb of VERBS) {
    for (const tense of TENSES) {
      if (!isRegularIn(verb, tense)) continue
      for (const person of personsFor(tense)) {
        const stat = stats[cellKey(verb.infinitive, tense, person)]
        if (!stat) continue
        const key = runKey(verb.group, tense, person)
        last.set(key, Math.max(last.get(key) ?? 0, stat.last))
      }
    }
  }
  return last
}

/** Ячейки таблицы: лицо × -ar / -er / -ir (только лица этого времени — в императиве нет yo). */
export type TenseHeat = Partial<Record<Person, Record<VerbGroup, CellHeat>>>

/**
 * Цвет каждой ячейки — по серии верных подряд в правильных глаголах её группы
 * для этого времени и лица: GREEN_RUN подряд — зелёная, ошибка — красная.
 */
export function heatByCell(runs: RunStore, tense: Tense, extras: HeatExtras = {}): TenseHeat {
  const now = extras.now ?? Date.now()
  const result: TenseHeat = {}
  for (const person of personsFor(tense)) {
    result[person] = Object.fromEntries(
      VERB_GROUPS.map((group) => {
        const key = runKey(group, tense, person)
        const run = runs[key]
        const slow = extras.slow?.has(key) ?? false
        const last = extras.last?.get(key)
        const days = last === undefined ? null : Math.floor((now - last) / DAY_MS)
        return [group, { run, slow, days, color: runColor(run, { slow, fade: fadeOf(days) }) }]
      }),
    ) as Record<VerbGroup, CellHeat>
  }
  return result
}

/** Сколько ещё верных ответов нужно, чтобы позеленела вся таблица времени. */
export function repsToGreen(heat: TenseHeat): number {
  return Object.values(heat).reduce(
    (total, row) =>
      total + VERB_GROUPS.reduce((sum, group) => sum + Math.max(0, GREEN_RUN - (row![group].run ?? 0)), 0),
    0,
  )
}

/** Состояние таблицы времени: сколько верных до зелёной, сколько клеток медленных и остывших. */
export interface TableStatus {
  /** Верных подряд, которых не хватает до зелёной таблицы. */
  need: number
  /** Клеток с полной серией, но медленных (жёлтые). */
  slow: number
  /** Клеток с полной серией, но давно не тренированных (бледные). */
  cold: number
}

export function tableStatus(heat: TenseHeat): TableStatus {
  let slow = 0
  let cold = 0
  for (const row of Object.values(heat)) {
    for (const group of VERB_GROUPS) {
      const cell = row![group]
      if ((cell.run ?? 0) < GREEN_RUN) continue
      if (cell.slow) slow += 1
      else if (fadeOf(cell.days) > 0) cold += 1
    }
  }
  return { need: repsToGreen(heat), slow, cold }
}

/** Жёлтый — потолок медленной клетки: верно, но ещё не автоматически. */
export const SLOW_MAX_HUE = 60

/**
 * Нет ответов — нейтральный; 0 (последний ответ — ошибка) → красный; GREEN_RUN и больше → зелёный.
 * Медленная клетка — не зеленее жёлтой; давно не тренированная бледнеет (fade 0…1).
 */
export function runColor(run: number | undefined, { slow = false, fade = 0 } = {}): string {
  const dark = isDarkTheme()
  if (run === undefined) return dark ? 'hsl(60 18% 22%)' : 'hsl(60 35% 92%)'
  const t = Math.min(run, GREEN_RUN) / GREEN_RUN
  // hue: 0 (red, плохо) → 120 (green, хорошо)
  const hue = slow ? Math.min(120 * t, SLOW_MAX_HUE) : 120 * t
  // бледнеет: насыщенность уходит, цвет — к нейтральному фону пустой клетки
  const keep = 1 - 0.8 * fade
  return dark
    ? `hsl(${hue.toFixed(1)} ${(42 * keep).toFixed(1)}% ${(28 - 5 * fade).toFixed(1)}%)`
    : `hsl(${hue.toFixed(1)} ${(65 * keep).toFixed(1)}% ${(88 + 4 * fade).toFixed(1)}%)`
}
