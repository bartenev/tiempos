import { describe, expect, it } from 'vitest'
import type { Verb } from '../types'
import { TENSES, personsFor } from '../types'
import { conjugate } from './conjugate'
import { endingsRow } from './tables'

const EXAMPLES: Verb[] = [
  { infinitive: 'hablar', group: 'ar' },
  { infinitive: 'comer', group: 'er' },
  { infinitive: 'vivir', group: 'ir' },
]

function shared(tense: Parameters<typeof endingsRow>[1], person: Parameters<typeof endingsRow>[2]) {
  return endingsRow(EXAMPLES, tense, person).map((c) => c.shared)
}

describe('endingsRow', () => {
  it('imperfecto: -er and -ir share the ending, -ar does not', () => {
    const row = endingsRow(EXAMPLES, 'imperfecto', 'yo')
    expect(row).toEqual([
      { stem: 'habl', ending: 'aba', shared: false },
      { stem: 'com', ending: 'ía', shared: true },
      { stem: 'viv', ending: 'ía', shared: true },
    ])
  })

  it('presente: yo «-o» is shared by all three, nosotros differs everywhere', () => {
    expect(shared('presente', 'yo')).toEqual([true, true, true])
    expect(shared('presente', 'tú')).toEqual([false, true, true])
    expect(shared('presente', 'nosotros')).toEqual([false, false, false])
  })

  it('imperativo: vosotros -ed / -id differ', () => {
    expect(shared('imperativo', 'vosotros')).toEqual([false, false, false])
    expect(shared('imperativo', 'tú')).toEqual([false, true, true])
  })

  it('stem + ending always rebuilds the form', () => {
    for (const tense of TENSES) {
      for (const person of personsFor(tense)) {
        endingsRow(EXAMPLES, tense, person).forEach((cell, i) => {
          expect(cell.stem + cell.ending).toBe(conjugate(EXAMPLES[i]!, tense, person))
        })
      }
    }
  })
})
