import { describe, expect, it } from 'vitest'
import {
  checkAnswer,
  normalizeAnswer,
  phoneticKey,
  spokenMatches,
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

describe('voice: phoneticKey / spokenMatches', () => {
  it('ignores what cannot be heard: accents, b/v, ll/y, silent h', () => {
    expect(phoneticKey('habló')).toBe(phoneticKey('hablo'))
    expect(phoneticKey('sé')).toBe(phoneticKey('se'))
    expect(phoneticKey('vive')).toBe(phoneticKey('bibe'))
    expect(phoneticKey('vaya')).toBe(phoneticKey('valla'))
    expect(phoneticKey('hago')).toBe(phoneticKey('ago'))
    expect(phoneticKey('dicho')).toBe('dicho')
  })

  it('keeps sounds that differ', () => {
    expect(phoneticKey('hablo')).not.toBe(phoneticKey('habla'))
    expect(phoneticKey('pidió')).not.toBe(phoneticKey('pedió'))
  })

  it('accepts the form in any alternative and any word of it', () => {
    expect(spokenMatches(['hablo', 'habló'], 'habló')).toBe(true)
    expect(spokenMatches(['Hablas.', 'yo hablo con Ana'], 'hablo')).toBe(true)
    expect(spokenMatches(['¡Ten!'], 'ten')).toBe(true)
  })

  it('rejects other forms', () => {
    expect(spokenMatches(['hablas', 'hablan'], 'hablo')).toBe(false)
    expect(spokenMatches([''], 'hablo')).toBe(false)
  })
})
