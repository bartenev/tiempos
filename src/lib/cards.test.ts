import { beforeEach, describe, expect, it } from 'vitest'
import { findVerb } from '../data/verbs'
import { cardsForUnits } from './book'
import { cardMistake, cardStat, recordCard, restoreCard, retryOf } from './cards'
import { buildCard } from './session'
import { loadBookStats, loadStats } from './stats'

const verbCard = buildCard(findVerb('hablar')!, 'presente', 'yo')
const bookCard = cardsForUnits([35])[0]!

describe('cards', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('keeps verb and textbook progress apart', () => {
    recordCard(verbCard, true)
    recordCard(bookCard, false)
    expect(Object.keys(loadStats())).toEqual(['hablar|presente|yo'])
    expect(Object.keys(loadBookStats())).toEqual([bookCard.key])
    expect(cardStat(bookCard)?.bad).toBe(1)
    expect(cardStat(verbCard)?.ok).toBe(1)
  })

  it('undoes an answer on a textbook card', () => {
    recordCard(bookCard, true)
    const before = cardStat(bookCard)
    recordCard(bookCard, false)
    restoreCard(bookCard, before)
    expect(cardStat(bookCard)).toEqual(before)
    restoreCard(bookCard, undefined)
    expect(cardStat(bookCard)).toBeUndefined()
  })

  it('describes a mistake for the summary', () => {
    expect(cardMistake(verbCard, 'hablas')).toMatchObject({
      key: 'hablar|presente|yo',
      meta: 'hablar · pres. · yo',
      answer: 'hablo',
      given: 'hablas',
    })
    const mistake = cardMistake(bookCard, 'la')
    expect(mistake.key).toBe(bookCard.key)
    expect(mistake.meta).toMatch(/^Глава 35 · /)
    expect(mistake.meta).not.toContain('___')
  })

  it('retries both kinds of cards', () => {
    expect(retryOf(verbCard).retry).toBe(true)
    expect(retryOf(bookCard)).toMatchObject({ key: bookCard.key, retry: true })
  })
})
