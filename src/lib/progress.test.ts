import { beforeEach, describe, expect, it } from 'vitest'
import {
  PROGRESS_KEY,
  createEmptyProgress,
  getScore,
  heatByPerson,
  heatColor,
  loadProgress,
  mergeProgress,
  recordCorrect,
  recordWrong,
  saveProgress,
  sumByTensePerson,
} from './progress'

const zeros = {
  yo: 0,
  tú: 0,
  él: 0,
  nosotros: 0,
  vosotros: 0,
  ellos: 0,
}

beforeEach(() => {
  localStorage.clear()
})

describe('createEmptyProgress', () => {
  it('puts zeros for every tense × person of each verb', () => {
    const store = createEmptyProgress(['hablar', 'ser'])
    expect(store.hablar?.presente).toEqual(zeros)
    expect(store.hablar?.indefinido).toEqual(zeros)
    expect(store.ser?.imperfecto).toEqual(zeros)
  })
})

describe('mergeProgress', () => {
  it('keeps known scores and fills missing verbs with zeros', () => {
    const merged = mergeProgress({
      hablar: {
        presente: { ...zeros, yo: 3, tú: 1 },
        indefinido: { ...zeros, él: 2 },
        imperfecto: { ...zeros },
      },
      ghost: {
        presente: { ...zeros, yo: 9 },
        indefinido: { ...zeros },
        imperfecto: { ...zeros },
      },
    })
    expect(merged.hablar?.presente.yo).toBe(3)
    expect(merged.hablar?.presente.tú).toBe(1)
    expect(merged.hablar?.indefinido.él).toBe(2)
    expect(merged.comer?.presente).toEqual(zeros)
    expect(merged.ghost).toBeUndefined()
  })

  it('ignores corrupt / legacy flat entries', () => {
    const merged = mergeProgress({
      hablar: { presente: 3, indefinido: 1, imperfecto: 0 },
    })
    expect(merged.hablar?.presente).toEqual(zeros)
  })
})

describe('localStorage progress', () => {
  it('loads empty matrix when nothing stored', () => {
    const store = loadProgress()
    expect(store.hablar?.presente.yo).toBe(0)
    expect(Object.keys(store).length).toBeGreaterThan(40)
  })

  it('increments verb × tense × person on correct answer', () => {
    expect(recordCorrect('hablar', 'presente', 'yo')).toBe(1)
    expect(recordCorrect('hablar', 'presente', 'yo')).toBe(2)
    expect(recordCorrect('hablar', 'presente', 'tú')).toBe(1)
    expect(recordCorrect('hablar', 'indefinido', 'yo')).toBe(1)

    expect(getScore('hablar', 'presente', 'yo')).toBe(2)
    expect(getScore('hablar', 'presente', 'tú')).toBe(1)
    expect(getScore('hablar', 'presente', 'él')).toBe(0)
    expect(getScore('hablar', 'imperfecto', 'yo')).toBe(0)

    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY)!) as {
      hablar: { presente: { yo: number; tú: number } }
    }
    expect(raw.hablar.presente.yo).toBe(2)
    expect(raw.hablar.presente.tú).toBe(1)
  })

  it('decrements regular verbs on wrong, ignores irregulars', () => {
    recordCorrect('hablar', 'presente', 'yo')
    expect(recordWrong('hablar', 'presente', 'yo')).toBe(0)
    expect(recordWrong('hablar', 'presente', 'yo')).toBe(-1)
    expect(recordWrong('ser', 'presente', 'yo')).toBeNull()
    expect(getScore('ser', 'presente', 'yo')).toBe(0)
  })

  it('round-trips via saveProgress', () => {
    const store = createEmptyProgress(['hablar'])
    store.hablar!.presente.nosotros = 5
    saveProgress(store)
    expect(loadProgress().hablar?.presente.nosotros).toBe(5)
  })
})

describe('heat / sums', () => {
  it('sums only regular verbs for tense×person', () => {
    const store = createEmptyProgress()
    store.hablar!.presente.yo = 2
    store.comer!.presente.yo = 3
    store.ser!.presente.yo = 100
    store.pensar!.presente.yo = 50
    store.hablar!.presente.tú = 1
    expect(sumByTensePerson(store, 'presente', 'yo')).toBe(5)
    expect(sumByTensePerson(store, 'presente', 'tú')).toBe(1)
  })

  it('maps best (max) to green and worst (min) to red', () => {
    expect(heatColor(10, 0, 10)).toMatch(/^hsl\(120(\.0)? /)
    expect(heatColor(0, 0, 10)).toMatch(/^hsl\(0(\.0)? /)
    expect(heatColor(5, 5, 5)).toBe('hsl(60 35% 92%)')
  })

  it('heatByPerson colors rows by relative sums of correct answers', () => {
    const store = createEmptyProgress(['hablar', 'comer'])
    store.hablar!.presente.yo = 4
    store.comer!.presente.tú = 1
    const heat = heatByPerson(store, 'presente')
    expect(heat.yo.sum).toBe(4)
    expect(heat.tú.sum).toBe(1)
    expect(heat.él.sum).toBe(0)
    expect(heat.yo.color).toMatch(/^hsl\(120/)
    expect(heat.él.color).toMatch(/^hsl\(0/)
  })
})
