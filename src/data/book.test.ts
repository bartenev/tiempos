import { describe, expect, it } from 'vitest'
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

  it('every item has a translation and its blanks match the sentence', () => {
    for (const { item } of items) {
      expect(item.ru.length, item.es).toBeGreaterThan(0)
      const blanks = item.es.split('___').length - 1
      if (item.kind === 'fill') {
        expect(item.blanks.length, item.es).toBe(blanks)
        for (const variants of item.blanks) expect(variants.length, item.es).toBeGreaterThan(0)
      } else {
        expect(blanks, item.es).toBeLessThanOrEqual(1)
      }
      if (item.kind === 'rewrite') expect(item.answers.length, item.es).toBeGreaterThan(0)
    }
  })

  it('options contain the answer', () => {
    for (const { item } of items) {
      if (item.kind !== 'choice') continue
      expect(item.options, item.es).toContain(item.answer)
      expect(new Set(item.options).size, item.es).toBe(item.options.length)
    }
  })

  it('set ids belong to their chapter, so progress keys never collide', () => {
    const ids = CHAPTERS.flatMap((c) => c.sets.map((set) => set.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const chapter of CHAPTERS) {
      for (const { id } of chapter.sets) expect(id).toMatch(new RegExp(`^${chapter.unit}\\.\\d+$`))
    }
  })

  it('every picture exists and every file in public/book is used', () => {
    const used = new Set(items.flatMap(({ item }) => item.image ?? []))
    const files = Object.keys(import.meta.glob('/public/book/*.jpg'))
    expect(files.map((f) => f.replace('/public/', '')).sort()).toEqual([...used].sort())
  })

  it('a multi-blank exercise always asks for at least one word', () => {
    for (const { item } of items) {
      if (item.kind !== 'fill' || item.blanks.length < 2) continue
      expect(item.blanks.some((v) => v[0] !== '—'), item.es).toBe(true)
    }
  })
})
