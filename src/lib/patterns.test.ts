import { describe, expect, it } from 'vitest'
import { VERBS, findVerb } from '../data/verbs'
import type { Person, Tense } from '../types'
import { TENSES, VERB_GROUPS, personsFor } from '../types'
import { hasTense } from './conjugate'
import { PATTERNS_BY_TENSE, patternOf, portionOf } from './patterns'

function pattern(infinitive: string, tense: Tense, person: Person) {
  return patternOf(findVerb(infinitive)!, tense, person)
}

describe('patternOf', () => {
  it('regular forms of irregular verbs have no pattern', () => {
    expect(pattern('tener', 'presente', 'nosotros')).toBeNull() // tenemos
    expect(pattern('pensar', 'indefinido', 'yo')).toBeNull() // pensé
    expect(pattern('pedir', 'presente', 'nosotros')).toBeNull() // pedimos
    expect(pattern('tener', 'imperfecto', 'él')).toBeNull() // tenía
  })

  it('spelling changes stay regular', () => {
    expect(pattern('buscar', 'indefinido', 'yo')).toBeNull() // busqué
    expect(pattern('llegar', 'indefinido', 'yo')).toBeNull() // llegué
  })

  it('presente: one verb, several patterns', () => {
    expect(pattern('tener', 'presente', 'yo')).toBe('yo-go') // tengo
    expect(pattern('tener', 'presente', 'tú')).toBe('e>ie') // tienes
    expect(pattern('decir', 'presente', 'él')).toBe('e>i') // dice
    expect(pattern('jugar', 'presente', 'yo')).toBe('o>ue') // juego
    expect(pattern('conseguir', 'presente', 'yo')).toBe('e>i') // consigo — орфография, не -go
    expect(pattern('conducir', 'presente', 'yo')).toBe('yo-zco') // conduzco
    expect(pattern('conocer', 'presente', 'yo')).toBe('yo-zco')
    expect(pattern('oír', 'presente', 'yo')).toBe('yo-go') // oigo
    expect(pattern('oír', 'presente', 'tú')).toBe('minor') // oyes
    expect(pattern('saber', 'presente', 'yo')).toBe('minor') // sé
    expect(pattern('ser', 'presente', 'tú')).toBe('verb-ser')
    expect(pattern('ir', 'presente', 'yo')).toBe('verb-ir')
  })

  it('indefinido: stems, 3rd-person shift, -y-', () => {
    expect(pattern('estar', 'indefinido', 'yo')).toBe('stem-u') // estuve
    expect(pattern('hacer', 'indefinido', 'él')).toBe('stem-i') // hizo
    expect(pattern('querer', 'indefinido', 'yo')).toBe('stem-i') // quise
    expect(pattern('decir', 'indefinido', 'ellos')).toBe('stem-j') // dijeron
    expect(pattern('dormir', 'indefinido', 'él')).toBe('shift-3') // durmió
    expect(pattern('leer', 'indefinido', 'él')).toBe('y') // leyó
    expect(pattern('ir', 'indefinido', 'yo')).toBe('fui')
    expect(pattern('ver', 'indefinido', 'él')).toBe('di-vi') // vio
  })

  it('imperativo: vowel change, from yo, short tú, special', () => {
    expect(pattern('pensar', 'imperativo', 'tú')).toBe('vowel') // piensa
    expect(pattern('pedir', 'imperativo', 'nosotros')).toBe('vowel') // pidamos
    expect(pattern('tener', 'imperativo', 'él')).toBe('from-yo') // tenga
    expect(pattern('ver', 'imperativo', 'él')).toBe('from-yo') // vea
    expect(pattern('venir', 'imperativo', 'tú')).toBe('short-tu') // ven
    expect(pattern('ser', 'imperativo', 'él')).toBe('special') // sea
    expect(pattern('estar', 'imperativo', 'tú')).toBe('special') // está
  })

  it('imperfecto: only ser, ir, ver', () => {
    const irregular = VERBS.filter((v) => patternOf(v, 'imperfecto', 'yo')).map((v) => v.infinitive)
    expect(irregular.sort()).toEqual(['ir', 'ser', 'ver'])
  })
})

describe('portionOf', () => {
  it('every form lands in a portion listed for its tense, and every listed portion is used', () => {
    for (const tense of TENSES) {
      const listed = new Set<string>([...VERB_GROUPS, ...PATTERNS_BY_TENSE[tense]])
      const used = new Set<string>()
      for (const verb of VERBS) {
        if (!hasTense(verb, tense)) continue
        for (const person of personsFor(tense)) {
          const portion = portionOf(verb, tense, person)
          expect(listed.has(portion), `${verb.infinitive} ${tense} ${person} → ${portion}`).toBe(true)
          used.add(portion)
        }
      }
      expect([...used].sort()).toEqual([...listed].sort())
    }
  })
})
