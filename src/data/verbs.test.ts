import { describe, expect, it } from 'vitest'
import { REGULAR_VERBS, VERBS, findVerb, isRegularVerb } from './verbs'

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
