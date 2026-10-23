import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ListenState } from './speech'
import { MAX_ALTERNATIVES, createListener, isSpeechSupported } from './speech'
import { FakeRecognition, installFakeRecognition, removeFakeRecognition } from './speech.fake'

beforeEach(() => {
  vi.useFakeTimers()
  installFakeRecognition()
})

afterEach(() => {
  vi.useRealTimers()
  removeFakeRecognition()
})

function setup() {
  const results: string[][] = []
  const states: ListenState[] = []
  const listener = createListener({
    onResult: (alts) => results.push(alts),
    onState: (s) => states.push(s),
  })
  return { listener, results, states }
}

describe('createListener', () => {
  it('configures Spanish recognition with several alternatives', () => {
    const { listener, states } = setup()
    listener.start()
    const rec = FakeRecognition.last
    expect(isSpeechSupported()).toBe(true)
    expect(rec.lang).toBe('es-ES')
    expect(rec.maxAlternatives).toBe(MAX_ALTERNATIVES)
    expect(rec.continuous).toBe(false)
    expect(rec.started).toBe(true)
    expect(states).toEqual(['listening'])
  })

  it('passes alternatives and keeps listening without a tap', () => {
    const { listener, results } = setup()
    listener.start()
    FakeRecognition.last.say(' hablo ', 'habló')
    expect(results).toEqual([['hablo', 'habló']])
    vi.advanceTimersByTime(200)
    expect(FakeRecognition.instances).toHaveLength(2)
    expect(FakeRecognition.last.started).toBe(true)
  })

  it('restarts after silence (no-speech is not an error)', () => {
    const { listener, states } = setup()
    listener.start()
    FakeRecognition.last.fail('no-speech')
    vi.advanceTimersByTime(200)
    expect(FakeRecognition.instances).toHaveLength(2)
    expect(states).not.toContain('denied')
  })

  it('stops on denied microphone and can be started again', () => {
    const { listener, states } = setup()
    listener.start()
    FakeRecognition.last.fail('not-allowed')
    vi.advanceTimersByTime(500)
    expect(FakeRecognition.instances).toHaveLength(1)
    expect(states.at(-1)).toBe('denied')
    listener.start()
    expect(FakeRecognition.instances).toHaveLength(2)
  })

  it('stop() aborts and does not restart', () => {
    const { listener, states } = setup()
    listener.start()
    listener.stop()
    vi.advanceTimersByTime(500)
    expect(FakeRecognition.last.aborted).toBe(true)
    expect(FakeRecognition.instances).toHaveLength(1)
    expect(states.at(-1)).toBe('paused')
  })

  it('reports unsupported browsers', () => {
    removeFakeRecognition()
    const { listener, states } = setup()
    listener.start()
    expect(isSpeechSupported()).toBe(false)
    expect(states).toEqual(['unsupported'])
  })
})
