import { describe, expect, it } from 'vitest'
import { ARTICLE_ALLOWED, ARTICLE_ITEMS } from '../../data/articles'
import type { ArticleRule } from '../../types'
import situations from '../../data/articles/situations.json'
import translations from '../../data/articles/translations.json'
import { briefOf } from './brief'
import {
  ARTICLE_PAD,
  articleCard,
  articleCount,
  buildArticleSession,
  cardsForRules,
  fullSentence,
  ruleSize,
  sourceOf,
  translationOf,
} from './cards'
import { ARTICLE_RULES, ARTICLE_TOPICS, rulesOf } from './topics'

const byId = (id: string) => ARTICLE_ITEMS.find((i) => i.id === id)!

describe('article topics', () => {
  it('every item gets a main rule', () => {
    for (const item of ARTICLE_ITEMS) expect(rulesOf(item).length, item.id).toBeGreaterThan(0)
  })

  it('every rule has items', () => {
    for (const rule of ARTICLE_RULES) expect(ruleSize(rule), rule).toBeGreaterThan(0)
  })

  it('all rules cover all items', () => {
    expect(articleCount(ARTICLE_RULES)).toBe(527)
  })

  it('tags form rules on top of the main one', () => {
    const omitted = ARTICLE_ITEMS.find((i) => i.path.includes('E.def-sin-sust') && i.path[0] === 'B.I')!
    expect(rulesOf(omitted)).toEqual(['unique', 'no-noun'])
    const contracted = ARTICLE_ITEMS.find((i) => i.path.includes('A.contraccion'))!
    expect(rulesOf(contracted)).toContain('contraction')
  })

  it('topics list each rule once', () => {
    const rules = ARTICLE_TOPICS.flatMap((t) => t.rules.map((r) => r.rule))
    expect(new Set(rules).size).toBe(rules.length)
  })
})

describe('article cards', () => {
  it('keeps the textbook sentence and key', () => {
    const item = byId('GBE5-04.5#2')
    const card = articleCard(item)
    expect(card.sentence).toBe(`${item.before}___${item.after}`)
    expect(card.blanks).toEqual([['un']])
    expect(card.deck).toBe('articles')
    expect(card.key).toBe('GBE5-04.5#2')
    expect(card.optionGroups?.flat()).toContain('Ø')
  })

  it('capitalizes the answer at the start of a sentence', () => {
    const item = ARTICLE_ITEMS.find((i) => i.before === '' && i.accept[0] !== 'Ø')!
    const card = articleCard(item)
    expect(card.blanks[0]![0]).toBe(card.blanks[0]![0]!.charAt(0).toUpperCase() + card.blanks[0]![0]!.slice(1))
  })

  it('points to the textbook', () => {
    expect(sourceOf(byId('GBE5-04.5#2'))).toMatch(/^Gramática básica del estudiante, гл\. 5, раздел B, упр\. 4, п\. 5, с\. \d+ · GBE5-04\.5#2$/)
    expect(sourceOf(ARTICLE_ITEMS.find((i) => i.book === 'GDU')!)).toMatch(/^Gramática de uso A1-B2, юнит 4, упр\. 4\.1, п\. \d+, с\. 17/)
  })

  it('no sentence breaks the blank marker', () => {
    for (const item of ARTICLE_ITEMS) expect(`${item.before}${item.after}`, item.id).not.toContain('___')
  })

  it('filters by rule', () => {
    const rules: ArticleRule[] = ['hours']
    const cards = cardsForRules(rules)
    expect(cards.length).toBe(ruleSize('hours'))
    expect(cards.every((c) => c.label === 'Время')).toBe(true)
  })

  it('builds a session of the requested size', () => {
    const cards = buildArticleSession({ rules: ARTICLE_RULES, size: 20, mode: 'smart', answer: 'text' }, {})
    expect(cards).toHaveLength(20)
    expect(new Set(cards.map((c) => c.key)).size).toBe(20)
  })

  it('needs at least one rule', () => {
    expect(() => buildArticleSession({ rules: [], size: 20, mode: 'smart', answer: 'text' }, {})).toThrow()
  })
})

describe('article translations and short explanations', () => {
  it('every sentence has a Russian translation', () => {
    const missing = ARTICLE_ITEMS.filter((i) => translationOf(i) === '').map((i) => i.id)
    expect(missing).toEqual([])
  })

  it('no translation is left without a sentence', () => {
    const used = new Set(ARTICLE_ITEMS.map(fullSentence))
    const stale = Object.keys(translations.sentences).filter(
      (es) => !used.has(es.replace(/\s+/g, ' ').trim().toLowerCase()),
    )
    expect(stale).toEqual([])
  })

  it('every item has a short explanation that ends with the answer', () => {
    for (const item of ARTICLE_ITEMS) {
      const brief = briefOf(item)
      expect(brief, item.id).toMatch(/^\S.* → \S.*\.$/)
      // без служебных пометок разметки
      expect(brief, item.id).not.toMatch(/^(I{1,3} →|[ab]: |п\.\d+ →)/i)
      expect(brief, item.id).not.toMatch(/^ →/)
    }
    expect(briefOf(byId('GBE5-04.5#2'))).toBe('Часов в доме несколько → un.')
  })
})

describe('article button sets from the textbook instruction', () => {
  it('the key is always among the enabled buttons', () => {
    const pad = ARTICLE_PAD.flat()
    for (const [exercise, allowed] of Object.entries(ARTICLE_ALLOWED)) {
      for (const rule of allowed) expect(pad, exercise).toContain(rule)
      const items = ARTICLE_ITEMS.filter((i) => `${i.book} ${i.exercise}` === exercise)
      expect(items.length, exercise).toBeGreaterThan(0)
      for (const item of items) {
        const card = articleCard(item)
        expect(card.allowed, item.id).toEqual(allowed)
        expect(item.accept.some((a) => allowed.includes(a)), item.id).toBe(true)
      }
    }
  })

  it('other exercises keep every button', () => {
    expect(articleCard(byId('GBE5-04.5#2')).allowed).toBeUndefined()
    expect(articleCard(ARTICLE_ITEMS.find((i) => i.options)!).allowed).toBeUndefined()
  })
})

describe('article situations', () => {
  it('shows a situation only where the answer depends on it', () => {
    const shown = ARTICLE_ITEMS.filter((i) => articleCard(i).context)
    expect(shown.length).toBe(83)
    for (const item of shown) expect(situations.exercises, item.id).toContain(`${item.book} ${item.exercise}`)
    for (const item of ARTICLE_ITEMS) expect(articleCard(item).task, item.id).toBe('')
  })

  it('every situation is translated, except dialogue questions', () => {
    for (const item of ARTICLE_ITEMS.filter((i) => situations.exercises.includes(`${i.book} ${i.exercise}`))) {
      expect(item.context, item.id).toBeTruthy()
      if (item.exercise !== '11.2') expect(Object.keys(situations.situations), item.id).toContain(item.context)
    }
    const used = new Set(ARTICLE_ITEMS.map((i) => i.context))
    expect(Object.keys(situations.situations).filter((k) => !used.has(k))).toEqual([])
  })
})
