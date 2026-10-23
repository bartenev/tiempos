import { describe, expect, it } from 'vitest'
import { IRREGULAR_INFINITIVES, findVerb, isRegularVerb } from '../data/verbs'
import { buildCard, buildSession } from './session'
import type { SessionConfig } from '../types'

const base: SessionConfig = {
  tenses: ['presente'],
  size: 12,
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
