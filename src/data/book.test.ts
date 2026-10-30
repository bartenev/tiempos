import { describe, expect, it } from 'vitest'
import { CHAPTERS, SECTIONS } from './book'

const items = CHAPTERS.flatMap((c) =>
  c.sets.flatMap((set) => set.items.map((item) => ({ unit: c.unit, set, item }))),
)

describe('book data', () => {
  it('chapters go in book order, without repeats', () => {
    const units = CHAPTERS.map((c) => c.unit)
    expect(units).toEqual([...new Set(units)].sort((a, b) => a - b))
  })

  it('every chapter sits in a known section and uses only its tags', () => {
    for (const chapter of CHAPTERS) {
      const section = SECTIONS.find((s) => s.section === chapter.section)
      expect(section, `unit ${chapter.unit}`).toBeDefined()
      const known = section!.tags.map((t) => t.tag)
      for (const tag of chapter.tags) expect(known).toContain(tag)
    }
  })

  it('every tag has at least one chapter', () => {
    for (const { section, tags } of SECTIONS) {
      for (const { tag } of tags) {
        expect(CHAPTERS.some((c) => c.section === section && c.tags.includes(tag))).toBe(true)
      }
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
