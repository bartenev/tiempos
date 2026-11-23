import { describe, expect, it } from 'vitest'
import { findVerb } from '../data/verbs'
import type { SessionConfig } from '../types'
import { PERSONS } from '../types'
import type { StatsStore } from './stats'
import { cellsForConfig } from './session'
import {
  DEFAULT_BASE,
  ERROR_SLOWNESS,
  POOL_SIZE,
  PROBE_LIMIT,
  baseline,
  createTempoSession,
  groupLabel,
  groupOf,
  groupTempos,
  sessionTempo,
  slowTableCells,
  isTired,
  slowness,
  tempoState,
} from './tempo'
import type { Timing } from './timing'

const DAY = 24 * 60 * 60 * 1000
const NOW = 100 * DAY

function timing(k: string, at: number, ms: number, extra: Partial<Timing> = {}): Timing {
  return { k, at, ms, total: ms + 500, ok: true, oral: false, len: 40, ...extra }
}

const config: SessionConfig = {
  tenses: ['presente'],
  persons: [...PERSONS],
  groups: ['ar'],
  size: 10,
  mode: 'smart',
  answer: 'text',
  includeRegular: true,
  includeIrregular: false,
  selectedIrregular: [],
}

const seen = (last: number) => ({ ok: 3, bad: 0, streak: 3, last })

describe('groupOf', () => {
  it('regular forms go by table cell, irregular — by their model', () => {
    expect(groupOf(findVerb('hablar')!, 'presente', 'yo')).toBe('presente|ar|yo')
    expect(groupOf(findVerb('tener')!, 'presente', 'nosotros')).toBe('presente|er|nosotros')
    expect(groupOf(findVerb('tener')!, 'presente', 'yo').split('|')).toHaveLength(2)
  })
})

describe('baseline and slowness', () => {
  it('falls back to a default until there are enough answers', () => {
    expect(baseline([timing('hablar|presente|yo', 1, 900)], false)).toBe(DEFAULT_BASE.text)
  })

  it('is your fast answer: the 25th percentile, per answer mode', () => {
    const text = Array.from({ length: 40 }, (_, i) => timing('hablar|presente|yo', i, 1000 + i * 100))
    const oral = Array.from({ length: 40 }, (_, i) => timing('hablar|presente|yo', i, 500, { oral: true }))
    expect(baseline([...text, ...oral], false)).toBe(2000)
    expect(baseline([...text, ...oral], true)).toBe(500)
  })

  it('a long sentence takes longer to read — the time is corrected for it', () => {
    const base = { text: 2000, oral: 1000 }
    expect(slowness(timing('k', 0, 4000), base)).toBeCloseTo(1)
    expect(slowness(timing('k', 0, 4000, { len: 80 }), base)).toBeLessThan(1)
  })

  it('a mistake counts as very slow; a pause away is capped', () => {
    const base = { text: 2000, oral: 1000 }
    expect(slowness(timing('k', 0, 500, { ok: false }), base)).toBe(ERROR_SLOWNESS)
    expect(slowness(timing('k', 0, 60_000), base)).toBe(2.5)
  })
})

describe('groupTempos', () => {
  const key = 'hablar|presente|yo'

  it('a group turns hot when slow and cools down once fast again', () => {
    const slow = [timing(key, 1, 9000), timing(key, 2, 9000)]
    expect(groupTempos(slow, NOW).get('presente|ar|yo')!.hot).toBe(true)
    const fast = [...slow, ...[3, 4, 5, 6].map((at) => timing(key, at, 2500))]
    expect(groupTempos(fast, NOW).get('presente|ar|yo')!.hot).toBe(false)
  })

  it('after a pause the first answer outweighs the old pace', () => {
    const old = Array.from({ length: 10 }, (_, i) => timing(key, i, 2500))
    const back = [...old, timing(key, 10 * DAY, 9000)]
    expect(groupTempos(back, NOW).get('presente|ar|yo')!.hot).toBe(true)
  })

  it('repeats right after a mistake do not count', () => {
    const list = [timing(key, 1, 9000, { retry: true })]
    expect(groupTempos(list, NOW).size).toBe(0)
  })
})

