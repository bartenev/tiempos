import { describe, expect, it } from 'vitest'
import {
  checkAnswer,
  checkAnswers,
  checkBlanks,
  normalizeAnswer,
  overallCheck,
  stripDiacritics,
} from './normalize'

describe('normalizeAnswer', () => {
  it('trims and lowercases', () => {
    expect(normalizeAnswer('  Hablé  ')).toBe('hablé')
  })
})

describe('stripDiacritics', () => {
  it('removes accents', () => {
    expect(stripDiacritics('hablé')).toBe('hable')
    expect(stripDiacritics('íbamos')).toBe('ibamos')
  })
})

describe('checkAnswer', () => {
  it('exact match ignoring case and spaces', () => {
    expect(checkAnswer(' Hablo ', 'hablo')).toBe('exact')
  })

  it('almost when only accents differ', () => {
    expect(checkAnswer('hable', 'hablé')).toBe('almost')
    expect(checkAnswer('ibamos', 'íbamos')).toBe('almost')
  })

  it('wrong otherwise', () => {
    expect(checkAnswer('habla', 'hablo')).toBe('wrong')
    expect(checkAnswer('', 'hablo')).toBe('wrong')
  })
})

describe('checkAnswers', () => {
  it('takes the best result across the variants', () => {
    expect(checkAnswers('le', ['lo', 'le'])).toBe('exact')
    expect(checkAnswers('dámelo', ['Dámelo'])).toBe('exact')
    expect(checkAnswers('damelo', ['Dámelo', 'dámela'])).toBe('almost')
    expect(checkAnswers('las', ['lo', 'le'])).toBe('wrong')
  })

  it('does not count punctuation or extra spaces', () => {
    expect(checkAnswers('  no me  lo   des. ', ['no me lo des'])).toBe('exact')
    expect(checkAnswers('¿Cuál?', ['cuál'])).toBe('exact')
  })
})

describe('checkBlanks', () => {
  it('checks every field on its own', () => {
    expect(checkBlanks(['mi', 'mas'], [['mi'], ['mis']])).toEqual(['exact', 'wrong'])
    expect(checkBlanks(['tú', 'tu'], [['tú'], ['tú']])).toEqual(['exact', 'almost'])
  })

  it('takes any variant of a blank', () => {
    expect(checkBlanks(['nosotras'], [['nosotros', 'nosotras']])).toEqual(['exact'])
  })

  it('an empty field or a dash means nothing goes in the blank', () => {
    const blanks = [['—'], ['Él'], ['ella']]
    expect(checkBlanks(['', 'Él', 'ella'], blanks)).toEqual(['exact', 'exact', 'exact'])
    expect(checkBlanks(['-', 'Él', 'ella'], blanks)).toEqual(['exact', 'exact', 'exact'])
    expect(checkBlanks(['—', 'Él', 'ella'], blanks)).toEqual(['exact', 'exact', 'exact'])
  })

  it('an empty field is wrong where a word is needed', () => {
    expect(checkBlanks(['', 'x'], [['yo'], ['x']])).toEqual(['wrong', 'exact'])
  })

  it('sums up: wrong beats almost, almost beats exact', () => {
    expect(overallCheck(['exact', 'exact'])).toBe('exact')
    expect(overallCheck(['exact', 'almost'])).toBe('almost')
    expect(overallCheck(['almost', 'wrong'])).toBe('wrong')
  })
})
