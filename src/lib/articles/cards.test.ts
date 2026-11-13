import { describe, expect, it } from 'vitest'
import { ARTICLE_ITEMS } from '../../data/articles'
import type { ArticleRule } from '../../types'
import { articleCard, articleCount, buildArticleSession, cardsForRules, ruleSize, sourceOf } from './cards'
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
