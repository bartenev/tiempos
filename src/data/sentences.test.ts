import { describe, expect, it } from 'vitest'
import { TENSES, personsFor } from '../types'
import { hasTense } from '../lib/conjugate'
import { VERB_COMPLEMENTS, buildVerbSentence, gerundConstructions } from './sentences'
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
        if (!hasTense(verb, tense)) continue
        for (const person of personsFor(tense)) {
          const built = buildVerbSentence(verb.infinitive, tense, person)!
          expect(built.sentence.split('___').length - 1).toBe(1)
          expect(built.translation).toContain('…')
        }
      }
    }
  })

  it('gerundio: the auxiliary is in the sentence, only the gerund goes into the gap', () => {
    const first = buildVerbSentence('hablar', 'gerundio', 'yo')!
    expect(first.sentence).toBe('Ahora mismo yo estoy ___ con Ana.')
    expect(first.translation).toBe('Прямо сейчас я … с Аной.')

    // любые лица и конструкции: estoy / estaba / sigo / llevo una hora
    const sentences: string[] = []
    for (let i = 0; i < 300; i++) {
      const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]!
      const built = buildVerbSentence('leer', 'gerundio', 'yo', pick)!
      expect(built.sentence.split('___').length - 1).toBe(1)
      sentences.push(built.sentence)
    }
    for (const aux of [/\best(oy|ás|á|amos|áis|án) ___/, /\bestab/, /\b(sigo|sigues|sigue|seguimos|seguís|siguen) ___/, /\bllev\w+ una hora ___/]) {
      expect(sentences.some((s) => aux.test(s)), String(aux)).toBe(true)
    }
  })

  it('gerundio: «llevo una hora» and «sigo» only where they make sense', () => {
    expect(gerundConstructions('leer').some((c) => c.es.includes('una hora'))).toBe(true)
    expect(gerundConstructions('abrir').some((c) => c.es.includes('una hora'))).toBe(false)
    expect(gerundConstructions('abrir').some((c) => c.aux[0] === 'sigo')).toBe(false)
    expect(gerundConstructions('abrir').length).toBeGreaterThan(0)
    for (let i = 0; i < 50; i++) {
      const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]!
      expect(buildVerbSentence('llegar', 'gerundio', 'yo', pick)!.sentence).not.toContain('a casa a las ocho')
    }
    const last = <T,>(items: T[]) => items[items.length - 1]!
    expect(buildVerbSentence('vivir', 'gerundio', 'yo', last)!.sentence).toContain('una gran aventura')
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

describe('imperativo sentences', () => {
  it('shows the addressee and keeps the gap at the verb', () => {
    expect(buildVerbSentence('comer', 'imperativo', 'tú')).toEqual({
      sentence: '(tú) ¡___ una pizza!',
      translation: '(ты) … пиццу!',
    })
    expect(buildVerbSentence('hablar', 'imperativo', 'nosotros')!.translation).toBe(
      'Давайте … с Аной!',
    )
    expect(buildVerbSentence('hablar', 'imperativo', 'ellos')!.sentence).toMatch(/^\(ustedes\)/)
  })

  it('uses imperative-specific complements where general ones sound wrong', () => {
    expect(buildVerbSentence('tener', 'imperativo', 'tú')!.sentence).toBe('(tú) ¡___ paciencia!')
    expect(buildVerbSentence('vivir', 'imperativo', 'vosotros')!.sentence).toBe(
      '(vosotros) ¡___ el momento!',
    )
    expect(buildVerbSentence('estar', 'imperativo', 'ellos')!.sentence).toBe(
      '(ustedes) ¡___ tranquilos!',
    )
  })
})
