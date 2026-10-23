import { describe, expect, it } from 'vitest'
import { pluralRu } from './plural'

describe('pluralRu', () => {
  const card = (n: number) => `${n} ${pluralRu(n, 'карточка', 'карточки', 'карточек')}`

  it('picks the form by number', () => {
    expect(card(1)).toBe('1 карточка')
    expect(card(3)).toBe('3 карточки')
    expect(card(5)).toBe('5 карточек')
    expect(card(11)).toBe('11 карточек')
    expect(card(12)).toBe('12 карточек')
    expect(card(21)).toBe('21 карточка')
    expect(card(22)).toBe('22 карточки')
    expect(card(0)).toBe('0 карточек')
  })
})
