import { describe, expect, it } from 'vitest'
import { findVerb } from '../data/verbs'
import type { Person, Tense, Verb } from '../types'
import { PERSONS } from '../types'
import { conjugate } from './conjugate'

function mustFind(infinitive: string): Verb {
  const v = findVerb(infinitive)
  if (!v) throw new Error(`verb not found: ${infinitive}`)
  return v
}

function paradigm(infinitive: string, tense: Tense): Record<Person, string> {
  const verb = mustFind(infinitive)
  return Object.fromEntries(
    PERSONS.map((p) => [p, conjugate(verb, tense, p)]),
  ) as Record<Person, string>
}

describe('conjugate regular -ar', () => {
  it('presente hablar', () => {
    expect(paradigm('hablar', 'presente')).toEqual({
      yo: 'hablo',
      tú: 'hablas',
      él: 'habla',
      nosotros: 'hablamos',
      vosotros: 'habláis',
      ellos: 'hablan',
    })
  })

  it('imperfecto hablar', () => {
    expect(paradigm('hablar', 'imperfecto')).toEqual({
      yo: 'hablaba',
      tú: 'hablabas',
      él: 'hablaba',
      nosotros: 'hablábamos',
      vosotros: 'hablabais',
      ellos: 'hablaban',
    })
  })

  it('indefinido hablar', () => {
    expect(paradigm('hablar', 'indefinido')).toEqual({
      yo: 'hablé',
      tú: 'hablaste',
      él: 'habló',
      nosotros: 'hablamos',
      vosotros: 'hablasteis',
      ellos: 'hablaron',
    })
  })
})

describe('conjugate regular -er / -ir', () => {
  it('presente comer', () => {
    expect(paradigm('comer', 'presente')).toEqual({
      yo: 'como',
      tú: 'comes',
      él: 'come',
      nosotros: 'comemos',
      vosotros: 'coméis',
      ellos: 'comen',
    })
  })

  it('indefinido vivir', () => {
    expect(paradigm('vivir', 'indefinido')).toEqual({
      yo: 'viví',
      tú: 'viviste',
      él: 'vivió',
      nosotros: 'vivimos',
      vosotros: 'vivisteis',
      ellos: 'vivieron',
    })
  })

  it('imperfecto comer', () => {
    expect(conjugate(mustFind('comer'), 'imperfecto', 'nosotros')).toBe('comíamos')
  })
})

describe('orthographic indefinido yo', () => {
  it('-car / -gar / -zar', () => {
    expect(conjugate(mustFind('buscar'), 'indefinido', 'yo')).toBe('busqué')
    expect(conjugate(mustFind('llegar'), 'indefinido', 'yo')).toBe('llegué')
    expect(conjugate(mustFind('empezar'), 'indefinido', 'yo')).toBe('empecé')
  })
})

describe('stem-changing presente', () => {
  it('e>ie pensar', () => {
    expect(paradigm('pensar', 'presente')).toEqual({
      yo: 'pienso',
      tú: 'piensas',
      él: 'piensa',
      nosotros: 'pensamos',
      vosotros: 'pensáis',
      ellos: 'piensan',
    })
  })

  it('o>ue poder', () => {
    expect(conjugate(mustFind('poder'), 'presente', 'yo')).toBe('puedo')
    expect(conjugate(mustFind('poder'), 'presente', 'nosotros')).toBe('podemos')
  })

  it('e>i pedir', () => {
    expect(conjugate(mustFind('pedir'), 'presente', 'él')).toBe('pide')
    expect(conjugate(mustFind('pedir'), 'presente', 'nosotros')).toBe('pedimos')
  })

  it('u>ue jugar', () => {
    expect(conjugate(mustFind('jugar'), 'presente', 'yo')).toBe('juego')
    expect(conjugate(mustFind('jugar'), 'presente', 'nosotros')).toBe('jugamos')
  })
})

describe('irregulars', () => {
  it('ser', () => {
    expect(paradigm('ser', 'presente')).toEqual({
      yo: 'soy',
      tú: 'eres',
      él: 'es',
      nosotros: 'somos',
      vosotros: 'sois',
      ellos: 'son',
    })
    expect(conjugate(mustFind('ser'), 'indefinido', 'yo')).toBe('fui')
    expect(conjugate(mustFind('ser'), 'imperfecto', 'nosotros')).toBe('éramos')
  })

  it('ir', () => {
    expect(conjugate(mustFind('ir'), 'presente', 'yo')).toBe('voy')
    expect(conjugate(mustFind('ir'), 'indefinido', 'él')).toBe('fue')
    expect(conjugate(mustFind('ir'), 'imperfecto', 'yo')).toBe('iba')
  })

  it('tener / hacer / decir', () => {
    expect(conjugate(mustFind('tener'), 'presente', 'yo')).toBe('tengo')
    expect(conjugate(mustFind('tener'), 'indefinido', 'él')).toBe('tuvo')
    expect(conjugate(mustFind('hacer'), 'indefinido', 'él')).toBe('hizo')
    expect(conjugate(mustFind('decir'), 'indefinido', 'ellos')).toBe('dijeron')
  })

  it('dar / ver', () => {
    expect(conjugate(mustFind('dar'), 'indefinido', 'yo')).toBe('di')
    expect(conjugate(mustFind('ver'), 'imperfecto', 'yo')).toBe('veía')
    expect(conjugate(mustFind('ver'), 'indefinido', 'él')).toBe('vio')
  })
})

describe('-ir stem shift in indefinido', () => {
  it('pedir / dormir / sentir / preferir / servir', () => {
    expect(conjugate(mustFind('pedir'), 'indefinido', 'él')).toBe('pidió')
    expect(conjugate(mustFind('pedir'), 'indefinido', 'nosotros')).toBe('pedimos')
    expect(conjugate(mustFind('dormir'), 'indefinido', 'ellos')).toBe('durmieron')
    expect(conjugate(mustFind('dormir'), 'indefinido', 'yo')).toBe('dormí')
    expect(conjugate(mustFind('sentir'), 'indefinido', 'él')).toBe('sintió')
    expect(conjugate(mustFind('preferir'), 'indefinido', 'ellos')).toBe('prefirieron')
    expect(conjugate(mustFind('servir'), 'indefinido', 'él')).toBe('sirvió')
  })

  it('-ar/-er stem-changers stay regular in indefinido', () => {
    expect(conjugate(mustFind('pensar'), 'indefinido', 'él')).toBe('pensó')
    expect(conjugate(mustFind('volver'), 'indefinido', 'ellos')).toBe('volvieron')
  })

  it('ver vosotros presente has no accent', () => {
    expect(conjugate(mustFind('ver'), 'presente', 'vosotros')).toBe('veis')
    expect(conjugate(mustFind('ver'), 'presente', 'yo')).toBe('veo')
  })
})
