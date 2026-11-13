import { ARTICLE_ALLOWED, ARTICLE_BOOKS, ARTICLE_EXERCISES, ARTICLE_ITEMS } from '../../data/articles'
import situations from '../../data/articles/situations.json'
import translations from '../../data/articles/translations.json'
import type { ArticleConfig, ArticleRule, ArticleTopic, BookCard, HintStep } from '../../types'
import { buildDeckSession } from '../book'
import { shuffle } from '../session'
import type { Mastery, StatsStore } from '../stats'
import { isWeak, loadDeckStats, masteryOf } from '../stats'
import { RULES } from './algorithm'
import { briefOf } from './brief'
import type { ArticleItem } from './build'
import { ARTICLE_TOPICS, rulesOf, topicOf } from './topics'

/** Кнопки ответа, если упражнение не даёт своих вариантов: Ø и lo | определённые | неопределённые. */
export const ARTICLE_PAD: string[][] = [
  ['Ø', 'lo'],
  ['el', 'la', 'los', 'las', 'al', 'del'],
  ['un', 'una', 'unos', 'unas', 'uno'],
]

/** Задание и его теги — один раз на всё приложение. */
const TAGGED = ARTICLE_ITEMS.map((item) => ({ item, rules: rulesOf(item) }))

const EXERCISE = new Map(ARTICLE_EXERCISES.map((e) => [`${e.book} ${e.number}`, e]))

/** Предложение целиком, с ответами по ключу, — ключ перевода (регистр и пробелы не важны). */
export function fullSentence(item: ArticleItem): string {
  const answer = item.accept[0] === 'Ø' ? '' : item.accept[0]
  return `${item.before}${answer}${item.after}`.replace(/\s+/g, ' ').trim().toLowerCase()
}

const TRANSLATIONS = new Map(
  Object.entries(translations.sentences).map(([es, ru]) => [es.replace(/\s+/g, ' ').trim().toLowerCase(), ru]),
)

/** Русский перевод предложения (нейтральный — без «один из», «тот самый»). */
export function translationOf(item: ArticleItem): string {
  return TRANSLATIONS.get(fullSentence(item)) ?? ''
}

const SITUATION_EXERCISES = new Set(situations.exercises)
const SITUATIONS: Record<string, string> = situations.situations

/**
 * Ситуация к пункту — только там, где без неё ответ не вывести (детектив, Кармен и Лусия,
 * сказка, «какой смысл», «тот, что…»); по-русски, кроме вопросов диалога. В остальных заданиях — ничего.
 */
export function situationOf(item: ArticleItem): string | undefined {
  if (!item.context || !SITUATION_EXERCISES.has(`${item.book} ${item.exercise}`)) return undefined
  return SITUATIONS[item.context] ?? item.context
}

