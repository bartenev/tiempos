import { beforeEach, describe, expect, it } from 'vitest'
import { collectData, exportFileName, exportJson } from './backup'

describe('backup', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('collects every tiempos.* key, parsing JSON values', () => {
    localStorage.setItem('tiempos.stats.v1', JSON.stringify({ 'hablar|presente|yo': { ok: 1, bad: 0, streak: 1, last: 5 } }))
    localStorage.setItem('tiempos.theme', 'dark')
    localStorage.setItem('other.app', '1')
    const now = new Date(2026, 10, 24, 9, 5)
    const dump = collectData('1.20.0', now)
    expect(dump).toEqual({
      app: 'tiempos',
      version: '1.20.0',
      exportedAt: now.toISOString(),
      data: {
        'tiempos.stats.v1': { 'hablar|presente|yo': { ok: 1, bad: 0, streak: 1, last: 5 } },
        'tiempos.theme': 'dark',
      },
    })
    expect(JSON.parse(exportJson('1.20.0', now))).toEqual(dump)
  })

  it('names the file by the local date', () => {
    expect(exportFileName(new Date(2026, 0, 5))).toBe('tiempos-2026-01-05.json')
  })
})
