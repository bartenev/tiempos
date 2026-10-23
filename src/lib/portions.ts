import type { Person, Tense, VerbGroup } from '../types'
import { TENSES, VERB_GROUPS } from '../types'
import type { CellStat } from './stats'
import { isWeak } from './stats'

/**
 * Порции новых форм для умного режима.
 * Порция — время × окончание (indefinido -ar); внутри — все лица и глаголы, вперемешку.
 * Новое время открывается порциями по порядку: следующая — когда текущая освоена.
 */

/** Форма с историей ответов — всё, что нужно для статуса порции. */
export interface PortionCell {
  verb: { group: VerbGroup }
  tense: Tense
  person: Person
  stat: CellStat | undefined
}

/** Лицо порции освоено: столько верных по её формам и ни одной слабой. */
export const PERSON_OK = 2

/**
 * mastered — освоена (её новые формы — уже повторение);
 * current — сейчас изучается (первая неосвоенная);
 * open — не освоена, но вы уже её тренировали — остаётся в очереди;
 * locked — ещё не начата, ждёт своей очереди.
 */
export type PortionState = 'mastered' | 'current' | 'open' | 'locked'

export interface PortionStatus {
  tense: Tense
  group: VerbGroup
  state: PortionState
  personsDone: number
  personsTotal: number
}

export function portionKey(tense: Tense, group: VerbGroup): string {
  return `${tense}|${group}`
}

function personDone(cells: PortionCell[]): boolean {
  const ok = cells.reduce((sum, c) => sum + (c.stat?.ok ?? 0), 0)
  return ok >= PERSON_OK && !cells.some((c) => isWeak(c.stat))
}

/** Статусы порций в порядке изучения: времена как в TENSES, окончания -ar → -er → -ir. */
export function portionStatuses(cells: PortionCell[]): PortionStatus[] {
  const result: PortionStatus[] = []
  let currentFound = false
  for (const tense of TENSES) {
    for (const group of VERB_GROUPS) {
      const inPortion = cells.filter((c) => c.tense === tense && c.verb.group === group)
      if (inPortion.length === 0) continue

      const persons = [...new Set(inPortion.map((c) => c.person))]
      const personsDone = persons.filter((p) =>
        personDone(inPortion.filter((c) => c.person === p)),
      ).length

      let state: PortionState
      if (personsDone === persons.length) state = 'mastered'
      else if (!currentFound) {
        state = 'current'
        currentFound = true
      } else state = inPortion.some((c) => c.stat) ? 'open' : 'locked'

      result.push({ tense, group, state, personsDone, personsTotal: persons.length })
    }
  }
  return result
}
