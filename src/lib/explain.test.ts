import { describe, expect, it } from 'vitest'
import { VERBS, findVerb } from '../data/verbs'
import { TENSES, personsFor } from '../types'
import { conjugate, hasTense } from './conjugate'
import { explainForm } from './explain'

describe('explainForm', () => {
  it('regular: stem + ending, full forms with highlighted endings', () => {
    const hint = explainForm(findVerb('hablar')!, 'indefinido', 'tú')
    expect(hint.stem).toBe('habl')
    expect(hint.ending).toBe('aste')
    expect(hint.row.map((r) => r.stem + r.ending)).toEqual([
      'hablé', 'hablaste', 'habló', 'hablamos', 'hablasteis', 'hablaron',
    ])
    expect(hint.row.map((r) => r.ending)).toEqual(['é', 'aste', 'ó', 'amos', 'asteis', 'aron'])
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
    expect(hint.row.map((r) => r.stem)).toContain('eres')
    // полностью неправильные формы — без выделенного окончания
    expect(hint.row.every((r) => r.ending === '')).toBe(true)
  })

  it('imperativo tú: presente él form', () => {
    const hint = explainForm(findVerb('pensar')!, 'imperativo', 'tú')
    expect(hint.stem + hint.ending!).toBe('piensa')
    expect(hint.row.map((r) => r.label)).toEqual(['tú', 'usted', 'nosotros', 'vosotros', 'ustedes'])
  })

  it('imperativo usted: subjunctive with orthographic note', () => {
    const hint = explainForm(findVerb('buscar')!, 'imperativo', 'él')
    expect(hint.stem).toBe('busqu')
    expect(hint.ending).toBe('e')
    expect(hint.note).toMatch(/qu/)
  })

  it('imperativo short tú forms are listed as irregular', () => {
    const hint = explainForm(findVerb('tener')!, 'imperativo', 'tú')
    expect(hint.stem).toBeUndefined()
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

  it('stem + ending always rebuilds the real form', () => {
    for (const verb of VERBS) {
      for (const tense of TENSES) {
        if (!hasTense(verb, tense)) continue
        for (const person of personsFor(tense)) {
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
