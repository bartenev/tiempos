import { describe, expect, it } from 'vitest'
import { decide } from '../lib/articles/algorithm'
import legacy from './articles/__fixtures__/trainer-v2.json'
import { ARTICLE_EXERCISES, ARTICLE_ITEMS, ARTICLE_SOURCES } from './articles'

/** Задание в формате старой страницы public/articulos (как его собирал espanol/scripts/build-trainer.mjs). */
interface LegacyItem {
  id: string
  b: string
  ex: string
  sec: string
  ctx?: string
  pre: string
  post: string
  acc: string[]
  ans: string
  opt?: string[]
  path: string[]
  why?: string
  cat: string
  alt?: string
  jud?: string
}

const legacyItems = (legacy as { items: LegacyItem[] }).items

function asLegacy(item: (typeof ARTICLE_ITEMS)[number]): LegacyItem {
  // JSON-круг убирает undefined — как в эталоне
  return JSON.parse(
    JSON.stringify({
      id: item.id,
      b: item.book,
      ex: item.exercise,
      sec: item.section,
      ctx: item.context,
      pre: item.before,
      post: item.after,
      acc: item.accept,
      ans: item.answer,
      opt: item.options,
      path: item.path,
      why: item.why,
      cat: item.category,
      alt: item.alt,
      jud: item.judgment,
    }),
  ) as LegacyItem
}

describe('articles data', () => {
  it('keeps every blank of both textbooks', () => {
    expect(ARTICLE_ITEMS).toHaveLength(527)
    expect(ARTICLE_ITEMS.filter((i) => i.book === 'GBE')).toHaveLength(162)
    expect(ARTICLE_ITEMS.filter((i) => i.book === 'GDU')).toHaveLength(365)
    expect(new Set(ARTICLE_ITEMS.map((i) => i.id)).size).toBe(527)
  })

  it('matches the old trainer page item for item: sentence, answers, rule path', () => {
    expect(ARTICLE_ITEMS.map(asLegacy)).toEqual(legacyItems)
  })

  it('keeps the exercise list with instructions', () => {
    const old = (legacy as { exercises: { b: string; ex: string; sec: string; ins: string }[] }).exercises
    expect(ARTICLE_EXERCISES.map((e) => ({ b: e.book, ex: e.number, sec: e.section, ins: e.instruction }))).toEqual(old)
    for (const e of ARTICLE_EXERCISES) expect(e.page).toBeGreaterThan(0)
  })

  it('the algorithm agrees with the textbook key on every blank', () => {
    // buildArticles бросает ошибку при первом расхождении — здесь ещё раз, явно, по каждому заданию
    const low = (s: string) => (s === 'Ø' ? s : s.toLowerCase())
    for (const source of ARTICLE_SOURCES) {
      for (const item of ARTICLE_ITEMS.filter((i) => i.book === source.book)) {
        const base = source.annotations.blanks[item.id] ?? source.annotations.items?.[item.id] ?? source.annotations.phrases?.[item.id]
        expect(base, item.id).toBeDefined()
        const features = { ...base, ...source.overlay.blanks[item.id] }
        if (features.noun === undefined) {
          // слово после пропуска — как подставляет сборка
          const next = item.after.trim().split(/\s+/)[0]?.replace(/[.,;:!?¡¿“”"()]/g, '').toLowerCase()
          if (next && source.annotations.blanks[item.id]) features.noun = next
        }
        const r = decide(features)
        expect(item.accept.includes(low(r.surface)) || item.accept.includes(low(r.article)), item.id).toBe(true)
      }
    }
  })
})
