import { describe, expect, it } from 'vitest'
import { RULES } from './algorithm'
import type { SchemeNodeId } from './scheme'
import { DEFAULT_SCHEME_FORM, SCHEME, schemeForm } from './scheme'

describe('article scheme', () => {
  it('every option leads to a question or a result with a known rule', () => {
    for (const [id, node] of Object.entries(SCHEME)) {
      for (const option of node.opts) {
        if (option.next) expect(SCHEME[option.next], `${id} → ${option.next}`).toBeDefined()
        else expect(option.res, `${id}: ${option.l}`).toBeDefined()
        if (option.rule) expect(RULES[option.rule], option.rule).toBeDefined()
        if (option.set?.z) expect(RULES[option.set.z]).toBeDefined()
      }
    }
  })

  it('every question is reachable from the start', () => {
    const seen = new Set<SchemeNodeId>(['start'])
    const queue: SchemeNodeId[] = ['start']
    while (queue.length) {
      for (const option of SCHEME[queue.shift()!].opts) {
        if (option.next && !seen.has(option.next)) {
          seen.add(option.next)
          queue.push(option.next)
        }
      }
    }
    expect([...seen].sort()).toEqual(Object.keys(SCHEME).sort())
  })

  it('builds the form like the algorithm', () => {
    expect(schemeForm('def', DEFAULT_SCHEME_FORM).article).toBe('el')
    expect(schemeForm('def', { ...DEFAULT_SCHEME_FORM, g: 'f', at: true }).article).toBe('el')
    expect(schemeForm('indef', { ...DEFAULT_SCHEME_FORM, g: 'f', n: 'pl' }).article).toBe('unas')
    expect(schemeForm('indef', { ...DEFAULT_SCHEME_FORM, omit: true }).article).toBe('uno')
    expect(schemeForm('def', { ...DEFAULT_SCHEME_FORM, prep: 'de' }).article).toBe('del')
  })
})
