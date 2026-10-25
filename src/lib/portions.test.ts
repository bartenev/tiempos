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
  it('from scratch: -ar is current, -er is next, -ir waits', () => {
    const statuses = portionStatuses(cellsForConfig(learning, {}))
    expect(statuses.map((s) => `${s.portion}:${s.state}`)).toEqual([
      'ar:current',
      'er:next',
      'ir:locked',
    ])
    expect(statuses[0]).toMatchObject({ personsDone: 0, personsTotal: 6, need: 12 })
  })

  it('a person is done after 2 correct answers across verbs of the group', () => {
    const stats = { 'hablar|indefinido|yo': ok(1), 'cantar|indefinido|yo': ok(1) }
    expect(portionStatuses(cellsForConfig(learning, stats))[0]!.personsDone).toBe(1)
  })

  it('mastering -ar opens -er', () => {
    const statuses = portionStatuses(cellsForConfig(learning, arMastered))
    expect(statuses.map((s) => s.state)).toEqual(['mastered', 'current', 'next'])
  })

  it('a weak form keeps its portion current', () => {
    const stats = { ...arMastered, 'cantar|indefinido|tú': { ok: 0, bad: 1, streak: 0, last: 0 } }
    const statuses = portionStatuses(cellsForConfig(learning, stats))
    expect(statuses[0]).toMatchObject({ state: 'current', personsDone: 5 })
  })

  it('need counts missing correct answers and weak forms to recover', () => {
    const stats = {
      'hablar|indefinido|yo': ok(2), // лицо готово
      'hablar|indefinido|tú': ok(1), // ещё 1
      'cantar|indefinido|él': { ok: 3, bad: 1, streak: 0, last: 0 }, // слабая: вытащить 2 подряд
    }
    const ar = portionStatuses(cellsForConfig(learning, stats))[0]!
    // yo 0 + tú 1 + él 2 + nosotros, vosotros, ellos по 2
    expect(ar).toMatchObject({ personsDone: 1, need: 9 })
  })

  it('rank orders the study queue: started first, then untouched in order', () => {
    const stats = { 'vivir|indefinido|yo': ok(1) }
    const statuses = portionStatuses(cellsForConfig(learning, stats))
    expect(statuses.map((s) => `${s.portion}:${s.rank}`)).toEqual(['ar:1', 'er:2', 'ir:0'])
    expect(portionStatuses(cellsForConfig(learning, arMastered))[0]!.rank).toBeNull()
  })

  it('a started portion becomes current before untouched ones', () => {
    const stats = { 'vivir|indefinido|yo': ok(1) }
    const statuses = portionStatuses(cellsForConfig(learning, stats))
    expect(statuses.map((s) => s.state)).toEqual(['next', 'locked', 'current'])
  })

  it('of started portions, the one with more persons done is current, the other is next', () => {
    const stats = {
      'hablar|indefinido|yo': ok(5),
      'vivir|indefinido|yo': ok(2),
      'vivir|indefinido|tú': ok(2),
    }
    const statuses = portionStatuses(cellsForConfig(learning, stats))
    expect(statuses.map((s) => s.state)).toEqual(['next', 'locked', 'current'])
  })

  it('equal persons done: more correct answers wins', () => {
    const stats = { 'hablar|indefinido|yo': ok(1), 'comer|indefinido|yo': ok(1), 'comer|indefinido|tú': ok(1) }
    const statuses = portionStatuses(cellsForConfig(learning, stats))
    expect(statuses.map((s) => s.state)).toEqual(['next', 'current', 'locked'])
  })

  it('a full tie goes to the first portion in order', () => {
    const stats = { 'comer|indefinido|yo': ok(1), 'vivir|indefinido|yo': ok(1) }
    const statuses = portionStatuses(cellsForConfig(learning, stats))
    expect(statuses.map((s) => s.state)).toEqual(['locked', 'current', 'next'])
  })

  it('progress is a share of persons: imperativo has no yo', () => {
    const both: SessionConfig = { ...learning, tenses: ['indefinido', 'imperativo'], groups: ['ar'] }
    // 4 из 6 лиц в indefinido против 4 из 5 в imperativo
    const persons = ['tú', 'él', 'nosotros', 'vosotros'] as const
    const stats = Object.fromEntries(
      persons.flatMap((p) => [
        [`hablar|indefinido|${p}`, ok(2)],
        [`hablar|imperativo|${p}`, ok(2)],
      ]),
    )
    const statuses = portionStatuses(cellsForConfig(both, stats))
    expect(statuses.map((s) => `${s.tense}:${s.state}`)).toEqual([
      'indefinido:next',
      'imperativo:current',
    ])
  })
})

