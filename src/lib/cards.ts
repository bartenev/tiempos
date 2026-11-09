import type { AnyCard, SessionMistake } from '../types'
import { TENSE_SHORT, isBookCard, personLabel } from '../types'
import { retryBookCard } from './book'
import { recordRun, restoreRun, runOf } from './runs'
import { retryCard, siblingCard } from './session'
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

/** Серия ячейки «Таблиц» до ответа — для отмены; null — карточка не из таблиц. */
export function cardRun(card: AnyCard): number | undefined | null {
  return isBookCard(card) ? null : runOf(card.verb, card.tense, card.person)
}

export function recordCard(card: AnyCard, correct: boolean): void {
  if (isBookCard(card)) {
    recordBookAttempt(card.key, correct)
    return
  }
  recordAttempt(card.verb.infinitive, card.tense, card.person, correct)
  recordRun(card.verb, card.tense, card.person, correct)
}

export function restoreCard(
  card: AnyCard,
  previous: CellStat | undefined,
  /** Серия ячейки «Таблиц» до ответа (cardRun); undefined — ответов не было. */
  previousRun: number | undefined | null,
): void {
  if (isBookCard(card)) {
    restoreBookStat(card.key, previous)
    return
  }
  restoreStat(card.verb.infinitive, card.tense, card.person, previous)
  restoreRun(card.verb, card.tense, card.person, previousRun)
}

/** Верные варианты по полям ввода: у глагола поле одно. */
export function cardBlanks(card: AnyCard): string[][] {
  return isBookCard(card) ? card.blanks : [[card.answer]]
}

export function cardMistake(card: AnyCard, given: string): SessionMistake {
  const { answer } = card
  if (isBookCard(card)) {
    const meta = `Глава ${card.unit} · ${card.sentence.replaceAll('___', '…')}`
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

/** Карточка на то же правило с другим глаголом; у неправильных и в учебнике — null. */
export function siblingOf(card: AnyCard): AnyCard | null {
  return isBookCard(card) ? null : siblingCard(card)
}
