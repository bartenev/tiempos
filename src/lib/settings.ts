import { IRREGULAR_INFINITIVES } from '../data/verbs'
import type {
  AnswerMode,
  ArticleConfig,
  ArticleRule,
  BookConfig,
  BookSelection,
  Person,
  SessionConfig,
  SessionMode,
  Tense,
  Track,
  VerbGroup,
} from '../types'
import { PERSONS, VERB_GROUPS } from '../types'
import { ARTICLE_RULES } from './articles/topics'
import {
  defaultSelection,
  parseSelection,
  selectedUnits,
  selectionFromTicks,
} from './bookSelection'

export const SETTINGS_KEY = 'tiempos.settings.v1'

/** «Лаборатория»: функции в разработке, которые включают вручную. */
export interface LabsSettings {
  /** Упражнения по главам учебника (тренажёр «Учебник» в списке на главной). */
  book: boolean
  /** Артикли: после ошибки — короткое пояснение своими словами вместо разбора по правилам. */
  briefHints: boolean
}

export interface SetupSettings {
  /** Тренажёр, открытый последним: глаголы, артикли или главы учебника. */
  track: Track
  /** Что выбрано в учебнике: темы или свой список глав. */
  bookSelection: BookSelection
  selected: Record<Tense, boolean>
  /** Чекбоксы местоимений. */
  persons: Record<Person, boolean>
  /** Чекбоксы спряжений -ar / -er / -ir. */
  groups: Record<VerbGroup, boolean>
  includeRegular: boolean
  includeIrregular: boolean
  /** Чекбоксы неправильных глаголов: infinitive → выбран. */
  selectedIrregular: Record<string, boolean>
  /** Чекбоксы правил артиклей. */
  articleRules: Record<ArticleRule, boolean>
  size: number
  mode: SessionMode
  answer: AnswerMode
  /** Карточки глаголов без предложения: только местоимение и глагол с переводом. */
  simpleCards: boolean
  labs: LabsSettings
}

export function defaultSelectedIrregular(
  infinitives: string[] = IRREGULAR_INFINITIVES,
): Record<string, boolean> {
  return Object.fromEntries(infinitives.map((inf) => [inf, true]))
}

export function defaultArticleRules(): Record<ArticleRule, boolean> {
  return Object.fromEntries(ARTICLE_RULES.map((rule) => [rule, true])) as Record<ArticleRule, boolean>
}

export const DEFAULT_SETTINGS: SetupSettings = {
  track: 'verbs',
  bookSelection: defaultSelection(),
  selected: {
    presente: true,
    indefinido: true,
    imperfecto: true,
    perfecto: true,
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
  articleRules: defaultArticleRules(),
  size: 20,
  mode: 'smart',
  answer: 'text',
  simpleCards: false,
  labs: { book: false, briefHints: false },
}

const SIZES = new Set([10, 20, 30])

const MODES = new Set<SessionMode>(['smart', 'weak', 'random'])

const ANSWERS = new Set<AnswerMode>(['text', 'oral'])

const TRACKS = new Set<Track>(['verbs', 'articles', 'book'])

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

function parseLabs(raw: unknown): LabsSettings {
  const base = { ...DEFAULT_SETTINGS.labs }
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  for (const key of Object.keys(base) as (keyof LabsSettings)[]) {
    if (isBool(obj[key])) base[key] = obj[key]
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

/** Новые правила — включены; снятые галки сохраняются. */
function parseArticleRules(raw: unknown): Record<ArticleRule, boolean> {
  const base = defaultArticleRules()
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  for (const rule of ARTICLE_RULES) {
    if (isBool(obj[rule])) base[rule] = obj[rule]
  }
  return base
}

function cloneDefaults(): SetupSettings {
  return {
    ...DEFAULT_SETTINGS,
    bookSelection: defaultSelection(),
    selected: { ...DEFAULT_SETTINGS.selected },
    persons: { ...DEFAULT_SETTINGS.persons },
    groups: { ...DEFAULT_SETTINGS.groups },
    selectedIrregular: defaultSelectedIrregular(),
    articleRules: defaultArticleRules(),
    labs: { ...DEFAULT_SETTINGS.labs },
  }
}

export function loadSettings(): SetupSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return cloneDefaults()
    const parsed = JSON.parse(raw) as Partial<SetupSettings> & { selectedUnits?: unknown }
    const labs = parseLabs(parsed.labs)
    // раньше флаг жил в «Лаборатории» как labs.simpleDrill
    const legacySimple = (parsed.labs as { simpleDrill?: unknown } | undefined)?.simpleDrill
    return {
      // Учебник выключен в «Лаборатории» — тренируем глаголы.
      track:
        typeof parsed.track === 'string' && TRACKS.has(parsed.track) && (parsed.track !== 'book' || labs.book)
          ? parsed.track
          : DEFAULT_SETTINGS.track,
      bookSelection:
        parseSelection(parsed.bookSelection) ??
        selectionFromTicks(parsed.selectedUnits) ??
        defaultSelection(),
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
      articleRules: parseArticleRules(parsed.articleRules),
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
      simpleCards: isBool(parsed.simpleCards)
        ? parsed.simpleCards
        : isBool(legacySimple)
          ? legacySimple
          : DEFAULT_SETTINGS.simpleCards,
      labs,
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

export function bookConfigFromSettings(
  settings: SetupSettings,
  overrides: Partial<BookConfig> = {},
): BookConfig {
  return {
    units: selectedUnits(settings.bookSelection),
    size: settings.size,
    mode: settings.mode,
    answer: settings.answer,
    ...overrides,
  }
}

export function articleConfigFromSettings(
  settings: SetupSettings,
  overrides: Partial<ArticleConfig> = {},
): ArticleConfig {
  return {
    rules: ARTICLE_RULES.filter((rule) => settings.articleRules[rule]),
    size: settings.size,
    mode: settings.mode,
    answer: settings.answer,
    ...overrides,
  }
}

export function configFromSettings(
  settings: SetupSettings,
  overrides: Partial<SessionConfig> = {},
): SessionConfig {
  const irregular = settings.includeIrregular
    ? selectedIrregularList(settings.selectedIrregular)
    : []
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
    // «Неправильные» отмечены, но ни один не выбран — значит, их нет в сессии.
    includeIrregular: settings.includeIrregular && irregular.length > 0,
    selectedIrregular: irregular,
    ...overrides,
  }
}
