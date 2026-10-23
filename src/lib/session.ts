import { framesFor } from '../data/frames'
import { VERBS, isRegularVerb } from '../data/verbs'
import type { DrillCard, Person, SessionConfig, Tense, Verb } from '../types'
import { PERSONS } from '../types'
import { conjugate } from './conjugate'

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

function makeCard(verb: Verb, tense: Tense, person: Person): DrillCard {
  const frames = framesFor(tense, person)
  if (frames.length === 0) {
    throw new Error(`Нет шаблонов для ${tense} / ${person}`)
  }
  const frame = pickRandom(frames)
  return {
    verb,
    tense,
    person,
    sentence: frame.template,
    translation: frame.translation,
    answer: conjugate(verb, tense, person),
  }
}

export function verbsForConfig(config: SessionConfig): Verb[] {
  const irregularSet = new Set(config.selectedIrregular)
  return VERBS.filter((verb) => {
    const regular = isRegularVerb(verb)
    if (regular) return config.includeRegular
    return config.includeIrregular && irregularSet.has(verb.infinitive)
  })
}

/** Build a shuffled drill queue of the requested size. */
export function buildSession(config: SessionConfig): DrillCard[] {
  if (config.tenses.length === 0) {
    throw new Error('Выберите хотя бы одно время')
  }
  if (!config.includeRegular && !config.includeIrregular) {
    throw new Error('Выберите правильные и/или неправильные глаголы')
  }
  if (config.includeIrregular && config.selectedIrregular.length === 0) {
    throw new Error('Выберите хотя бы один неправильный глагол')
  }
  if (config.size < 1) {
    throw new Error('Размер сессии должен быть ≥ 1')
  }

  const pool = verbsForConfig(config)
  if (pool.length === 0) {
    throw new Error('Нет глаголов для выбранного фильтра')
  }

  const cards: DrillCard[] = []
  for (let i = 0; i < config.size; i++) {
    const verb = pickRandom(pool)
    const tense = pickRandom(config.tenses)
    const person = pickRandom(PERSONS)
    cards.push(makeCard(verb, tense, person))
  }
  return shuffle(cards)
}

/** Deterministic helper for tests (берёт первый шаблон). */
export function buildCard(verb: Verb, tense: Tense, person: Person): DrillCard {
  const frames = framesFor(tense, person)
  if (frames.length === 0) {
    throw new Error(`Нет шаблонов для ${tense} / ${person}`)
  }
  const frame = frames[0]!
  return {
    verb,
    tense,
    person,
    sentence: frame.template,
    translation: frame.translation,
    answer: conjugate(verb, tense, person),
  }
}
