import { describe, expect, it } from 'vitest'
import { IRREGULAR_INFINITIVES, findVerb, isRegularVerb } from '../data/verbs'
import { buildCard, buildSession, cellsForConfig } from './session'
import type { SessionConfig } from '../types'
import { PERSONS, VERB_GROUPS } from '../types'

const base: SessionConfig = {
  tenses: ['presente'],
  persons: [...PERSONS],
  groups: [...VERB_GROUPS],
  size: 12,
  mode: 'random',
  answer: 'text',
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
      const cards = buildSession({ ...regularOnly, mode: 'smart', size: 20 }, stats)
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
    const cards = buildSession({ ...regularOnly, mode: 'weak', size: 10 }, stats)
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
    expect(buildSession({ ...regularOnly, mode: 'weak', size: 20 }, stats)).toHaveLength(3)
  })

  it('weak mode throws when nothing is weak', () => {
    expect(() => buildSession({ ...regularOnly, mode: 'weak' }, {})).toThrow()
  })
})

describe('imperativo in sessions', () => {
  for (const mode of ['random', 'smart'] as const) {
    it(`${mode}: no yo and no verbs without imperative`, () => {
      const cards = buildSession({ ...base, tenses: ['imperativo'], mode, size: 300 }, {})
      for (const c of cards) {
        expect(c.person).not.toBe('yo')
        expect(c.verb.noImperative, c.verb.infinitive).toBeFalsy()
        expect(c.sentence).toContain('___')
      }
    })
  }

  it('throws when only verbs without imperative are selected', () => {
    expect(() =>
      buildSession({
        ...base,
        tenses: ['imperativo'],
        includeRegular: false,
        selectedIrregular: ['haber', 'poder'],
      }),
    ).toThrow()
  })
})

describe('person filter', () => {
  for (const mode of ['random', 'smart'] as const) {
    it(`${mode}: only the chosen persons`, () => {
      const cards = buildSession(
        { ...base, tenses: ['presente', 'imperativo'], persons: ['tú', 'nosotros'], mode, size: 200 },
        {},
      )
      for (const c of cards) expect(['tú', 'nosotros']).toContain(c.person)
    })
  }

  it('imperativo with only yo has no forms', () => {
    const cfg = { ...base, tenses: ['imperativo' as const], persons: ['yo' as const] }
    expect(cellsForConfig(cfg, {})).toHaveLength(0)
    expect(() => buildSession(cfg, {})).toThrow()
    expect(() => buildSession({ ...cfg, mode: 'random' }, {})).toThrow()
  })

  it('random mode skips imperativo when only yo is chosen with other tenses', () => {
    const cards = buildSession(
      { ...base, tenses: ['presente', 'imperativo'], persons: ['yo'], size: 50 },
      {},
    )
    for (const c of cards) {
      expect(c.tense).toBe('presente')
      expect(c.person).toBe('yo')
    }
  })

  it('throws without persons', () => {
    expect(() => buildSession({ ...base, persons: [] }, {})).toThrow()
  })
})

describe('verb group filter (-ar / -er / -ir)', () => {
  for (const mode of ['random', 'smart'] as const) {
    it(`${mode}: only -ar verbs, regular and irregular`, () => {
      const cards = buildSession({ ...base, groups: ['ar'], mode, size: 200 }, {})
      for (const c of cards) expect(c.verb.group).toBe('ar')
      expect(cards.some((c) => !isRegularVerb(c.verb))).toBe(true)
    })
  }

  it('-er + -ir excludes -ar', () => {
    const cells = cellsForConfig({ ...base, groups: ['er', 'ir'] }, {})
    expect(cells.length).toBeGreaterThan(0)
    expect(cells.some((c) => c.verb.group === 'ar')).toBe(false)
  })

  it('no forms when the group and the irregular picks do not overlap', () => {
    const cfg = { ...base, groups: ['ar' as const], includeRegular: false, selectedIrregular: ['ser', 'ir'] }
    expect(cellsForConfig(cfg, {})).toHaveLength(0)
    expect(() => buildSession(cfg, {})).toThrow()
  })

  it('throws without groups', () => {
    expect(() => buildSession({ ...base, groups: [] }, {})).toThrow()
  })
})

describe('smart mode: guaranteed slots for weak forms', () => {
  const wide: SessionConfig = {
    ...base,
    tenses: ['presente', 'indefinido', 'imperfecto', 'imperativo'],
    mode: 'smart',
    size: 20,
  }
  const key = (c: { verb: { infinitive: string }; tense: string; person: string }) =>
    `${c.verb.infinitive}|${c.tense}|${c.person}`

  it('a single weak form is in every session, at most twice, never back to back', () => {
    const stats = { 'decir|imperfecto|nosotros': { ok: 1, bad: 2, streak: 0, last: 0 } }
    for (let run = 0; run < 200; run++) {
      const cards = buildSession(wide, stats)
      const hits = cards.map(key).filter((k) => k === 'decir|imperfecto|nosotros').length
      expect(hits).toBeGreaterThanOrEqual(1)
      expect(hits).toBeLessThanOrEqual(2)
      for (let i = 1; i < cards.length; i++) expect(key(cards[i]!)).not.toBe(key(cards[i - 1]!))
    }
  })

  it('many weak forms take at most a third of the session, the worst first', () => {
    const stats: Record<string, { ok: number; bad: number; streak: number; last: number }> = {}
    const verbs = ['hablar', 'comer', 'vivir', 'cantar', 'beber', 'abrir', 'tomar', 'vender', 'subir', 'mirar']
    verbs.forEach((v, i) => {
      stats[`${v}|presente|yo`] = { ok: 0, bad: i === 0 ? 5 : 1, streak: 0, last: 0 }
    })
    const weakKeys = new Set(Object.keys(stats))
    for (let run = 0; run < 50; run++) {
      const cards = buildSession(wide, stats)
      expect(cards).toHaveLength(20)
      const weakCards = cards.filter((c) => weakKeys.has(key(c)))
      expect(weakCards.length).toBeLessThanOrEqual(6)
      // форма с 5 ошибками — всегда среди гарантированных
      expect(cards.some((c) => key(c) === 'hablar|presente|yo')).toBe(true)
    }
  })

  it('no weak forms — the session is as before', () => {
    const cards = buildSession(wide, {})
    expect(cards).toHaveLength(20)
  })

  it('only weak forms in the filter — behaves like the weak mode', () => {
    const narrow: SessionConfig = {
      ...base,
      mode: 'smart',
      includeIrregular: true,
      includeRegular: false,
      selectedIrregular: ['ser'],
      persons: ['yo'],
    }
    const cards = buildSession(narrow, { 'ser|presente|yo': { ok: 0, bad: 1, streak: 0, last: 0 } })
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.every((c) => key(c) === 'ser|presente|yo')).toBe(true)
  })
})
