import { beforeEach, describe, expect, it } from 'vitest'
import type { SavedSession } from './lastSession'
import { LAST_SESSION_KEY, clearLastSession, loadLastSession, saveLastSession } from './lastSession'

const session: SavedSession = {
  track: 'verbs',
  correct: 3,
  wrong: 1,
  skipped: 0,
  bestStreak: 2,
  startedAt: 1000,
  lastAt: 61000,
  mistakes: [{ key: 'hablar|presente|yo', meta: 'hablar · pres. · yo', answer: 'hablo', given: 'habla' }],
}

describe('lastSession', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves, loads and clears', () => {
    saveLastSession(session)
    expect(loadLastSession()).toEqual(session)
    clearLastSession()
    expect(loadLastSession()).toBeNull()
  })

  it('a session without answers has no summary', () => {
    saveLastSession({ ...session, correct: 0, wrong: 0, mistakes: [] })
    expect(loadLastSession()).toBeNull()
  })

  it('ignores broken storage', () => {
    localStorage.setItem(LAST_SESSION_KEY, JSON.stringify({ ...session, track: 'nope' }))
    expect(loadLastSession()).toBeNull()
    localStorage.setItem(LAST_SESSION_KEY, '{oops')
    expect(loadLastSession()).toBeNull()
  })
})
