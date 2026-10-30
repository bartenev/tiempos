import { CHAPTERS } from '../data/book'
import type {
  BookCard,
  BookConfig,
  BookItem,
  BookSet,
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

/** Постоянный ключ: текст упражнения можно править, прогресс не собьётся. */
export function itemKey(set: BookSet, index: number): string {
  return `${set.id}.${index + 1}`
}

/** Прежние ключи прогресса (по тексту упражнения) → новые. */
export function legacyBookKeys(chapters: Chapter[] = CHAPTERS): Record<string, string> {
  const keys: Record<string, string> = {}
  for (const chapter of chapters) {
    for (const set of chapter.sets) {
      set.items.forEach(({ es, prompt }, index) => {
        keys[`${chapter.unit}|${prompt ? `${es}|${prompt}` : es}`] = itemKey(set, index)
      })
    }
  }
  return keys
}

/** Пропуск открывает предложение — ответ покажем с большой буквы. */
function startsSentence(sentence: string): boolean {
  return /(^|[—¿¡]|[.?!] )___/.test(sentence)
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Верные варианты по полям ввода: фраза целиком или выбор — одно поле. */
function blanksOf(item: BookItem): string[][] {
  if (item.kind === 'rewrite') return [item.answers]
  const blanks = item.kind === 'fill' ? item.blanks : [[item.answer]]
  const [first, ...rest] = blanks[0]!
  if (blanks.length > 1 || !startsSentence(item.es)) return blanks
  return [[capitalize(first!), ...rest]]
}

function makeCard(chapter: Chapter, set: BookSet, item: BookItem, index: number): BookCard {
  const blanks = blanksOf(item)
  return {
    type: 'book',
    key: itemKey(set, index),
    unit: chapter.unit,
    task: set.task,
    rule: set.rule,
    bank: set.bank,
    kind: item.kind,
    sentence: item.es,
    translation: item.ru,
    answer: blanks.map(([main]) => main).join('; '),
    blanks,
    cue: item.cue,
    prompt: item.prompt,
    options: item.kind === 'choice' ? shuffle(item.options) : undefined,
    image: item.image,
  }
}

/** Все упражнения главы; порядок — как в наборах главы. */
export function chapterCards(chapter: Chapter): BookCard[] {
  return chapter.sets.flatMap((set) =>
    set.items.map((item, index) => makeCard(chapter, set, item, index)),
  )
}

function chapterKeys(chapter: Chapter): string[] {
  return chapter.sets.flatMap((set) => set.items.map((_, index) => itemKey(set, index)))
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
  for (const key of chapterKeys(chapter)) counts[masteryOf(stats[key])] += 1
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
