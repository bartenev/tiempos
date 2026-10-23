import { framesFor } from '../data/frames'
import { buildVerbSentence } from '../data/sentences'
import { VERBS, isRegularVerb } from '../data/verbs'
import type { DrillCard, Person, SessionConfig, Tense, Verb } from '../types'
import { personsFor } from '../types'
import { conjugate, hasTense } from './conjugate'
import { portionKey, portionStatuses } from './portions'
import type { CellStat, StatsStore } from './stats'
import { cellKey, cellWeight, isWeak, loadStats } from './stats'

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
  const answer = conjugate(verb, tense, person)
  const own = buildVerbSentence(verb.infinitive, tense, person, pickRandom)
  if (own) return { verb, tense, person, ...own, answer }

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
    answer,
  }
}

/** Новая карточка той же формы (с другим предложением) — для повтора после ошибки. */
export function retryCard(card: DrillCard): DrillCard {
  return { ...makeCard(card.verb, card.tense, card.person), retry: true }
}

export function verbsForConfig(config: SessionConfig): Verb[] {
  const irregularSet = new Set(config.selectedIrregular)
  return VERBS.filter((verb) => {
    if (!config.groups.includes(verb.group)) return false
    const regular = isRegularVerb(verb)
    if (regular) return config.includeRegular
    return config.includeIrregular && irregularSet.has(verb.infinitive)
  })
}

export interface Cell {
  verb: Verb
  tense: Tense
  person: Person
  stat: CellStat | undefined
  weight: number
  weak: boolean
}

/** Лица времени, отмеченные в настройках (в императиве нет yo). */
function personsOf(config: SessionConfig, tense: Tense): Person[] {
  return personsFor(tense).filter((p) => config.persons.includes(p))
}

/** Все формы глагол × время × местоимение для фильтра, с весами. */
export function cellsForConfig(
  config: SessionConfig,
  stats: StatsStore = loadStats(),
): Cell[] {
  const cells: Cell[] = []
  for (const verb of verbsForConfig(config)) {
    for (const tense of config.tenses) {
      if (!hasTense(verb, tense)) continue
      for (const person of personsOf(config, tense)) {
        const stat = stats[cellKey(verb.infinitive, tense, person)]
        cells.push({
          verb,
          tense,
          person,
          stat,
          weight: cellWeight(stat),
          weak: isWeak(stat),
        })
      }
    }
  }
  return cells
}

export function weakCount(config: SessionConfig): number {
  if (config.tenses.length === 0) return 0
  return cellsForConfig(config).filter((c) => c.weak).length
}

/**
 * Взвешенная выборка без подряд идущих повторов:
 * после выбора вес формы падает, чтобы очередь не залипала на одной.
 */
function weightedQueue(cells: Cell[], size: number): Cell[] {
  const weights = cells.map((c) => c.weight)
  const out: Cell[] = []
  let prev = -1
  for (let n = 0; n < size; n++) {
    let total = 0
    for (let i = 0; i < weights.length; i++) {
      if (i !== prev || weights.length === 1) total += weights[i]!
    }
    let r = Math.random() * total
    let chosen = weights.length - 1
    for (let i = 0; i < weights.length; i++) {
      if (i === prev && weights.length > 1) continue
      r -= weights[i]!
      if (r <= 0) {
        chosen = i
        break
      }
    }
    out.push(cells[chosen]!)
    weights[chosen] = weights[chosen]! * 0.25
    prev = chosen
  }
  return out
}

function validate(config: SessionConfig): void {
  if (config.tenses.length === 0) {
    throw new Error('Выберите хотя бы одно время')
  }
  if (config.persons.length === 0) {
    throw new Error('Выберите хотя бы одно местоимение')
  }
  if (config.groups.length === 0) {
    throw new Error('Выберите хотя бы одно спряжение: -ar, -er или -ir')
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
}

/** Максимум показов одной слабой формы в режиме «только слабые». */
export const WEAK_REPEATS = 3

/** Новая форма в уже освоенной порции: правило знакомо — это скорее повторение. */
export const KNOWN_PATTERN_NEW_WEIGHT = 1.25

/** Доля сессии на текущую порцию; остальное — повторение уже открытого. */
export const CURRENT_PORTION_SHARE = 0.6

/**
 * Умный режим вводит новое порциями (время × окончание):
 * - не начатые порции после текущей ждут своей очереди;
 * - новые формы освоенных порций идут с весом повторения;
 * - текущей порции — CURRENT_PORTION_SHARE всей сессии, сколько бы в ней ни было
 *   глаголов (в -ar их вдвое больше, чем в -er, — иначе старое перевешивало бы новое).
 */
function smartPool(cells: Cell[]): Cell[] {
  const state = new Map(
    portionStatuses(cells).map((s) => [portionKey(s.tense, s.group), s.state]),
  )
  const stateOf = (c: Cell) => state.get(portionKey(c.tense, c.verb.group))

  const pool = cells
    .filter((c) => stateOf(c) !== 'locked')
    .map((c) =>
      !c.stat && stateOf(c) === 'mastered' ? { ...c, weight: KNOWN_PATTERN_NEW_WEIGHT } : c,
    )

  const total = (list: Cell[]) => list.reduce((sum, c) => sum + c.weight, 0)
  const current = total(pool.filter((c) => stateOf(c) === 'current'))
  const rest = total(pool.filter((c) => stateOf(c) !== 'current'))
  if (current === 0 || rest === 0) return pool

  return pool.map((c) => ({
    ...c,
    weight:
      stateOf(c) === 'current'
        ? (c.weight / current) * CURRENT_PORTION_SHARE
        : (c.weight / rest) * (1 - CURRENT_PORTION_SHARE),
  }))
}

/** Build a drill queue of the requested size. */
export function buildSession(
  config: SessionConfig,
  stats: StatsStore = loadStats(),
): DrillCard[] {
  validate(config)

  const pool = verbsForConfig(config)
  if (pool.length === 0) {
    throw new Error('Нет глаголов для выбранного фильтра')
  }

  let cells = cellsForConfig(config, stats)
  if (cells.length === 0) {
    throw new Error('Нет форм для выбранного фильтра')
  }

  if (config.mode === 'random') {
    // Равномерно по времени, затем по глаголу и лицу (у части глаголов нет императива,
    // в императиве нет yo).
    const tenses = config.tenses.filter(
      (t) => personsOf(config, t).length > 0 && pool.some((v) => hasTense(v, t)),
    )
    const cards: DrillCard[] = []
    for (let i = 0; i < config.size; i++) {
      const tense = pickRandom(tenses)
      const verb = pickRandom(pool.filter((v) => hasTense(v, tense)))
      const person = pickRandom(personsOf(config, tense))
      cards.push(makeCard(verb, tense, person))
    }
    return shuffle(cards)
  }

  let size = config.size
  if (config.mode === 'smart') cells = smartPool(cells)
  if (config.mode === 'weak') {
    cells = cells.filter((c) => c.weak)
    if (cells.length === 0) {
      throw new Error('Слабых форм нет — отличная работа!')
    }
    // Не гонять 2–3 формы по 10 раз подряд.
    size = Math.min(size, cells.length * WEAK_REPEATS)
  }
  return weightedQueue(cells, size).map((c) =>
    makeCard(c.verb, c.tense, c.person),
  )
}

/** Deterministic helper for tests (берёт первый шаблон). */
export function buildCard(verb: Verb, tense: Tense, person: Person): DrillCard {
  const answer = conjugate(verb, tense, person)
  const own = buildVerbSentence(verb.infinitive, tense, person)
  if (own) return { verb, tense, person, ...own, answer }

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
    answer,
  }
}
