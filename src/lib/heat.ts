import { REGULAR_INFINITIVES, REGULAR_VERBS } from '../data/verbs'
import type { Person, Tense, VerbGroup } from '../types'
import { VERB_GROUPS, personsFor } from '../types'
import type { StatsStore } from './stats'
import { cellKey } from './stats'
import { isDarkTheme } from './theme'

/**
 * Счёт пары время × местоимение: Σ (верные − ошибки).
 * Учитываются только правильные (регулярные) глаголы — таблицы про окончания;
 * infinitives сужает до одной группы (-ar / -er / -ir) для ячейки.
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

/** Правильные глаголы каждой группы — для счёта по ячейке таблицы. */
const REGULAR_BY_GROUP: Record<VerbGroup, ReadonlySet<string>> = {
  ar: new Set(REGULAR_VERBS.filter((v) => v.group === 'ar').map((v) => v.infinitive)),
  er: new Set(REGULAR_VERBS.filter((v) => v.group === 'er').map((v) => v.infinitive)),
  ir: new Set(REGULAR_VERBS.filter((v) => v.group === 'ir').map((v) => v.infinitive)),
}

export interface CellHeat {
  sum: number
  color: string
}

/** Ячейки таблицы: лицо × -ar / -er / -ir (только лица этого времени — в императиве нет yo). */
export type TenseHeat = Partial<Record<Person, Record<VerbGroup, CellHeat>>>

/**
 * Цвет каждой ячейки — по ответам в правильных глаголах её группы
 * для этого времени и лица: зелёный = лучше знаю, красный = хуже.
 * Нормализация по всем ячейкам одного времени.
 */
export function heatByCell(stats: StatsStore, tense: Tense): TenseHeat {
  const persons = personsFor(tense)
  const sums = persons.map((person) =>
    VERB_GROUPS.map((group) => sumByTensePerson(stats, tense, person, REGULAR_BY_GROUP[group])),
  )
  const values = sums.flat()
  const min = Math.min(...values)
  const max = Math.max(...values)

  const result: TenseHeat = {}
  persons.forEach((person, i) => {
    result[person] = Object.fromEntries(
      VERB_GROUPS.map((group, j) => {
        const sum = sums[i]![j]!
        return [group, { sum, color: heatColor(sum, min, max) }]
      }),
    ) as Record<VerbGroup, CellHeat>
  })
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
