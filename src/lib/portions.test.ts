import { describe, expect, it } from 'vitest'
import { IRREGULAR_INFINITIVES } from '../data/verbs'
import type { SessionConfig } from '../types'
import { PERSONS, VERB_GROUPS } from '../types'
import { portionStatuses } from './portions'
import { buildSession, cellsForConfig } from './session'
import type { CellStat, StatsStore } from './stats'

/** Учу новое время: indefinido, все лица и окончания, только правильные. */
const learning: SessionConfig = {
  tenses: ['indefinido'],
  persons: [...PERSONS],
  groups: [...VERB_GROUPS],
  size: 200,
  mode: 'smart',
  answer: 'text',
  includeRegular: true,
  includeIrregular: false,
  selectedIrregular: [],
}

function ok(n: number): CellStat {
  return { ok: n, bad: 0, streak: n, last: 0 }
}

/** Все лица порции «indefinido -ar» освоены на hablar. */
const arMastered: StatsStore = Object.fromEntries(
  PERSONS.map((p) => [`hablar|indefinido|${p}`, ok(2)]),
)

describe('portionStatuses', () => {
  it('from scratch: -ar is current, -er and -ir wait', () => {
    const statuses = portionStatuses(cellsForConfig(learning, {}))
    expect(statuses.map((s) => `${s.group}:${s.state}`)).toEqual([
      'ar:current',
      'er:locked',
      'ir:locked',
    ])
    expect(statuses[0]).toMatchObject({ personsDone: 0, personsTotal: 6 })
  })

  it('a person is done after 2 correct answers across verbs of the group', () => {
    const stats = { 'hablar|indefinido|yo': ok(1), 'cantar|indefinido|yo': ok(1) }
    expect(portionStatuses(cellsForConfig(learning, stats))[0]!.personsDone).toBe(1)
  })

  it('mastering -ar opens -er', () => {
    const statuses = portionStatuses(cellsForConfig(learning, arMastered))
    expect(statuses.map((s) => s.state)).toEqual(['mastered', 'current', 'locked'])
  })

  it('a weak form keeps its portion current', () => {
    const stats = { ...arMastered, 'cantar|indefinido|tú': { ok: 0, bad: 1, streak: 0, last: 0 } }
    const statuses = portionStatuses(cellsForConfig(learning, stats))
    expect(statuses[0]).toMatchObject({ state: 'current', personsDone: 5 })
  })

  it('portions you already practised stay open', () => {
    const stats = { 'vivir|indefinido|yo': ok(1) }
    const statuses = portionStatuses(cellsForConfig(learning, stats))
    expect(statuses.map((s) => s.state)).toEqual(['current', 'locked', 'open'])
  })
})

describe('smart mode with portions', () => {
  it('first session of a new tense: only -ar forms, all persons mixed', () => {
    const cards = buildSession(learning, {})
    expect(new Set(cards.map((c) => c.verb.group))).toEqual(new Set(['ar']))
    expect(new Set(cards.map((c) => c.person)).size).toBe(6)
  })

  it('after -ar: ~60% -er (new), the rest -ar (review), -ir still waits', () => {
    const groups: string[] = []
    for (let run = 0; run < 100; run++) {
      groups.push(...buildSession({ ...learning, size: 20 }, arMastered).map((c) => c.verb.group))
    }
    const share = (g: string) => groups.filter((x) => x === g).length / groups.length
    expect(share('ir')).toBe(0)
    expect(share('er')).toBeGreaterThan(0.5)
    expect(share('er')).toBeLessThan(0.7)
    expect(share('ar')).toBeGreaterThan(0.3)
  })

  it('when every portion is mastered, nothing is locked or boosted', () => {
    const all: StatsStore = Object.fromEntries(
      ['hablar', 'comer', 'vivir'].flatMap((v) => PERSONS.map((p) => [`${v}|indefinido|${p}`, ok(2)])),
    )
    const statuses = portionStatuses(cellsForConfig(learning, all))
    expect(statuses.every((s) => s.state === 'mastered')).toBe(true)
    const cards = buildSession(learning, all)
    expect(new Set(cards.map((c) => c.verb.group)).size).toBe(3)
  })

  it('irregular verbs belong to the portion of their group', () => {
    const cards = buildSession(
      { ...learning, includeIrregular: true, selectedIrregular: [...IRREGULAR_INFINITIVES] },
      {},
    )
    expect(cards.every((c) => c.verb.group === 'ar')).toBe(true)
    expect(cards.some((c) => c.verb.infinitive === 'estar' || c.verb.infinitive === 'dar')).toBe(true)
  })

  it('weak and random modes ignore portions', () => {
    const random = buildSession({ ...learning, mode: 'random' }, {})
    expect(new Set(random.map((c) => c.verb.group)).size).toBe(3)
  })
})
