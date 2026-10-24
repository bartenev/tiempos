import type { Person, Tense, Verb } from '../types'
import { TENSES, VERB_GROUPS } from '../types'
import type { PortionId } from './patterns'
import { PATTERNS_BY_TENSE, portionOf } from './patterns'
import type { CellStat } from './stats'
import { isWeak, recoveryStreak } from './stats'

/**
 * Порции новых форм для умного режима.
 * Порция — время × (окончание или модель неправильности): indefinido -ar, presente e→ie,
 * indefinido «основа на -u-». Порция у каждой формы своя: tenemos — в presente -er,
 * tengo — в «yo на -go», tienes — в e→ie. Внутри — все лица и глаголы, вперемешку.
 * Текущая порция — самая продвинутая из начатых; если ничего не начато — первая по порядку.
 * Следующая (next) — та, что станет текущей, когда текущая будет освоена; дальше — по
 * тому же правилу (rank — место в этой очереди).
 */

/** Форма с историей ответов — всё, что нужно для статуса порции. */
export interface PortionCell {
  verb: Verb
  tense: Tense
  person: Person
  stat: CellStat | undefined
}

/** Лицо порции освоено: столько верных по её формам и ни одной слабой. */
export const PERSON_OK = 2

/**
 * mastered — освоена (её новые формы — уже повторение);
 * current — сейчас изучается (самая продвинутая из начатых, иначе первая неосвоенная);
 * next — станет текущей после неё (выбирается по тому же правилу);
 * open — не освоена, но вы уже её тренировали — остаётся в очереди;
 * locked — ещё не начата, ждёт своей очереди.
 */
export type PortionState = 'mastered' | 'current' | 'next' | 'open' | 'locked'

export interface PortionStatus {
  tense: Tense
  portion: PortionId
  state: PortionState
  personsDone: number
  personsTotal: number
  /** Сколько верных ответов (как минимум) осталось до освоения порции. */
  need: number
  /** Место в очереди изучения: 0 — текущая, 1 — следующая…; у освоенных — null. */
  rank: number | null
}

export function portionKey(tense: Tense, portion: PortionId): string {
  return `${tense}|${portion}`
}

/** Ключ порции, в которую входит форма. */
export function cellPortionKey(cell: PortionCell): string {
  return portionKey(cell.tense, portionOf(cell.verb, cell.tense, cell.person))
}

function personDone(cells: PortionCell[]): boolean {
  return personNeed(cells) === 0
}

/** Верных ответов до освоения лица: добрать PERSON_OK и вытащить слабые формы. */
function personNeed(cells: PortionCell[]): number {
  const ok = cells.reduce((sum, c) => sum + (c.stat?.ok ?? 0), 0)
  const recover = cells.reduce(
    (sum, c) => sum + (c.stat && isWeak(c.stat) ? recoveryStreak(c.stat.bad) - c.stat.streak : 0),
    0,
  )
  return Math.max(0, PERSON_OK - ok) + recover
}

interface PortionProgress {
  tense: Tense
  portion: PortionId
  personsDone: number
  personsTotal: number
  need: number
  /** Верных ответов по всем формам порции. */
  ok: number
  started: boolean
}

/** Какая порция изучается: из начатых — самая продвинутая (при равенстве — первая по порядку). */
function pickCurrent(unfinished: PortionProgress[]): PortionProgress | undefined {
  const started = unfinished.filter((p) => p.started)
  return started.length > 0
    ? started.reduce((best, p) => (isAhead(p, best) ? p : best))
    : unfinished[0]
}

/** Продвинутость: доля освоенных лиц, при равенстве — число верных ответов. */
function isAhead(a: PortionProgress, b: PortionProgress): boolean {
  const ra = a.personsDone / a.personsTotal
  const rb = b.personsDone / b.personsTotal
  return ra !== rb ? ra > rb : a.ok > b.ok
}

/**
 * Статусы порций в порядке изучения: времена как в TENSES, внутри времени —
 * окончания -ar → -er → -ir, затем модели неправильности (PATTERNS_BY_TENSE).
 */
export function portionStatuses(cells: PortionCell[]): PortionStatus[] {
  const byPortion = new Map<string, PortionCell[]>()
  for (const cell of cells) {
    const key = cellPortionKey(cell)
    const list = byPortion.get(key)
    if (list) list.push(cell)
    else byPortion.set(key, [cell])
  }

  const portions: PortionProgress[] = []
  for (const tense of TENSES) {
    for (const portion of [...VERB_GROUPS, ...PATTERNS_BY_TENSE[tense]]) {
      const inPortion = byPortion.get(portionKey(tense, portion))
      if (!inPortion) continue

      const persons = [...new Set(inPortion.map((c) => c.person))]
      const byPerson = persons.map((p) => inPortion.filter((c) => c.person === p))
      portions.push({
        tense,
        portion,
        personsDone: byPerson.filter(personDone).length,
        personsTotal: persons.length,
        need: byPerson.reduce((sum, list) => sum + personNeed(list), 0),
        ok: inPortion.reduce((sum, c) => sum + (c.stat?.ok ?? 0), 0),
        started: inPortion.some((c) => c.stat),
      })
    }
  }

  // Очередь изучения: начатое доводим до конца, каждый раз по тому же правилу среди оставшихся.
  const queue: PortionProgress[] = []
  let left = portions.filter((p) => p.personsDone < p.personsTotal)
  while (left.length > 0) {
    const p = pickCurrent(left)!
    queue.push(p)
    left = left.filter((x) => x !== p)
  }

  return portions.map((p) => {
    const { tense, portion, personsDone, personsTotal, need, started } = p
    const at = queue.indexOf(p)
    const rank = at === -1 ? null : at
    let state: PortionState
    if (rank === null) state = 'mastered'
    else if (rank === 0) state = 'current'
    else if (rank === 1) state = 'next'
    else state = started ? 'open' : 'locked'
    return { tense, portion, state, personsDone, personsTotal, need, rank }
  })
}
