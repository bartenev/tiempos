import type { AnyCard, SessionMistake } from '../types'
import { TENSE_SHORT, isBookCard, personLabel } from '../types'
import { retryBookCard } from './book'
import { retryCard } from './session'
import type { CellStat } from './stats'
import {
  cellKey,
  loadBookStats,
  loadStats,
  recordAttempt,
  recordBookAttempt,
  restoreBookStat,
  restoreStat,
} from './stats'

/** Сессия не знает, глагол перед ней или упражнение: различия — здесь. */

export function cardStat(card: AnyCard): CellStat | undefined {
  return isBookCard(card)
    ? loadBookStats()[card.key]
    : loadStats()[cellKey(card.verb.infinitive, card.tense, card.person)]
}

export function recordCard(card: AnyCard, correct: boolean): void {
  if (isBookCard(card)) recordBookAttempt(card.key, correct)
  else recordAttempt(card.verb.infinitive, card.tense, card.person, correct)
}

export function restoreCard(card: AnyCard, previous: CellStat | undefined): void {
  if (isBookCard(card)) restoreBookStat(card.key, previous)
  else restoreStat(card.verb.infinitive, card.tense, card.person, previous)
}

export function cardMistake(card: AnyCard, given: string): SessionMistake {
  const { answer } = card
  if (isBookCard(card)) {
    const meta = `Глава ${card.unit} · ${card.sentence.replace('___', '…')}`
    return { key: card.key, meta, answer, given }
  }
  const { infinitive } = card.verb
  return {
    key: cellKey(infinitive, card.tense, card.person),
    meta: `${infinitive} · ${TENSE_SHORT[card.tense]} · ${personLabel(card.tense, card.person)}`,
    answer,
    given,
  }
}

export function retryOf(card: AnyCard): AnyCard {
  return isBookCard(card) ? retryBookCard(card) : retryCard(card)
}
