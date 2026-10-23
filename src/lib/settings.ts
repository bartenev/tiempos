import { IRREGULAR_INFINITIVES } from '../data/verbs'
import type { AnswerMode, Person, SessionConfig, SessionMode, Tense, VerbGroup } from '../types'
import { PERSONS, VERB_GROUPS } from '../types'

export const SETTINGS_KEY = 'tiempos.settings.v1'

export interface SetupSettings {
  selected: Record<Tense, boolean>
  /** Чекбоксы местоимений. */
  persons: Record<Person, boolean>
  /** Чекбоксы спряжений -ar / -er / -ir. */
  groups: Record<VerbGroup, boolean>
  includeRegular: boolean
  includeIrregular: boolean
  /** Чекбоксы неправильных глаголов: infinitive → выбран. */
  selectedIrregular: Record<string, boolean>
  size: number
  mode: SessionMode
  answer: AnswerMode
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
    imperativo: true,
  },
  persons: {
    yo: true,
    tú: true,
    él: true,
    nosotros: true,
    vosotros: true,
    ellos: true,
  },
  groups: {
    ar: true,
    er: true,
    ir: true,
  },
  includeRegular: true,
  includeIrregular: true,
  selectedIrregular: defaultSelectedIrregular(),
  size: 20,
  mode: 'smart',
  answer: 'text',
}

const SIZES = new Set([10, 20, 30])

const MODES = new Set<SessionMode>(['smart', 'weak', 'random'])

const ANSWERS = new Set<AnswerMode>(['text', 'oral'])

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

function parsePersons(raw: unknown): Record<Person, boolean> {
  const base = { ...DEFAULT_SETTINGS.persons }
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  for (const person of PERSONS) {
    if (isBool(obj[person])) base[person] = obj[person]
  }
  return base
}

function parseGroups(raw: unknown): Record<VerbGroup, boolean> {
  const base = { ...DEFAULT_SETTINGS.groups }
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  for (const group of VERB_GROUPS) {
    if (isBool(obj[group])) base[group] = obj[group]
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
    persons: { ...DEFAULT_SETTINGS.persons },
    groups: { ...DEFAULT_SETTINGS.groups },
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
      persons: parsePersons(parsed.persons),
      groups: parseGroups(parsed.groups),
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
      mode:
        typeof parsed.mode === 'string' && MODES.has(parsed.mode)
          ? parsed.mode
          : DEFAULT_SETTINGS.mode,
      answer:
        typeof parsed.answer === 'string' && ANSWERS.has(parsed.answer)
          ? parsed.answer
          : DEFAULT_SETTINGS.answer,
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

export function configFromSettings(
  settings: SetupSettings,
  overrides: Partial<SessionConfig> = {},
): SessionConfig {
  return {
    tenses: (Object.keys(settings.selected) as Tense[]).filter(
      (t) => settings.selected[t],
    ),
    persons: PERSONS.filter((p) => settings.persons[p]),
    groups: VERB_GROUPS.filter((g) => settings.groups[g]),
    size: settings.size,
    mode: settings.mode,
    answer: settings.answer,
    includeRegular: settings.includeRegular,
    includeIrregular: settings.includeIrregular,
    selectedIrregular: settings.includeIrregular
      ? selectedIrregularList(settings.selectedIrregular)
      : [],
    ...overrides,
  }
}
