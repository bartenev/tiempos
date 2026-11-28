import { describe, expect, it } from 'vitest'
import type { SessionConfig } from '../types'
import { PERSONS } from '../types'
import { THIN_FORMS, poolOverview, portionLabel } from './poolOverview'
import { cellsForConfig } from './session'
import type { StatsStore } from './stats'
import { cellKey } from './stats'
import type { Timing } from './timing'

const HOUR = 60 * 60 * 1000
const NOW = 100 * 24 * HOUR

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

function timing(k: string, ms: number): Timing {
  return { k, at: NOW - HOUR, ms, total: ms + 500, ok: true, oral: false, len: 40 }
}

/** Всё в фильтре отвечено много раз, быстро и недавно. */
function mastered() {
  const stats: StatsStore = {}
  const timings: Timing[] = []
  for (const c of cellsForConfig(config, {})) {
    const k = cellKey(c.verb.infinitive, c.tense, c.person)
    stats[k] = { ok: 5, bad: 0, streak: 5, last: NOW - HOUR }
    timings.push(timing(k, 1000))
  }
  return { stats, timings }
}

describe('portionLabel', () => {
  it('names endings and irregular models', () => {
    expect(portionLabel('presente', 'ar')).toBe('Presente · -ar')
    expect(portionLabel('presente', 'e>ie')).toBe('Presente · e → ie')
  })
})

describe('poolOverview', () => {
  it('fresh filter: the first portion is new, nothing to warn about', () => {
    const p = poolOverview(config, { stats: {}, runs: {}, timings: [], now: NOW })
    expect(p.forms).toBeGreaterThan(THIN_FORMS)
    expect(p.current?.label).toBe('Presente · -ar')
    expect(p.current?.need).toBeGreaterThan(0)
    expect(p).toMatchObject({ tables: 0, weak: 0, slow: 0, cold: 0, hints: [] })
  })

  it('everything mastered and fresh: only review is left', () => {
    const { stats, timings } = mastered()
    const p = poolOverview(config, { stats, runs: {}, timings, now: NOW })
    expect(p.current).toBeNull()
    expect(p.portionsLeft).toBe(0)
    expect(p.hints).toEqual(['nothing'])
  })

  it('no new portions but a table cell to finish: no-new, not nothing', () => {
    const { stats, timings } = mastered()
    const p = poolOverview(config, { stats, runs: { 'ar|presente|yo': 2 }, timings, now: NOW })
    expect(p.tables).toBe(1)
    expect(p.hints).toEqual(['no-new'])
  })

  it('a fresh mistake reopens its portion — it is not «nothing new»', () => {
    const { stats, timings } = mastered()
    stats[cellKey('hablar', 'presente', 'yo')] = { ok: 5, bad: 2, streak: 0, last: NOW - HOUR }
    const p = poolOverview(config, { stats, runs: {}, timings, now: NOW })
    expect(p.weak).toBe(1)
    expect(p.current).not.toBeNull()
    expect(p.hints).toEqual([])
  })

  it('counts unfinished table cells', () => {
    const p = poolOverview(config, { stats: {}, runs: { 'ar|presente|yo': 1 }, timings: [], now: NOW })
    expect(p.tables).toBe(1)
    expect(p.tablesNeed).toBeGreaterThan(0)
  })

  it('a tiny filter is thin', () => {
    const tiny: SessionConfig = {
      ...config,
      persons: ['yo'],
      groups: ['ar', 'er', 'ir'],
      includeRegular: false,
      includeIrregular: true,
      selectedIrregular: ['ser'],
    }
    const p = poolOverview(tiny, { stats: {}, runs: {}, timings: [], now: NOW })
    expect(p.forms).toBe(1)
    expect(p.hints).toContain('thin')
  })

  it('slow groups hold new back — from two on; one does not', () => {
    const yo = cellKey('hablar', 'presente', 'yo')
    const tu = cellKey('hablar', 'presente', 'tú')
    const stat = { ok: 1, bad: 0, streak: 1, last: NOW - HOUR }
    const one = poolOverview(config, {
      stats: { [yo]: stat },
      runs: {},
      timings: [timing(yo, 9000), timing(yo, 9000)],
      now: NOW,
    })
    expect(one.slow).toBe(1)
    expect(one.hints).not.toContain('new-waits')
    const two = poolOverview(config, {
      stats: { [yo]: stat, [tu]: stat },
      runs: {},
      timings: [timing(yo, 9000), timing(yo, 9000), timing(tu, 9000), timing(tu, 9000)],
      now: NOW,
    })
    expect(two.slow).toBe(2)
    expect(two.hints).toContain('new-waits')
  })
})
