import { VERB_RU } from '../data/verbRu'
import type { DrillCard } from '../types'
import { personLabel } from '../types'

/**
 * Упрощённая карточка («Лаборатория»): вместо предложения — местоимение и пропуск,
 * вместо перевода предложения — перевод инфинитива. Ответ и проверка те же.
 */
export function simplePrompt(card: DrillCard): { sentence: string; translation: string } {
  const label = personLabel(card.tense, card.person)
  const sentence = card.tense === 'imperativo' ? `(${label}) ¡___!` : `${label} ___`
  return { sentence, translation: VERB_RU[card.verb.infinitive] ?? '' }
}
