import { beforeEach, describe, expect, it } from 'vitest'
import type { BookConfig } from '../types'
import {
  bookWeakCount,
  buildBookSession,
  cardsForUnits,
  chapterCards,
  chapterOf,
  chapterProgress,
  chapterSize,
  legacyBookKeys,
  retryBookCard,
} from './book'
import type { StatsStore } from './stats'

function config(overrides: Partial<BookConfig> = {}): BookConfig {
  return { units: [35, 36], size: 10, mode: 'smart', answer: 'text', ...overrides }
}

function fresh(ok = 1): { ok: number; bad: number; streak: number; last: number } {
  return { ok, bad: 0, streak: ok, last: 1 }
}

const weakStat = { ok: 0, bad: 3, streak: 0, last: 1 }

describe('chapters', () => {
  it('a chapter turns into one pool of exercises', () => {
    const chapter = chapterOf(35)!
    const cards = chapterCards(chapter)
    expect(cards).toHaveLength(chapterSize(chapter))
    expect(cards.every((c) => c.unit === 35)).toBe(true)
  })

  it('capitalizes an answer that opens a sentence', () => {
    const cards = cardsForUnits([34])
    const card = cards.find((c) => c.sentence.startsWith('___ quiero ser abogada'))!
    expect(card.answer).toBe('Yo')
    expect(card.blanks).toEqual([['Yo', '—']])
  })

  it('joins the main answers of a multi-blank exercise', () => {
    const card = cardsForUnits([34]).find((c) => c.sentence.startsWith('—¿De dónde sois Adolfo'))!
    expect(card.answer).toBe('tú; —')
    expect(card.blanks).toEqual([['tú'], ['—']])
  })

  it('a whole phrase is one field with all its variants', () => {
    const card = cardsForUnits([39]).find((c) => c.sentence === '¿me / ayudar / puedes?')!
    expect(card.kind).toBe('rewrite')
    expect(card.blanks).toEqual([['¿Puedes ayudarme?', '¿Me puedes ayudar?']])
  })

  it('leaves the answer alone in the middle of a sentence', () => {
    const card = cardsForUnits([35]).find((c) => c.sentence.startsWith('¿Dónde está Andrés?'))!
    expect(card.answer).toBe('lo')
  })
})

describe('progress keys', () => {
  it('names an exercise by its set and place, not by its text', () => {
    const chapter = chapterOf(18)!
    expect(chapterCards(chapter).map((c) => c.key).slice(0, 2)).toEqual(['18.1.1', '18.1.2'])
    const edited = structuredClone(chapter)
    edited.sets[0]!.items[0]!.es = 'другой текст ___'
    expect(chapterCards(edited)[0]!.key).toBe('18.1.1')
  })

  it('maps the old text keys, with and without a prompt', () => {
    const keys = legacyBookKeys()
    expect(keys['18|ARTURO: ¿Cómo se llaman ___ padres, Blanca?']).toBe('18.1.1')
    const [first] = chapterOf(21)!.sets[0]!.items
    expect(keys[`21|${first!.es}|${first!.prompt}`]).toBe('21.1.1')
    expect(new Set(Object.values(keys)).size).toBe(Object.keys(keys).length)
  })
})

describe('buildBookSession', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('takes cards only from the chosen chapters, with no repeats', () => {
    const cards = buildBookSession(config({ mode: 'random', size: 15 }), {})
    expect(cards).toHaveLength(15)
    expect(cards.every((c) => c.unit === 35 || c.unit === 36)).toBe(true)
    expect(new Set(cards.map((c) => c.key)).size).toBe(15)
  })

  it('a single chapter is a session of its own', () => {
    const cards = buildBookSession(config({ units: [41], size: 30, mode: 'smart' }), {})
    expect(cards.every((c) => c.unit === 41)).toBe(true)
    expect(cards.length).toBe(Math.min(30, chapterSize(chapterOf(41)!)))
  })

  it('fails without chapters', () => {
    expect(() => buildBookSession(config({ units: [] }), {})).toThrow()
  })

  it('weak mode shows only weak exercises and fails without them', () => {
    const [first] = cardsForUnits([35])
    const stats: StatsStore = { [first!.key]: weakStat }
    const cards = buildBookSession(config({ mode: 'weak' }), stats)
    expect(cards.map((c) => c.key)).toEqual([first!.key])
    expect(() => buildBookSession(config({ mode: 'weak' }), {})).toThrow()
  })

  it('smart mode brings new material in book order', () => {
    const cards = buildBookSession(config({ size: 6 }), {})
    expect(cards.every((c) => c.unit === 35)).toBe(true)
  })

  it('smart mode guarantees a share of the session to weak exercises', () => {
    const weak = cardsForUnits([36]).slice(0, 8)
    const stats: StatsStore = Object.fromEntries(weak.map((c) => [c.key, weakStat]))
    const cards = buildBookSession(config({ size: 9 }), stats)
    const keys = new Set(weak.map((c) => c.key))
    expect(cards.filter((c) => keys.has(c.key))).toHaveLength(3)
  })

  it('smart mode fills the session when there is nothing new left', () => {
    const all = cardsForUnits([35, 36])
    const stats: StatsStore = Object.fromEntries(all.map((c) => [c.key, fresh()]))
    expect(buildBookSession(config({ size: 10 }), stats)).toHaveLength(10)
  })
})

describe('progress', () => {
  it('counts each chapter by mastery', () => {
    const chapter = chapterOf(34)!
    const [a, b] = chapterCards(chapter)
    const stats: StatsStore = { [a!.key]: weakStat, [b!.key]: fresh(5) }
    const counts = chapterProgress(chapter, stats)
    expect(counts.weak).toBe(1)
    expect(counts.solid).toBe(1)
    expect(counts.new).toBe(chapterSize(chapter) - 2)
    expect(bookWeakCount([34], stats)).toBe(1)
    expect(bookWeakCount([35], stats)).toBe(0)
  })

  it('a retry keeps the exercise and marks the card', () => {
    const [card] = cardsForUnits([38])
    const retry = retryBookCard(card!)
    expect(retry.key).toBe(card!.key)
    expect(retry.retry).toBe(true)
    expect([...retry.options!].sort()).toEqual([...card!.options!].sort())
  })
})