describe('tempoState', () => {
  it('known forms without times are probed, long-unseen ones are cold', () => {
    const stats: StatsStore = {
      'hablar|presente|yo': seen(NOW - 1000),
      'hablar|presente|tú': seen(NOW - 10 * DAY),
    }
    const state = tempoState({ cells: cellsForConfig(config, stats), timings: [], sessionStart: NOW, now: NOW })
    expect(state.pool).toEqual([
      { key: 'presente|ar|tú', reason: 'cold' },
      { key: 'presente|ar|yo', reason: 'probe' },
    ])
  })

  it('slow last time comes first; recently measured fast groups stay out', () => {
    const stats: StatsStore = {
      'hablar|presente|yo': seen(NOW - 1000),
      'hablar|presente|tú': seen(NOW - 1000),
    }
    const timings = [timing('hablar|presente|yo', NOW - 1000, 2000), timing('hablar|presente|tú', NOW - 900, 12000)]
    const state = tempoState({ cells: cellsForConfig(config, stats), timings, sessionStart: NOW, now: NOW })
    expect(state.pool).toEqual([{ key: 'presente|ar|tú', reason: 'slow' }])
    expect(state.slow).toBe(1)
  })

  it(`warms up at most ${POOL_SIZE} groups at once and probes at most ${PROBE_LIMIT} per session`, () => {
    const stats: StatsStore = Object.fromEntries(
      ['hablar', 'cantar', 'trabajar'].flatMap((v) => PERSONS.map((p) => [`${v}|presente|${p}`, seen(NOW - 10 * DAY)])),
    )
    const cells = cellsForConfig({ ...config, tenses: ['presente', 'imperfecto'] }, stats)
    const state = tempoState({ cells, timings: [], sessionStart: NOW, now: NOW })
    expect(state.pool).toHaveLength(POOL_SIZE)
    expect(state.cold).toBe(6)
    // пять групп уже проверены быстрыми в этой сессии — их больше не трогаем
    const probed = PERSONS.slice(0, 5).map((p) => timing(`hablar|presente|${p}`, NOW + 1, 1000))
    expect(tempoState({ cells, timings: probed, sessionStart: NOW, now: NOW }).cold).toBe(1)
  })
})

describe('createTempoSession', () => {
  const stats: StatsStore = Object.fromEntries(PERSONS.map((p) => [`hablar|presente|${p}`, seen(NOW - 1000)]))
  const measured = PERSONS.map((p, i) => timing(`hablar|presente|${p}`, NOW - 1000 + i, p === 'tú' ? 12000 : 2000))

  function session(random: number, timings = measured) {
    return createTempoSession(config, NOW, {
      stats: () => stats,
      runs: () => ({}),
      timings: () => timings,
      now: () => NOW,
      random: () => random,
    })
  }

  it('warms up the slow group, each time with another verb', () => {
    const t = session(0)
    const first = t.next([], [])
    expect(first).toMatchObject({ tense: 'presente', person: 'tú', reason: 'slow' })
    const second = t.next([first], [])
    expect(second.person).toBe('tú')
    expect(second.verb.infinitive).not.toBe(first.verb.infinitive)
  })

  it('no new forms while something is slow', () => {
    const t = session(0.99)
    for (let i = 0; i < 20; i++) {
      const card = t.next([], [])
      expect(stats[`${card.verb.infinitive}|presente|${card.person}`] ?? card.reason === 'slow').toBeTruthy()
    }
  })

  it('once warm, new forms come back', () => {
    const fast = PERSONS.map((p, i) => timing(`hablar|presente|${p}`, NOW - 1000 + i, 2000))
    const t = session(0.99, fast)
    expect(t.state().pool).toEqual([])
    const cards = Array.from({ length: 20 }, () => t.next([], []))
    expect(cards.some((c) => c.reason === 'new')).toBe(true)
  })
})

describe('isTired', () => {
  it('everything slowed down at once after a good stretch', () => {
    const steady = Array.from({ length: 30 }, (_, i) => timing('hablar|presente|yo', NOW + i, 2000))
    expect(isTired(steady, NOW)).toBe(false)
    const tired = [...steady, ...Array.from({ length: 10 }, (_, i) => timing('cantar|presente|tú', NOW + 100 + i, 5000))]
    expect(isTired(tired, NOW)).toBe(true)
  })
})

describe('темп в «Таблицах» и в итоге', () => {
  it('slow table cells by runKey; irregular models are not table cells', () => {
    const slow = [
      timing('hablar|presente|tú', 1, 12000),
      timing('cantar|presente|tú', 2, 12000),
      timing('tener|presente|yo', 3, 12000),
    ]
    expect([...slowTableCells(slow)]).toEqual(['ar|presente|tú'])
  })

  it('labels groups for people', () => {
    expect(groupLabel('presente|ar|yo')).toBe('Presente · -ar · yo')
    expect(groupLabel('imperativo|er|él')).toBe('Imperativo · -er · usted')
    expect(groupLabel('presente|e>ie')).toBe('Presente · e → ie')
  })

  it('before → after per group in the session, the most sped-up first', () => {
    const timings = [
      timing('hablar|presente|yo', NOW - 10, 9000), // до сессии
      timing('hablar|presente|yo', NOW + 1, 6000),
      timing('cantar|presente|yo', NOW + 2, 5000, { retry: true }),
      timing('bailar|presente|yo', NOW + 3, 2000),
      timing('hablar|presente|tú', NOW + 4, 3000),
      timing('cantar|presente|tú', NOW + 5, 2900),
      timing('hablar|presente|él', NOW + 6, 4000, { ok: false }),
      timing('cantar|presente|él', NOW + 7, 4000),
    ]
    expect(sessionTempo(timings, NOW)).toEqual([
      { key: 'presente|ar|yo', label: 'Presente · -ar · yo', before: 6000, after: 2000 },
      { key: 'presente|ar|tú', label: 'Presente · -ar · tú', before: 3000, after: 2900 },
    ])
  })
})
