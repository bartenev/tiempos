import type { Person, Tense, VerbGroup } from '../types'
import { TENSES, VERB_GROUPS } from '../types'
import type { CellStat } from './stats'
import { isWeak } from './stats'

/**
 * Порции новых форм для умного режима.
 * Порция — время × окончание (indefinido -ar); внутри — все лица и глаголы, вперемешку.
 * Текущая порция — самая продвинутая из начатых; если ничего не начато — первая по порядку.
 * Следующая становится текущей, когда текущая освоена.
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
 * current — сейчас изучается (самая продвинутая из начатых, иначе первая неосвоенная);
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

interface PortionProgress {
  tense: Tense
  group: VerbGroup
  personsDone: number
  personsTotal: number
  /** Верных ответов по всем формам порции. */
  ok: number
  started: boolean
}

/** Продвинутость: доля освоенных лиц, при равенстве — число верных ответов. */
function isAhead(a: PortionProgress, b: PortionProgress): boolean {
  const ra = a.personsDone / a.personsTotal
  const rb = b.personsDone / b.personsTotal
  return ra !== rb ? ra > rb : a.ok > b.ok
}

/** Статусы порций в порядке изучения: времена как в TENSES, окончания -ar → -er → -ir. */
export function portionStatuses(cells: PortionCell[]): PortionStatus[] {
  const portions: PortionProgress[] = []
  for (const tense of TENSES) {
    for (const group of VERB_GROUPS) {
      const inPortion = cells.filter((c) => c.tense === tense && c.verb.group === group)
      if (inPortion.length === 0) continue

      const persons = [...new Set(inPortion.map((c) => c.person))]
      portions.push({
        tense,
        group,
        personsDone: persons.filter((p) => personDone(inPortion.filter((c) => c.person === p)))
          .length,
        personsTotal: persons.length,
        ok: inPortion.reduce((sum, c) => sum + (c.stat?.ok ?? 0), 0),
        started: inPortion.some((c) => c.stat),
      })
    }
  }

  // Начатое доводим до конца: из начатых — самая продвинутая (при равенстве — первая по порядку).
  const unfinished = portions.filter((p) => p.personsDone < p.personsTotal)
  const started = unfinished.filter((p) => p.started)
  const current =
    started.length > 0
      ? started.reduce((best, p) => (isAhead(p, best) ? p : best))
      : unfinished[0]

  return portions.map(({ tense, group, personsDone, personsTotal, started }, i) => {
    let state: PortionState
    if (personsDone === personsTotal) state = 'mastered'
    else if (portions[i] === current) state = 'current'
    else state = started ? 'open' : 'locked'
    return { tense, group, state, personsDone, personsTotal }
  })
}
