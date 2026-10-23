import { ref } from 'vue'

export type Theme = 'light' | 'dark'

export const THEME_KEY = 'tiempos.theme'

/** Реактивная тема — UI и heat-цвета подписаны на неё. */
export const theme = ref<Theme>('light')

export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw === 'dark' || raw === 'light') return raw
  } catch {
    /* ignore */
  }
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }
  return 'light'
}

const THEME_COLORS: Record<Theme, string> = {
  light: '#f6f3ee',
  dark: '#121816',
}

export function applyTheme(value: Theme): void {
  document.documentElement.dataset.theme = value
  // Цвет статус-бара на телефоне — под выбранную тему, а не системную.
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute('content', THEME_COLORS[value])
  }
}

export function initTheme(): Theme {
  theme.value = loadTheme()
  applyTheme(theme.value)
  return theme.value
}

export function setTheme(value: Theme): void {
  theme.value = value
  localStorage.setItem(THEME_KEY, value)
  applyTheme(value)
}

export function toggleTheme(): Theme {
  const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

export function isDarkTheme(): boolean {
  return theme.value === 'dark'
}
