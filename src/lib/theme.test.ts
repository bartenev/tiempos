import { beforeEach, describe, expect, it } from 'vitest'
import { THEME_KEY, initTheme, loadTheme, setTheme, toggleTheme, theme } from './theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  theme.value = 'light'
})

describe('theme', () => {
  it('defaults to light when nothing stored', () => {
    expect(loadTheme()).toBe('light')
  })

  it('persists and applies theme', () => {
    setTheme('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(theme.value).toBe('dark')
  })

  it('toggles light ↔ dark', () => {
    setTheme('light')
    expect(toggleTheme()).toBe('dark')
    expect(toggleTheme()).toBe('light')
  })

  it('initTheme restores saved value', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    expect(initTheme()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
