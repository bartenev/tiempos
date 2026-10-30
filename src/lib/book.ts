import { CHAPTERS } from '../data/book'
import type {
  BookCard,
  BookConfig,
  BookItem,
  BookItemKind,
  BookSet,
  BookTag,
  Chapter,
} from '../types'
import { shuffle } from './session'
import type { Mastery, StatsStore } from './stats'
import { cellWeight, isWeak, loadBookStats, masteryOf } from './stats'

/** Умная очередь: доля новых упражнений и места, гарантированные слабым. */
const NEW_SHARE = 0.6
const WEAK_SHARE = 1 / 3

export function chapterOf(unit: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.unit === unit)
}

export function unitsWithTag(tag: BookTag, chapters: Chapter[] = CHAPTERS): number[] {
  return chapters.filter((c) => c.tags.includes(tag)).map((c) => c.unit)
}

/** Постоянный ключ: порядок упражнений можно менять, прогресс не собьётся. */
export function itemKey(unit: number, item: BookItem): string {
  const id = item.prompt ? `${item.es}|${item.prompt}` : item.es
  return `${unit}|${id}`
}

/** Пропуск открывает предложение — ответ покажем с большой буквы. */
function startsSentence(sentence: string): boolean {
  return /(^|[—¿¡]|[.?!] )___/.test(sentence)
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function resolveKind(item: BookItem): BookItemKind {
  if (item.kind) return item.kind
  if (item.options?.length) return 'choice'
  if (item.es.includes('___')) return 'fill'
  return 'rewrite'
}

/** Все принятые ответы: основной, also, и перестановки регистра для fill. */
function acceptedOf(item: BookItem): string[] {
  const primary = item.answers?.join('; ') ?? item.answer
  const variants = [primary, item.answer, ...(item.also ?? [])]
  return [...new Set(variants.filter(Boolean))]
}

function displayAnswer(item: BookItem): string {
  const raw = item.answers?.join('; ') ?? item.answer
  if (item.answers || resolveKind(item) === 'rewrite' || resolveKind(item) === 'match') return raw
  if (item.es.includes('___') && startsSentence(item.es)) return capitalize(raw)
  return raw
}

function makeCard(chapter: Chapter, set: BookSet, item: BookItem): BookCard {
  const kind = resolveKind(item)
  return {
    key: itemKey(chapter.unit, item),
    unit: chapter.unit,
    task: set.task,
    rule: set.rule,
    bank: set.bank,
    kind,
    sentence: item.es,
    translation: item.ru,
    answer: displayAnswer(item),
    accepted: acceptedOf(item),
    answers: item.answers,
    cue: item.cue,
    prompt: item.prompt,
    options: item.options && shuffle(item.options),
    image: item.image,
  }
}

/** Все упражнения главы; порядок — как в наборах главы. */
export function chapterCards(chapter: Chapter): BookCard[] {
  return chapter.sets.flatMap((set) => set.items.map((item) => makeCard(chapter, set, item)))
}

export function chapterSize(chapter: Chapter): number {
  return chapter.sets.reduce((sum, set) => sum + set.items.length, 0)
}

export function cardsForUnits(units: number[], chapters: Chapter[] = CHAPTERS): BookCard[] {
  return chapters.filter((c) => units.includes(c.unit)).flatMap(chapterCards)
}

export function bookWeakCount(units: number[], stats: StatsStore = loadBookStats()): number {
  return cardsForUnits(units).filter((c) => isWeak(stats[c.key])).length
}

export type ChapterProgress = Record<Mastery, number>

export function chapterProgress(
  chapter: Chapter,
  stats: StatsStore = loadBookStats(),
): ChapterProgress {
  const counts: ChapterProgress = { new: 0, weak: 0, learning: 0, solid: 0 }
  for (const card of chapterCards(chapter)) counts[masteryOf(stats[card.key])] += 1
  return counts
}

/** Взвешенная выборка без повторов: чем выше вес, тем раньше попадёт. */
function pickWeighted(cards: BookCard[], stats: StatsStore, size: number): BookCard[] {
  const pool = [...cards]
  const out: BookCard[] = []
  while (out.length < size && pool.length > 0) {
    const weights = pool.map((c) => cellWeight(stats[c.key]))
    let r = Math.random() * weights.reduce((sum, w) => sum + w, 0)
    let chosen = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i]!
      if (r <= 0) {
        chosen = i
        break
      }
    }
    out.push(...pool.splice(chosen, 1))
  }
  return out
}

/**
 * Умная очередь: слабым — до трети сессии (сначала с большим числом ошибок),
 * новое — по порядку глав, так что глава проходится целиком,
 * остальное — повторение, выученное всё реже.
 */
function smartCards(cards: BookCard[], stats: StatsStore, size: number): BookCard[] {
  const fresh = cards.filter((c) => !stats[c.key])
  const weak = shuffle(cards.filter((c) => isWeak(stats[c.key]))).sort(
    (a, b) => stats[b.key]!.bad - stats[a.key]!.bad,
  )
  const seen = cards.filter((c) => stats[c.key] && !isWeak(stats[c.key]))

  const picked = weak.slice(0, Math.ceil(size * WEAK_SHARE))
  // внутри главы упражнения вперемешку, сами главы — по порядку
  const units = [...new Set(fresh.map((c) => c.unit))]
  const ordered = units.flatMap((unit) => shuffle(fresh.filter((c) => c.unit === unit)))
  const newSlots = Math.min(size - picked.length, Math.ceil(size * NEW_SHARE))
  picked.push(...ordered.slice(0, newSlots))
  picked.push(...pickWeighted(seen, stats, size - picked.length))

  // не хватило повторения — добираем тем, что осталось
  if (picked.length < size) {
    const taken = new Set(picked.map((c) => c.key))
    const rest = [...weak, ...ordered].filter((c) => !taken.has(c.key))
    picked.push(...rest.slice(0, size - picked.length))
  }
  return shuffle(picked)
}

export function buildBookSession(
  config: BookConfig,
  stats: StatsStore = loadBookStats(),
): BookCard[] {
  if (config.units.length === 0) throw new Error('Выберите хотя бы одну главу')
  const cards = cardsForUnits(config.units)
  if (config.mode === 'weak') {
    const weak = cards.filter((c) => isWeak(stats[c.key]))
    if (weak.length === 0) throw new Error('Слабых упражнений в выбранных главах нет')
    return shuffle(weak).slice(0, config.size)
  }
  if (config.mode === 'random') return shuffle(cards).slice(0, config.size)
  return smartCards(cards, stats, config.size)
}

/** Та же карточка ещё раз — повтор после ошибки. */
export function retryBookCard(card: BookCard): BookCard {
  return { ...card, options: card.options && shuffle(card.options), retry: true }
}
