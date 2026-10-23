import { describe, expect, it } from 'vitest'
import { VERBS, findVerb } from '../data/verbs'
import { PERSONS, TENSES } from '../types'
import { conjugate } from './conjugate'
import { explainForm } from './explain'

describe('explainForm', () => {
  it('regular: stem + ending with the full ending row', () => {
    const hint = explainForm(findVerb('hablar')!, 'indefinido', 'tú')
    expect(hint.stem).toBe('habl')
    expect(hint.ending).toBe('aste')
    expect(hint.row.map((r) => r.value)).toEqual(['-é', '-aste', '-ó', '-amos', '-asteis', '-aron'])
    expect(hint.row.find((r) => r.current)?.person).toBe('tú')
  })

  it('orthographic yo indefinido -car', () => {
    const hint = explainForm(findVerb('buscar')!, 'indefinido', 'yo')
    expect(hint.stem).toBe('busqu')
    expect(hint.note).toMatch(/qu/)
  })

  it('stem change only in boot persons', () => {
    expect(explainForm(findVerb('pensar')!, 'presente', 'yo').stem).toBe('piens')
    expect(explainForm(findVerb('pensar')!, 'presente', 'nosotros').stem).toBe('pens')
  })

  it('irregular indefinido stem', () => {
    const hint = explainForm(findVerb('tener')!, 'indefinido', 'ellos')
    expect(hint.stem).toBe('tuv')
    expect(hint.ending).toBe('ieron')
  })

  it('full irregular paradigm is listed as forms', () => {
    const hint = explainForm(findVerb('ser')!, 'presente', 'tú')
    expect(hint.stem).toBeUndefined()
    expect(hint.row.map((r) => r.value)).toContain('eres')
  })

  it('stem + ending always rebuilds the real form', () => {
    for (const verb of VERBS) {
      for (const tense of TENSES) {
        for (const person of PERSONS) {
          const hint = explainForm(verb, tense, person)
          if (hint.stem === undefined) continue
          expect(hint.stem + hint.ending, `${verb.infinitive} ${tense} ${person}`).toBe(
            conjugate(verb, tense, person),
          )
        }
      }
    }
  })
})
