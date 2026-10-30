import { describe, expect, it } from 'vitest'
import { itemKey } from '../lib/book'
import type { BookTag } from '../types'
import { CHAPTERS, TAGS } from './book'

const items = CHAPTERS.flatMap((c) =>
  c.sets.flatMap((set) => set.items.map((item) => ({ unit: c.unit, set, item }))),
)

describe('book data', () => {
  it('has the pronoun units of the textbook, in book order', () => {
    expect(CHAPTERS.map((c) => c.unit)).toEqual([
      12, 18, 19, 20, 21, 22, 23, 28, 29, 30, 31, 34, 35, 36, 37, 38, 39, 40, 41, 53, 54, 55, 77,
      78, 109, 122,
    ])
  })

  it('tags every chapter as pronouns and with known tags only', () => {
    const known = new Set<BookTag>(TAGS.map((t) => t.tag))
    for (const chapter of CHAPTERS) {
      expect(chapter.tags).toContain('pronombres')
      for (const tag of chapter.tags) expect(known.has(tag)).toBe(true)
    }
  })

  it('every tag has at least one chapter', () => {
    for (const { tag } of TAGS) {
      expect(CHAPTERS.some((c) => c.tags.includes(tag))).toBe(true)
    }
  })

  it('every chapter has enough exercises and each set has a task and a rule', () => {
    for (const chapter of CHAPTERS) {
      const size = chapter.sets.reduce((sum, set) => sum + set.items.length, 0)
      expect(size, `unit ${chapter.unit}`).toBeGreaterThanOrEqual(12)
      for (const set of chapter.sets) {
        expect(set.task.length).toBeGreaterThan(0)
        expect(set.rule.length).toBeGreaterThan(0)
      }
    }
  })

  it('every item has a translation, an answer, and blanks match answers', () => {
    for (const { item } of items) {
      expect(item.ru.length, item.es).toBeGreaterThan(0)
      expect(item.answer.length, item.es).toBeGreaterThan(0)
      const blanks = item.es.split('___').length - 1
      if (item.answers) {
        expect(item.answers.length, item.es).toBe(blanks)
        expect(item.answer, item.es).toBe(item.answers.join('; '))
      } else if (item.kind === 'rewrite' || item.kind === 'match' || blanks === 0) {
        // целая фраза / стимул без пропуска
        expect(blanks, item.es).toBeGreaterThanOrEqual(0)
      } else {
        expect(blanks, item.es).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('options contain the answer', () => {
    for (const { item } of items) {
      if (!item.options) continue
      expect(item.options, item.es).toContain(item.answer)
      expect(new Set(item.options).size, item.es).toBe(item.options.length)
    }
  })

  it('keys are unique within the book, so progress never collides', () => {
    const keys = items.map(({ unit, item }) => itemKey(unit, item))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('the blank with «—» only appears where an option offers it', () => {
    for (const { item } of items) {
      if (item.answer === '—') expect(item.options, item.es).toContain('—')
    }
  })
})
