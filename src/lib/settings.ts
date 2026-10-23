import { IRREGULAR_INFINITIVES } from '../data/verbs'
import type { Tense } from '../types'

export const SETTINGS_KEY = 'tiempos.settings.v1'

export interface SetupSettings {
  selected: Record<Tense, boolean>
  includeRegular: boolean
  includeIrregular: boolean
  /** Чекбоксы неправильных глаголов: infinitive → выбран. */
  selectedIrregular: Record<string, boolean>
  size: number
}

export function defaultSelectedIrregular(
  infinitives: string[] = IRREGULAR_INFINITIVES,
): Record<string, boolean> {
  return Object.fromEntries(infinitives.map((inf) => [inf, true]))
}

export const DEFAULT_SETTINGS: SetupSettings = {
  selected: {
    presente: true,
    indefinido: true,
    imperfecto: true,
  },
  includeRegular: true,
  includeIrregular: true,
  selectedIrregular: defaultSelectedIrregular(),
  size: 20,
}

const SIZES = new Set([10, 20, 30])

function isBool(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function parseSelected(raw: unknown): Record<Tense, boolean> {
  const base = { ...DEFAULT_SETTINGS.selected }
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  for (const tense of Object.keys(base) as Tense[]) {
    if (isBool(obj[tense])) base[tense] = obj[tense]
  }
  return base
}

/**
 * Актуальный список неправильных из банка.
 * Новые глаголы → true; сохранённые снятые галки сохраняются.
 */
export function mergeSelectedIrregular(
  saved: unknown,
  infinitives: string[] = IRREGULAR_INFINITIVES,
): Record<string, boolean> {
  const result = defaultSelectedIrregular(infinitives)
  if (!saved || typeof saved !== 'object') return result
  const obj = saved as Record<string, unknown>
  for (const inf of infinitives) {
    if (isBool(obj[inf])) result[inf] = obj[inf]
  }
  return result
}

function cloneDefaults(): SetupSettings {
  return {
    ...DEFAULT_SETTINGS,
    selected: { ...DEFAULT_SETTINGS.selected },
    selectedIrregular: defaultSelectedIrregular(),
  }
}

export function loadSettings(): SetupSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return cloneDefaults()
    const parsed = JSON.parse(raw) as Partial<SetupSettings>
    return {
      selected: parseSelected(parsed.selected),
      includeRegular: isBool(parsed.includeRegular)
        ? parsed.includeRegular
        : DEFAULT_SETTINGS.includeRegular,
      includeIrregular: isBool(parsed.includeIrregular)
        ? parsed.includeIrregular
        : DEFAULT_SETTINGS.includeIrregular,
      selectedIrregular: mergeSelectedIrregular(parsed.selectedIrregular),
      size:
        typeof parsed.size === 'number' && SIZES.has(parsed.size)
          ? parsed.size
          : DEFAULT_SETTINGS.size,
    }
  } catch {
    return cloneDefaults()
  }
}

export function saveSettings(settings: SetupSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function selectedIrregularList(
  map: Record<string, boolean>,
): string[] {
  return Object.keys(map).filter((inf) => map[inf])
}
