import { describe, expect, it } from 'vitest'
import { checkAnswer, normalizeAnswer, stripDiacritics } from './normalize'

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
