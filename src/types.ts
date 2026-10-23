export type Tense = 'presente' | 'indefinido' | 'imperfecto'

export type Person = 'yo' | 'tú' | 'él' | 'nosotros' | 'vosotros' | 'ellos'

export type VerbGroup = 'ar' | 'er' | 'ir'

/** Stem change in presente (nosotros/vosotros keep the infinitive stem). */
export type StemChange = 'e>ie' | 'o>ue' | 'e>i' | 'u>ue'

export interface Verb {
  infinitive: string
  group: VerbGroup
  /** Presente stem change for boot verbs. */
  stemChange?: StemChange
  /** Override yo-form in presente (tengo, hago, …). */
  presentYo?: string
  /**
   * Irregular pretérito indefinido stem (tuv-, hic-, …).
   * Uses irregular endings: e, iste, o, imos, isteis, ieron
   * (jeron if stem ends with j).
   */
  indefinidoStem?: string
  /** Full paradigm override for a tense (all 6 persons). */
  forms?: Partial<Record<Tense, Record<Person, string>>>
}

export interface DrillCard {
  verb: Verb
  tense: Tense
  person: Person
  /** Предложение с пропуском `___`. */
  sentence: string
  /** Русский перевод предложения. */
  translation: string
  /** Ожидаемая форма глагола в пропуске. */
  answer: string
}

export interface SessionConfig {
  tenses: Tense[]
  size: number
  /** Включать правильные (регулярные) глаголы. */
  includeRegular: boolean
  /** Включать неправильные глаголы. */
  includeIrregular: boolean
  /** Выбранные неправильные infinitivos (если includeIrregular). */
  selectedIrregular: string[]
}

export interface SessionResult {
  correct: number
  wrong: number
  skipped: number
  total: number
}

export type Screen = 'setup' | 'drill' | 'summary' | 'tables'

export const PERSONS: Person[] = ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos']

export const TENSE_LABELS: Record<Tense, string> = {
  presente: 'Presente',
  indefinido: 'Pretérito indefinido',
  imperfecto: 'Pretérito imperfecto',
}

export const PERSON_LABELS: Record<Person, string> = {
  yo: 'yo',
  tú: 'tú',
  él: 'él / ella / usted',
  nosotros: 'nosotros / nosotras',
  vosotros: 'vosotros / vosotras',
  ellos: 'ellos / ellas / ustedes',
}
