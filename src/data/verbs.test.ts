import { describe, expect, it } from 'vitest'
import { REGULAR_VERBS, VERBS, VERB_FREQUENCY, findVerb, frequencyFactor, isRegularIn, isRegularVerb } from './verbs'

describe('isRegularVerb', () => {
  it('marks plain -ar/-er/-ir as regular', () => {
    expect(isRegularVerb(findVerb('hablar')!)).toBe(true)
    expect(isRegularVerb(findVerb('comer')!)).toBe(true)
    expect(isRegularVerb(findVerb('vivir')!)).toBe(true)
    expect(isRegularVerb(findVerb('llegar')!)).toBe(true)
  })

  it('excludes stem-changers and irregulars', () => {
    expect(isRegularVerb(findVerb('pensar')!)).toBe(false)
    expect(isRegularVerb(findVerb('ser')!)).toBe(false)
    expect(isRegularVerb(findVerb('tener')!)).toBe(false)
    expect(isRegularVerb(findVerb('hacer')!)).toBe(false)
  })

  it('REGULAR_VERBS is a subset of VERBS', () => {
    expect(REGULAR_VERBS.length).toBeGreaterThan(20)
    expect(REGULAR_VERBS.length).toBeLessThan(VERBS.length)
  })
})

describe('isRegularIn: regular or not, tense by tense', () => {
  const r = (inf: string, tense: Parameters<typeof isRegularIn>[1]) => isRegularIn(findVerb(inf)!, tense)

  it('irregular verbs are regular in some tenses', () => {
    expect(r('tener', 'presente')).toBe(false)
    expect(r('tener', 'indefinido')).toBe(false)
    expect(r('tener', 'imperfecto')).toBe(true)
    expect(r('tener', 'perfecto')).toBe(true)
    expect(r('pensar', 'indefinido')).toBe(true)
    expect(r('pedir', 'indefinido')).toBe(false) // pidió
    expect(r('leer', 'presente')).toBe(true)
    expect(r('leer', 'indefinido')).toBe(false) // leyó
  })

  it('a regular verb with its own participle is irregular only in perfecto', () => {
    expect(r('abrir', 'presente')).toBe(true)
    expect(r('abrir', 'perfecto')).toBe(false)
    expect(isRegularVerb(findVerb('abrir')!)).toBe(false)
  })

  it('spelling changes -car / -gar / -zar stay regular', () => {
    expect(r('llegar', 'indefinido')).toBe(true) // llegué
  })

  it('only ser, ir, ver are irregular in imperfecto', () => {
    expect(VERBS.filter((v) => !isRegularIn(v, 'imperfecto')).map((v) => v.infinitive).sort()).toEqual(['ir', 'ser', 'ver'])
  })
})

describe('VERB_FREQUENCY', () => {
  it('ranks every verb of the bank exactly once', () => {
    expect(new Set(VERB_FREQUENCY).size).toBe(VERB_FREQUENCY.length)
    expect([...VERB_FREQUENCY].sort()).toEqual(VERBS.map((v) => v.infinitive).sort())
  })

  it('ser weighs most, regar least, about 1 on average', () => {
    const factors = VERBS.map(frequencyFactor)
    expect(frequencyFactor(findVerb('ser')!)).toBe(Math.max(...factors))
    expect(frequencyFactor(findVerb('regar')!)).toBe(Math.min(...factors))
    const mean = factors.reduce((a, b) => a + b, 0) / factors.length
    expect(mean).toBeGreaterThan(0.8)
    expect(mean).toBeLessThan(1.3)
  })
})
