import { describe, expect, it } from 'vitest'
import { PERSONS, type Tense } from '../types'
import { FRAMES, framesFor } from './frames'

const TENSES: Tense[] = ['presente', 'indefinido', 'imperfecto']

describe('FRAMES', () => {
  it('covers every tense × person pair', () => {
    for (const tense of TENSES) {
      for (const person of PERSONS) {
        const list = framesFor(tense, person)
        expect(list.length, `${tense}/${person}`).toBeGreaterThan(0)
      }
    }
  })

  it('every template contains a single ___ gap', () => {
    for (const frame of FRAMES) {
      const count = frame.template.split('___').length - 1
      expect(count, frame.template).toBe(1)
      expect(frame.translation.length).toBeGreaterThan(0)
    }
  })
})
