import { describe, expect, it } from 'vitest'
import { IRREGULAR_INFINITIVES, findVerb, isRegularVerb } from '../data/verbs'
import { buildCard, buildSession } from './session'
import type { SessionConfig } from '../types'

const base: SessionConfig = {
  tenses: ['presente'],
  size: 12,
  mode: 'random',
  includeRegular: true,
  includeIrregular: true,
  selectedIrregular: [...IRREGULAR_INFINITIVES],
}

describe('buildSession', () => {
  it('creates requested number of cards', () => {
    const cards = buildSession(base)
    expect(cards).toHaveLength(12)
    for (const c of cards) {
      expect(c.tense).toBe('presente')
      expect(c.answer).toBeTruthy()
      expect(c.verb.infinitive).toBeTruthy()
      expect(c.sentence).toContain('___')
      expect(c.translation).toBeTruthy()
    }
  })

  it('only uses selected tenses', () => {
    const cards = buildSession({
      ...base,
      tenses: ['indefinido', 'imperfecto'],
      size: 30,
    })
    for (const c of cards) {
      expect(['indefinido', 'imperfecto']).toContain(c.tense)
    }
  })

  it('filters to regular verbs only', () => {
    const cards = buildSession({
      ...base,
      includeRegular: true,
      includeIrregular: false,
      selectedIrregular: [],
      size: 40,
    })
    for (const c of cards) {
      expect(isRegularVerb(c.verb)).toBe(true)
    }
  })

  it('filters to selected irregular verbs only', () => {
    const cards = buildSession({
      ...base,
      includeRegular: false,
      includeIrregular: true,
      selectedIrregular: ['ser', 'ir'],
      size: 40,
    })
    for (const c of cards) {
      expect(isRegularVerb(c.verb)).toBe(false)
      expect(['ser', 'ir']).toContain(c.verb.infinitive)
    }
  })

  it('throws without tenses', () => {
    expect(() => buildSession({ ...base, tenses: [] })).toThrow()
  })

  it('throws without verb kinds', () => {
    expect(() =>
      buildSession({ ...base, includeRegular: false, includeIrregular: false }),
    ).toThrow()
  })

  it('throws when irregular enabled but none selected', () => {
    expect(() =>
      buildSession({
        ...base,
        includeRegular: false,
        includeIrregular: true,
        selectedIrregular: [],
      }),
    ).toThrow()
  })
})

describe('buildCard', () => {
  it('fills answer via conjugate and attaches a sentence frame', () => {
    const verb = findVerb('hablar')!
    const card = buildCard(verb, 'presente', 'yo')
    expect(card.answer).toBe('hablo')
    expect(card.sentence).toContain('___')
    expect(card.translation).toBeTruthy()
  })
})

describe('smart / weak modes', () => {
  const regularOnly = {
    ...base,
    includeIrregular: false,
    selectedIrregular: [],
    size: 200,
  }

  it('smart mode shows weak forms much more often', () => {
    const stats = {
      'hablar|presente|yo': { ok: 0, bad: 3, streak: 0, last: 0 },
    }
    let sessionsWithWeak = 0
    for (let run = 0; run < 200; run++) {
      const cards = buildSession({ ...regularOnly, mode: 'smart', size: 20 }, stats, {})
      if (cards.some((c) => c.verb.infinitive === 'hablar' && c.person === 'yo')) {
        sessionsWithWeak += 1
      }
    }
    // равномерно: 20 / (28 глаголов × 6 лиц) ≈ 12% сессий; со смарт-весом ≈ 40%
    expect(sessionsWithWeak).toBeGreaterThan(50)
  })

  it('weak mode uses only weak forms', () => {
    const stats = {
      'hablar|presente|yo': { ok: 0, bad: 1, streak: 0, last: 0 },
      'comer|presente|tú': { ok: 1, bad: 2, streak: 1, last: 0 },
      'vivir|presente|él': { ok: 5, bad: 1, streak: 4, last: 0 },
    }
    const cards = buildSession({ ...regularOnly, mode: 'weak', size: 10 }, stats, {})
    for (const c of cards) {
      expect(['hablar|yo', 'comer|tú']).toContain(`${c.verb.infinitive}|${c.person}`)
    }
    // без двух одинаковых подряд
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i]!.verb.infinitive + cards[i]!.person).not.toBe(
        cards[i - 1]!.verb.infinitive + cards[i - 1]!.person,
      )
    }
  })

  it('weak mode caps the session at a few repeats per weak form', () => {
    const stats = { 'hablar|presente|yo': { ok: 0, bad: 1, streak: 0, last: 0 } }
    expect(buildSession({ ...regularOnly, mode: 'weak', size: 20 }, stats, {})).toHaveLength(3)
  })

  it('weak mode throws when nothing is weak', () => {
    expect(() => buildSession({ ...regularOnly, mode: 'weak' }, {}, {})).toThrow()
  })
})
