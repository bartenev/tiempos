import { beforeEach, describe, expect, it } from 'vitest'
import { findVerb } from '../data/verbs'
import { cardRun, recordCard, restoreCard } from './cards'
import { RUNS_KEY, loadRuns, recordRun } from './runs'
import { buildCard } from './session'

const hablar = findVerb('hablar')!
const ser = findVerb('ser')!

describe('table runs', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('counts correct answers in a row per group × tense × person and resets on a mistake', () => {
    recordRun(hablar, 'presente', 'yo', true)
    recordRun(findVerb('trabajar')!, 'presente', 'yo', true)
    expect(loadRuns()['ar|presente|yo']).toBe(2)
    recordRun(hablar, 'presente', 'yo', false)
    expect(loadRuns()['ar|presente|yo']).toBe(0)
    recordRun(hablar, 'presente', 'tú', true)
    expect(loadRuns()).toEqual({ 'ar|presente|yo': 0, 'ar|presente|tú': 1 })
  })

  it('ignores irregular verbs', () => {
    recordRun(ser, 'presente', 'yo', false)
    expect(loadRuns()).toEqual({})
    expect(cardRun(buildCard(ser, 'presente', 'yo'))).toBeNull()
  })

  it('drops broken values from storage', () => {
    localStorage.setItem(RUNS_KEY, JSON.stringify({ 'ar|presente|yo': 3, bad: 'x', neg: -1 }))
    expect(loadRuns()).toEqual({ 'ar|presente|yo': 3 })
  })

  it('undo restores the cell run along with the stat', () => {
    const card = buildCard(hablar, 'presente', 'yo')
    recordCard(card, true)
    recordCard(card, true)
    const before = cardRun(card)
    recordCard(card, false)
    expect(loadRuns()['ar|presente|yo']).toBe(0)
    restoreCard(card, undefined, before)
    expect(loadRuns()['ar|presente|yo']).toBe(2)
    restoreCard(card, undefined, undefined)
    expect(loadRuns()).toEqual({})
  })
})

describe('table runs — perfecto', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('skips regular verbs with an irregular participle', () => {
    recordRun(findVerb('escribir')!, 'perfecto', 'yo', true)
    expect(loadRuns()).toEqual({})
    recordRun(findVerb('escribir')!, 'presente', 'yo', true)
    recordRun(findVerb('vivir')!, 'perfecto', 'yo', true)
    expect(loadRuns()).toEqual({ 'ir|presente|yo': 1, 'ir|perfecto|yo': 1 })
  })
})