describe('smart mode with portions', () => {
  it('first session of a new tense: only -ar forms, all persons mixed', () => {
    // по нескольким сессиям: в одной на 20 карточек какое-то лицо может случайно не выпасть
    const cards = Array.from({ length: 10 }, () => buildSession({ ...learning, size: 20 }, {})).flat()
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

  it('started -ir out of order: the session focuses on -ir, untouched -ar waits', () => {
    const stats = { 'vivir|indefinido|yo': ok(1) }
    const groups: string[] = []
    for (let run = 0; run < 20; run++) {
      groups.push(...buildSession({ ...learning, size: 20 }, stats).map((c) => c.verb.group))
    }
    expect(new Set(groups)).toEqual(new Set(['ir']))
  })

  it('an open portion gives only its answered forms, as review', () => {
    // -ir продвинутее (текущая), в -ar отвечен только hablar · yo (открыта)
    const stats = {
      'vivir|indefinido|yo': ok(2),
      'vivir|indefinido|tú': ok(2),
      'hablar|indefinido|yo': ok(1),
    }
    const cards = Array.from({ length: 50 }, () => buildSession({ ...learning, size: 20 }, stats)).flat()
    const ar = cards.filter((c) => c.verb.group === 'ar')
    expect(ar.length).toBeGreaterThan(0)
    expect(ar.every((c) => c.verb.infinitive === 'hablar' && c.person === 'yo')).toBe(true)
    expect(cards.some((c) => c.verb.group === 'er')).toBe(false)
  })

  it('a weak form of an open portion still gets into the session', () => {
    const stats = {
      'vivir|indefinido|yo': ok(2),
      'hablar|indefinido|tú': { ok: 0, bad: 1, streak: 0, last: 0 },
    }
    const cards = buildSession({ ...learning, size: 20 }, stats)
    expect(cards.some((c) => c.verb.infinitive === 'hablar' && c.person === 'tú')).toBe(true)
    expect(cards.filter((c) => c.verb.group === 'ar').every((c) => c.verb.infinitive === 'hablar')).toBe(true)
  })

  it('a nearly mastered current portion hands most of its share to the next one', () => {
    // -ar: 5 лиц из 6, до освоения 2 верных; повторять ещё нечего
    const stats = Object.fromEntries(
      (['yo', 'tú', 'él', 'nosotros', 'vosotros'] as const).map((p) => [`hablar|indefinido|${p}`, ok(2)]),
    )
    const groups: string[] = []
    for (let run = 0; run < 100; run++) {
      groups.push(...buildSession({ ...learning, size: 20 }, stats).map((c) => c.verb.group))
    }
    const share = (g: string) => groups.filter((x) => x === g).length / groups.length
    expect(share('er')).toBeGreaterThan(0.6)
    expect(share('ar')).toBeGreaterThan(0.1)
    expect(share('ir')).toBe(0)
  })

  it('the new-material share runs down the queue: room left lets a third portion in', () => {
    // -ar: нужно 2 верных (≈4 карточки), -er с нуля: 12 (≈24) — на 30 карточек остаётся и -ir
    const stats = Object.fromEntries(
      (['yo', 'tú', 'él', 'nosotros', 'vosotros'] as const).map((p) => [`hablar|indefinido|${p}`, ok(2)]),
    )
    const groups: string[] = []
    for (let run = 0; run < 100; run++) {
      groups.push(...buildSession({ ...learning, size: 30 }, stats).map((c) => c.verb.group))
    }
    const share = (g: string) => groups.filter((x) => x === g).length / groups.length
    expect(share('er')).toBeGreaterThan(0.6)
    expect(share('ar')).toBeGreaterThan(0.05)
    expect(share('ir')).toBeGreaterThan(0.02)
    expect(share('ir')).toBeLessThan(0.2)
  })

  it('near done with something to review: review keeps its share', () => {
    // -ar освоена; у -er — 5 лиц из 6; следующая — -ir
    const stats = {
      ...arMastered,
      ...Object.fromEntries(
        (['yo', 'tú', 'él', 'nosotros', 'vosotros'] as const).map((p) => [`comer|indefinido|${p}`, ok(2)]),
      ),
    }
    const groups: string[] = []
    for (let run = 0; run < 100; run++) {
      groups.push(...buildSession({ ...learning, size: 20 }, stats).map((c) => c.verb.group))
    }
    const share = (g: string) => groups.filter((x) => x === g).length / groups.length
    expect(share('ar')).toBeGreaterThan(0.3) // повторение
    expect(share('ar')).toBeLessThan(0.5)
    expect(share('ir')).toBeGreaterThan(0.3) // следующая
    expect(share('er')).toBeGreaterThan(0.05) // текущая — сколько нужно
    expect(share('er')).toBeLessThan(0.3)
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

  it('regular forms of irregular verbs join the ending portion, irregular ones wait', () => {
    const withIrregular = {
      ...learning,
      includeIrregular: true,
      selectedIrregular: [...IRREGULAR_INFINITIVES],
    }
    const cards = Array.from({ length: 20 }, () =>
      buildSession({ ...withIrregular, size: 20 }, {}),
    ).flat()
    expect(cards.every((c) => c.verb.group === 'ar')).toBe(true)
    // pensé, jugué, empecé — правильные формы неправильных -ar
    expect(cards.some((c) => ['pensar', 'jugar', 'empezar', 'encontrar'].includes(c.verb.infinitive))).toBe(true)
    // estuve, di — свои модели, ждут очереди
    expect(cards.some((c) => c.verb.infinitive === 'estar' || c.verb.infinitive === 'dar')).toBe(false)
  })

  it('pattern portions come after the regular endings of their tense', () => {
    const withIrregular = {
      ...learning,
      includeIrregular: true,
      selectedIrregular: [...IRREGULAR_INFINITIVES],
    }
    const statuses = portionStatuses(cellsForConfig(withIrregular, {}))
    expect(statuses.map((s) => s.portion)).toEqual([
      'ar',
      'er',
      'ir',
      'stem-u',
      'stem-i',
      'stem-j',
      'shift-3',
      'y',
      'fui',
      'di-vi',
    ])
  })

  it('an irregular form counts towards its pattern, not its ending', () => {
    const withIrregular = {
      ...learning,
      includeIrregular: true,
      selectedIrregular: [...IRREGULAR_INFINITIVES],
    }
    // tuve, pude — основа на -u-: эта порция продвинулась, -er — нет
    const stats = { 'tener|indefinido|yo': ok(1), 'poder|indefinido|yo': ok(1) }
    const statuses = portionStatuses(cellsForConfig(withIrregular, stats))
    const byPortion = Object.fromEntries(statuses.map((s) => [s.portion, s]))
    expect(byPortion['stem-u']).toMatchObject({ state: 'current', personsDone: 1 })
    expect(byPortion['er']!.state).toBe('locked')
  })

  it('weak and random modes ignore portions', () => {
    const random = buildSession({ ...learning, mode: 'random' }, {})
    expect(new Set(random.map((c) => c.verb.group)).size).toBe(3)
  })
})
