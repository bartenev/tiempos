import { REGULAR_INFINITIVES } from '../data/verbs'
import type { Person, Tense } from '../types'
import { PERSONS } from '../types'
import type { StatsStore } from './stats'
import { cellKey } from './stats'
import { isDarkTheme } from './theme'

/**
 * Счёт пары время × местоимение: Σ (верные − ошибки).
 * Учитываются только правильные (регулярные) глаголы — таблицы про окончания.
 */
export function sumByTensePerson(
  stats: StatsStore,
  tense: Tense,
  person: Person,
  infinitives: ReadonlySet<string> = REGULAR_INFINITIVES,
): number {
  let total = 0
  for (const inf of infinitives) {
    const stat = stats[cellKey(inf, tense, person)]
    if (stat) total += stat.ok - stat.bad
  }
  return total
}

export type PersonHeat = Record<Person, { sum: number; color: string }>

/**
 * Цвет ячеек строки по счёту:
 * зелёный = лучше знаю (больше сумма), красный = хуже (меньше).
 * Нормализация внутри одного времени.
 */
export function heatByPerson(stats: StatsStore, tense: Tense): PersonHeat {
  const sums = Object.fromEntries(
    PERSONS.map((p) => [p, sumByTensePerson(stats, tense, p)]),
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

/** t=1 (max) → зелёный, t=0 (min) → красный. */
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
