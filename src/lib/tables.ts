import type { Person, Tense, Verb } from '../types'
import { conjugate, infinitiveStem } from './conjugate'

/** Ячейка таблицы окончаний: форма = stem + ending. */
export interface EndingCell {
  stem: string
  ending: string
  /** Такое же окончание есть у другого спряжения в этой строке (comía / vivía). */
  shared: boolean
}

/**
 * Строка таблицы (время × лицо) для глаголов-примеров: форма делится
 * на основу инфинитива и окончание; совпадающие окончания помечаются.
 */
export function endingsRow(verbs: Verb[], tense: Tense, person: Person): EndingCell[] {
  const split = verbs.map((verb) => {
    const form = conjugate(verb, tense, person)
    // Составная форма (he hablado): вспомогательный глагол идёт к основе.
    const space = form.lastIndexOf(' ') + 1
    const aux = form.slice(0, space)
    const word = form.slice(space)
    const stem = infinitiveStem(verb)
    return word.startsWith(stem)
      ? { stem: aux + stem, ending: word.slice(stem.length) }
      : { stem: '', ending: form }
  })
  return split.map((cell, i) => ({
    ...cell,
    shared: split.some((other, j) => j !== i && other.ending === cell.ending),
  }))
}
