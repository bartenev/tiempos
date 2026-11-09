import { REGULAR_VERBS, isRegularIn } from '../data/verbs'
import type { Person, Tense, VerbGroup } from '../types'
import { VERB_GROUPS, personsFor } from '../types'
import type { StatsStore } from './stats'
import { cellKey } from './stats'
import type { RunStore } from './runs'
import { GREEN_RUN, runKey } from './runs'
import { isDarkTheme } from './theme'

/**
 * Счёт пары время × местоимение: Σ (верные − ошибки).
 * Учитываются только правильные формы — таблицы про окончания
 * (в perfecto без неправильных participios: escrito, abierto).
 */
export function sumByTensePerson(stats: StatsStore, tense: Tense, person: Person): number {
  let total = 0
  for (const verb of REGULAR_VERBS) {
    if (!isRegularIn(verb, tense)) continue
    const stat = stats[cellKey(verb.infinitive, tense, person)]
    if (stat) total += stat.ok - stat.bad
  }
  return total
}

export interface CellHeat {
  /** Верных подряд в ячейке; undefined — ответов ещё не было. */
  run: number | undefined
  color: string
}

/** Ячейки таблицы: лицо × -ar / -er / -ir (только лица этого времени — в императиве нет yo). */
export type TenseHeat = Partial<Record<Person, Record<VerbGroup, CellHeat>>>

/**
 * Цвет каждой ячейки — по серии верных подряд в правильных глаголах её группы
 * для этого времени и лица: GREEN_RUN подряд — зелёная, ошибка — красная.
 */
export function heatByCell(runs: RunStore, tense: Tense): TenseHeat {
  const result: TenseHeat = {}
  for (const person of personsFor(tense)) {
    result[person] = Object.fromEntries(
      VERB_GROUPS.map((group) => {
        const run = runs[runKey(group, tense, person)]
        return [group, { run, color: runColor(run) }]
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

/** Нет ответов — нейтральный; 0 (последний ответ — ошибка) → красный; GREEN_RUN и больше → зелёный. */
export function runColor(run: number | undefined): string {
  const dark = isDarkTheme()
  if (run === undefined) return dark ? 'hsl(60 18% 22%)' : 'hsl(60 35% 92%)'
  const t = Math.min(run, GREEN_RUN) / GREEN_RUN
  // hue: 0 (red, плохо) → 120 (green, хорошо)
  const hue = 120 * t
  return dark
    ? `hsl(${hue.toFixed(1)} 42% 28%)`
    : `hsl(${hue.toFixed(1)} 65% 88%)`
}
