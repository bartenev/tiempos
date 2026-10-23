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

describe('special sentences', () => {
  it('haber indefinido uses pretérito anterior after apenas / en cuanto', () => {
    const built = buildVerbSentence('haber', 'indefinido', 'yo')!
    expect(built.sentence).toBe('Apenas yo ___ terminado, empezó a llover.')
    expect(built.translation).toContain('Едва я …')
  })

  it('haber in other tenses keeps the regular pattern', () => {
    expect(buildVerbSentence('haber', 'presente', 'yo')!.sentence).toBe(
      'Hoy yo ___ terminado el trabajo.',
    )
  })
})

describe('tense-limited complements', () => {
  it('vivir never says «Ayer viví en Madrid»', () => {
    const all = <T,>(items: T[]) => items[items.length - 1]!
    expect(buildVerbSentence('vivir', 'indefinido', 'yo')!.sentence).toMatch(/una gran aventura\.$/)
    expect(buildVerbSentence('vivir', 'indefinido', 'yo', all)!.sentence).toMatch(/una gran aventura\.$/)
    expect(buildVerbSentence('vivir', 'presente', 'yo')!.sentence).toMatch(/en Madrid\.$/)
  })
})
