import { describe, expect, it } from 'vitest'
import { VERBS, findVerb } from '../data/verbs'
import { TENSES, personsFor } from '../types'
import { conjugate, hasTense } from './conjugate'
import type { FormHint } from './explain'
import { explainForm } from './explain'

/** Клетка текущего лица в таблице подсказки. */
function current(hint: FormHint) {
  return hint.row.find((r) => r.current)!
}

describe('explainForm', () => {
  it('regular: stem + ending, full forms with highlighted endings', () => {
    const hint = explainForm(findVerb('hablar')!, 'indefinido', 'tú')
    expect(current(hint)).toMatchObject({ stem: 'habl', ending: 'aste', person: 'tú' })
    expect(hint.row.map((r) => r.stem + r.ending)).toEqual([
      'hablé', 'hablaste', 'habló', 'hablamos', 'hablasteis', 'hablaron',
    ])
    expect(hint.row.map((r) => r.ending)).toEqual(['é', 'aste', 'ó', 'amos', 'asteis', 'aron'])
    expect(hint.row.find((r) => r.current)?.person).toBe('tú')
  })

  it('orthographic yo indefinido -car', () => {
    const hint = explainForm(findVerb('buscar')!, 'indefinido', 'yo')
    expect(current(hint)).toMatchObject({ stem: 'busqu', ending: 'é' })
    expect(hint.note).toMatch(/qu/)
  })

  it('stem change only in boot persons', () => {
    expect(current(explainForm(findVerb('pensar')!, 'presente', 'yo')).stem).toBe('piens')
    expect(current(explainForm(findVerb('pensar')!, 'presente', 'nosotros')).stem).toBe('pens')
  })

  it('irregular indefinido stem', () => {
    const hint = explainForm(findVerb('tener')!, 'indefinido', 'ellos')
    expect(current(hint)).toMatchObject({ stem: 'tuv', ending: 'ieron' })
  })

  it('full irregular paradigm is listed as forms', () => {
    const hint = explainForm(findVerb('ser')!, 'presente', 'tú')
    expect(current(hint)).toMatchObject({ stem: 'eres', ending: '' })
    expect(hint.row.map((r) => r.stem)).toContain('eres')
    // полностью неправильные формы — без выделенного окончания
    expect(hint.row.every((r) => r.ending === '')).toBe(true)
  })

  it('imperativo tú: presente él form', () => {
    const hint = explainForm(findVerb('pensar')!, 'imperativo', 'tú')
    expect(current(hint)).toMatchObject({ stem: 'piens', ending: 'a' })
    expect(hint.row.map((r) => r.label)).toEqual(['tú', 'usted', 'nosotros', 'vosotros', 'ustedes'])
  })

  it('imperativo usted: subjunctive with orthographic note', () => {
    const hint = explainForm(findVerb('buscar')!, 'imperativo', 'él')
    expect(current(hint)).toMatchObject({ stem: 'busqu', ending: 'e' })
    expect(hint.note).toMatch(/qu/)
  })

  it('imperativo short tú forms are listed as irregular', () => {
    const hint = explainForm(findVerb('tener')!, 'imperativo', 'tú')
    expect(current(hint)).toMatchObject({ stem: 'ten', ending: '' })
    expect(hint.rule).toMatch(/ten/)
    expect(hint.note).toMatch(/haz/)
  })

  it('irregular yo stays whole, the rest of the row follows the rule', () => {
    const row = explainForm(findVerb('tener')!, 'presente', 'tú').row
    expect(row[0]).toMatchObject({ stem: 'tengo', ending: '' })
    expect(row[1]).toMatchObject({ stem: 'tien', ending: 'es' })
  })

  it('imperativo: short tú form whole, subjunctive forms highlighted', () => {
    const row = explainForm(findVerb('tener')!, 'imperativo', 'él').row
    expect(row[0]).toMatchObject({ label: 'tú', stem: 'ten', ending: '' })
    expect(row[1]).toMatchObject({ label: 'usted', stem: 'teng', ending: 'a' })
  })

  it('every row item rebuilds the real form', () => {
    for (const verb of VERBS) {
      for (const tense of TENSES) {
        if (!hasTense(verb, tense)) continue
        const forms = personsFor(tense).map((p) => conjugate(verb, tense, p))
        for (const person of personsFor(tense)) {
          const row = explainForm(verb, tense, person).row
          expect(row.map((r) => r.stem + r.ending), `${verb.infinitive} ${tense}`).toEqual(forms)
        }
      }
    }
  })

  it('exactly one current cell, and it rebuilds the real form', () => {
    for (const verb of VERBS) {
      for (const tense of TENSES) {
        if (!hasTense(verb, tense)) continue
        for (const person of personsFor(tense)) {
          const hint = explainForm(verb, tense, person)
          expect(hint.row.filter((r) => r.current)).toHaveLength(1)
          expect(current(hint).stem + current(hint).ending, `${verb.infinitive} ${tense} ${person}`).toBe(
            conjugate(verb, tense, person),
          )
        }
      }
    }
  })
})