/** Пропуск открывает предложение — ответ покажем с большой буквы. */
function startsSentence(before: string): boolean {
  return before.trim() === '' || /[.?!—¿¡:]\s*$/.test(before)
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** «Gramática de uso A1-B2, юнит 7, упр. 7.2, п. 5, с. 23 · GDU7-2.5#1». */
export function sourceOf(item: ArticleItem): string {
  const exercise = EXERCISE.get(`${item.book} ${item.exercise}`)
  const point = item.id.split('#')[0]!.split('.').pop()
  const where = item.book === 'GBE' ? `гл. 5, раздел ${item.section}` : `юнит ${item.section}`
  const page = exercise ? `, с. ${exercise.page}` : ''
  return `${ARTICLE_BOOKS[item.book].short}, ${where}, упр. ${item.exercise}, п. ${point}${page} · ${item.id}`
}

/** Путь алгоритма по шагам; главный — первое правило выбора (не формы). */
export function stepsOf(item: ArticleItem): HintStep[] {
  const main = item.path.findIndex((p) => !p.startsWith('A.') && !p.startsWith('E.') && p !== 'D.sujeto')
  return item.path.map((code, i) => {
    const text: string = RULES[code]
    const cut = text.indexOf(': ')
    return {
      source: cut > 0 ? text.slice(0, cut) : '',
      text: cut > 0 ? text.slice(cut + 2) : text,
      main: i === main,
    }
  })
}

function notesOf(item: ArticleItem): string[] {
  const notes: string[] = []
  if (item.why) notes.push(`Почему: ${item.why}.`)
  if (item.alt) {
    notes.push(
      `Спорное место: если понять ситуацию иначе («${item.alt}»), схема даёт другой артикль. Здесь — по ключу учебника.`,
    )
  }
  if (item.judgment) notes.push(`При разметке решал составитель: ${item.judgment}`)
  return notes
}

export function articleCard(item: ArticleItem, rules: ArticleRule[] = rulesOf(item)): BookCard {
  const sentence = `${item.before}___${item.after}`
  const first = startsSentence(item.before)
  const [main, ...rest] = item.accept
  return {
    type: 'book',
    deck: 'articles',
    key: item.id,
    label: topicOf(rules[0]!).label,
    group: `${item.book} ${item.exercise}`,
    // условие упражнения на карточку не выводим: где оно решало, его заменяют ситуация к пункту
    // и заблокированные кнопки; текст условия остаётся в данных (ARTICLE_EXERCISES)
    task: '',
    rule: '',
    kind: 'choice',
    sentence,
    translation: translationOf(item),
    answer: first ? capitalize(item.answer) : item.answer,
    blanks: [first ? [capitalize(main!), ...rest] : item.accept],
    options: item.options && shuffle(item.options),
    optionGroups: item.options ? undefined : ARTICLE_PAD,
    allowed: item.options ? undefined : ARTICLE_ALLOWED[`${item.book} ${item.exercise}`],
    context: situationOf(item),
    steps: stepsOf(item),
    brief: briefOf(item),
    notes: notesOf(item),
    source: sourceOf(item),
  }
}

function taggedFor(rules: ArticleRule[]) {
  return TAGGED.filter((t) => t.rules.some((r) => rules.includes(r)))
}

/** Карточки под выбранные правила; порядок — как в учебниках. */
export function cardsForRules(rules: ArticleRule[]): BookCard[] {
  return taggedFor(rules).map(({ item, rules: tags }) => articleCard(item, tags))
}

/** Сколько заданий под выбранные правила. */
export function articleCount(rules: ArticleRule[]): number {
  return taggedFor(rules).length
}

/** Сколько заданий с этим правилом. */
export function ruleSize(rule: ArticleRule): number {
  return TAGGED.filter((t) => t.rules.includes(rule)).length
}

export function articleWeakCount(
  rules: ArticleRule[],
  stats: StatsStore = loadDeckStats('articles'),
): number {
  return taggedFor(rules).filter(({ item }) => isWeak(stats[item.id])).length
}

export function buildArticleSession(
  config: ArticleConfig,
  stats: StatsStore = loadDeckStats('articles'),
  now: number = Date.now(),
): BookCard[] {
  if (config.rules.length === 0) throw new Error('Выберите хотя бы одно правило')
  return buildDeckSession(cardsForRules(config.rules), config, stats, now, 'Слабых заданий в выбранном нет')
}

export type TopicProgress = Record<Mastery, number>

/** Прогресс по теме: задания, где есть хоть одно её правило. */
export function topicProgress(
  topic: ArticleTopic,
  stats: StatsStore = loadDeckStats('articles'),
): { total: number; counts: TopicProgress } {
  const info = ARTICLE_TOPICS.find((t) => t.topic === topic)!
  const tagged = taggedFor(info.rules.map((r) => r.rule))
  const counts: TopicProgress = { new: 0, weak: 0, learning: 0, solid: 0 }
  for (const { item } of tagged) counts[masteryOf(stats[item.id])] += 1
  return { total: tagged.length, counts }
}
