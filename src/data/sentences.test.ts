import { describe, expect, it } from 'vitest'
import { PERSONS, TENSES } from '../types'
import { VERB_COMPLEMENTS, buildVerbSentence } from './sentences'
import { VERBS } from './verbs'

describe('verb sentences', () => {
  it('every verb in the bank has its own complements', () => {
    for (const verb of VERBS) {
      expect(VERB_COMPLEMENTS[verb.infinitive]?.length, verb.infinitive).toBeGreaterThan(0)
    }
  })

  it('builds a sentence with one gap and a translation', () => {
    for (const verb of VERBS) {
      for (const tense of TENSES) {
        for (const person of PERSONS) {
          const built = buildVerbSentence(verb.infinitive, tense, person)!
          expect(built.sentence.split('___').length - 1).toBe(1)
          expect(built.translation).toContain('…')
        }
      }
    }
  })

  it('uses the plural variant for plural persons', () => {
    const pick = <T,>(items: T[]) => items[items.length - 1]!
    expect(buildVerbSentence('parecer', 'presente', 'ellos', pick)!.sentence).toMatch(/contentos\.$/)
    expect(buildVerbSentence('parecer', 'presente', 'yo', pick)!.sentence).toMatch(/contento\.$/)
  })

  it('composes marker + subject + gap + complement', () => {
    expect(buildVerbSentence('comer', 'indefinido', 'yo')).toEqual({
      sentence: 'Ayer yo ___ una pizza.',
      translation: 'Вчера я … пиццу.',
    })
  })
})
