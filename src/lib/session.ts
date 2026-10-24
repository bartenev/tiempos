import { framesFor } from '../data/frames'
import { buildVerbSentence } from '../data/sentences'
import { VERBS, isRegularVerb } from '../data/verbs'
import type { DrillCard, Person, SessionConfig, Tense, Verb } from '../types'
import { personsFor } from '../types'
import { conjugate, hasTense } from './conjugate'
import type { PortionStatus } from './portions'
import { cellPortionKey, portionKey, portionStatuses } from './portions'
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

/** Доля умной сессии, гарантированная слабым формам (если они есть). */
export const WEAK_SMART_SHARE = 1 / 3

/** Сколько раз одна слабая форма может попасть в умную сессию. */
export const WEAK_SMART_REPEATS = 2

/**
 * Гарантированные места для слабых форм: сначала те, где больше ошибок
 * (равные — в случайном порядке), каждая по разу, потом — второй круг.
 */
function weakPicks(weak: Cell[], slots: number): Cell[] {
  const ordered = shuffle(weak).sort((a, b) => b.weight - a.weight)
  const picks: Cell[] = []
  for (let round = 0; round < WEAK_SMART_REPEATS; round++) {
    for (const cell of ordered) {
      if (picks.length < slots) picks.push(cell)
    }
  }
  return picks
}

/** Перемешать так, чтобы одна и та же форма не шла два раза подряд (если это возможно). */
function spread(cells: Cell[]): Cell[] {
  const out = shuffle(cells)
  const clashes = (k: number) =>
    (k > 0 && out[k] === out[k - 1]) || (k < out.length - 1 && out[k] === out[k + 1])
  for (let i = 1; i < out.length; i++) {
    if (out[i] !== out[i - 1]) continue
    // повтор: меняем out[i] с любым местом, где после обмена у обоих нет одинаковых соседей
    for (let j = 0; j < out.length; j++) {
      if (j === i || out[j] === out[i]) continue
      ;[out[i], out[j]] = [out[j]!, out[i]!]
      if (!clashes(i) && !clashes(j)) break
      ;[out[i], out[j]] = [out[j]!, out[i]!]
    }
  }
  return out
}

/**
 * Умная сессия: до трети мест — слабым формам (гарантированно), остальное —
 * порции, повторение и новое без слабых, чтобы одна форма не выпадала много раз.
 */
function smartQueue(cells: Cell[], size: number): Cell[] {
  const weak = cells.filter((c) => c.weak)
  const slots = Math.min(Math.floor(size * WEAK_SMART_SHARE), weak.length * WEAK_SMART_REPEATS)
  const rest = smartPool(cells, size - slots).filter((c) => !c.weak)
  if (rest.length === 0) return weightedQueue(weak, Math.min(size, weak.length * WEAK_REPEATS))

  return spread([...weakPicks(weak, slots), ...weightedQueue(rest, size - slots)])
}

/** Новая форма в уже освоенной порции: правило знакомо — это скорее повторение. */
export const KNOWN_PATTERN_NEW_WEIGHT = 1.25

/** Доля сессии на текущую порцию; остальное — повторение уже открытого. */
export const CURRENT_PORTION_SHARE = 0.6

/** Карточек на каждый недостающий до освоения верный ответ — с запасом на ошибки. */
export const NEAR_DONE_MARGIN = 2

/** Корзина пула: порция из очереди (её ключ) или всё повторение. */
const REVIEW = 'review'

/**
 * Раздать долю нового по очереди изучения: каждой порции — сколько ей нужно до освоения
 * (с запасом NEAR_DONE_MARGIN), последней — остаток. Возвращает карточки по ключам порций.
 */
function allotNew(statuses: PortionStatus[], budget: number): Map<string, number> {
  const allot = new Map<string, number>()
  const queue = statuses
    .filter((s) => s.rank !== null)
    .sort((a, b) => a.rank! - b.rank!)
  let last = ''
  for (const s of queue) {
    if (budget <= 0) break
    const give = Math.min(s.need * NEAR_DONE_MARGIN, budget)
    last = portionKey(s.tense, s.portion)
    allot.set(last, give)
    budget -= give
  }
  // все порции очереди уже получили сколько нужно — остаток последней
  if (budget > 0 && last) allot.set(last, allot.get(last)! + budget)
  return allot
}

/**
 * Умный режим вводит новое порциями (время × окончание или модель неправильности):
 * - доля нового (CURRENT_PORTION_SHARE сессии) раздаётся по очереди изучения: текущей —
 *   сколько ей нужно до освоения, остаток — следующей, и так далее; последней — остаток.
 *   Порция с нуля обычно забирает всю долю; почти освоенная — пару карточек, и в ту же
 *   сессию входит следующая. Доля не зависит от числа глаголов в порции (в -ar их вдвое
 *   больше, чем в -er, — иначе старое перевешивало бы новое);
 * - порции, до которых доля не дошла, ждут: у начатых в повторение идут только уже
 *   отвеченные формы, не начатые не берутся совсем;
 * - новые формы освоенных порций идут с весом повторения;
 * - повторять нечего — вся сессия раздаётся по очереди.
 * `cards` — сколько карточек сессии разыгрывается из этого пула.
 */
function smartPool(cells: Cell[], cards: number): Cell[] {
  const statuses = portionStatuses(cells)
  const state = new Map(statuses.map((s) => [portionKey(s.tense, s.portion), s.state]))

  const build = (budget: number) => {
    const allot = allotNew(statuses, budget)
    const bucketOf = (c: Cell) => {
      const key = cellPortionKey(c)
      return allot.has(key) ? key : REVIEW
    }
    const pool = cells
      .filter((c) => {
        const key = cellPortionKey(c)
        return allot.has(key) || state.get(key) === 'mastered' || Boolean(c.stat)
      })
      .map((c) =>
        !c.stat && state.get(cellPortionKey(c)) === 'mastered'
          ? { ...c, weight: KNOWN_PATTERN_NEW_WEIGHT }
          : c,
      )
    return { allot, bucketOf, pool }
  }

  let { allot, bucketOf, pool } = build(CURRENT_PORTION_SHARE * cards)
  if (!pool.some((c) => bucketOf(c) === REVIEW)) ({ allot, bucketOf, pool } = build(cards))

  const share = (bucket: string) =>
    bucket === REVIEW ? 1 - CURRENT_PORTION_SHARE : allot.get(bucket)! / cards
  const totals = new Map<string, number>()
  for (const c of pool) totals.set(bucketOf(c), (totals.get(bucketOf(c)) ?? 0) + c.weight)
  if (totals.size < 2) return pool
  const shareSum = [...totals.keys()].reduce((sum, b) => sum + share(b), 0)

  return pool.map((c) => {
    const b = bucketOf(c)
    return { ...c, weight: (c.weight / totals.get(b)!) * (share(b) / shareSum) }
  })
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

  if (config.mode === 'smart') {
    return smartQueue(cells, config.size).map((c) => makeCard(c.verb, c.tense, c.person))
  }

  let size = config.size
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
