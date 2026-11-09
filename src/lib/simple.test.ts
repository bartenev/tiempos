import { describe, expect, it } from 'vitest'
import { VERBS, findVerb } from '../data/verbs'
import { VERB_RU } from '../data/verbRu'
import { buildCard } from './session'
import { simplePrompt } from './simple'

describe('simplePrompt', () => {
  it('shows only the pronoun and a blank, with the infinitive translated', () => {
    expect(simplePrompt(buildCard(findVerb('hablar')!, 'perfecto', 'nosotros'))).toEqual({
      sentence: 'nosotros ___',
      translation: 'говорить, разговаривать',
    })
  })

  it('imperativo: usted / ustedes in brackets, like the full sentence', () => {
    expect(simplePrompt(buildCard(findVerb('comer')!, 'imperativo', 'él')).sentence).toBe('(usted) ¡___!')
  })

  it('every verb in the bank has a translation, and nothing extra', () => {
    expect(Object.keys(VERB_RU).sort()).toEqual(VERBS.map((v) => v.infinitive).sort())
    expect(Object.values(VERB_RU).every((ru) => ru.trim().length > 0)).toBe(true)
  })
})
