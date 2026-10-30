export type Tense = 'presente' | 'indefinido' | 'imperfecto' | 'imperativo'

export type Person = 'yo' | 'tú' | 'él' | 'nosotros' | 'vosotros' | 'ellos'

export type VerbGroup = 'ar' | 'er' | 'ir'

/** Stem change in presente (nosotros/vosotros keep the infinitive stem). */
export type StemChange = 'e>ie' | 'o>ue' | 'e>i' | 'u>ue' | 'o>u'

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
  /** Override forms for a tense (full paradigm or single persons). */
  forms?: Partial<Record<Tense, Partial<Record<Person, string>>>>
  /** Императив неестественен (haber, poder…) — не тренируем. */
  noImperative?: boolean
}

export interface DrillCard {
  type: 'verb'
  verb: Verb
  tense: Tense
  person: Person
  /** Предложение с пропуском `___`. */
  sentence: string
  /** Русский перевод предложения. */
  translation: string
  /** Ожидаемая форма глагола в пропуске. */
  answer: string
  /** Повтор карточки после ошибки в этой же сессии. */
  retry?: boolean
}

/**
 * smart — чаще показывать слабые формы;
 * weak — только слабые («красные зоны»);
 * random — равномерно случайно.
 */
export type SessionMode = 'smart' | 'weak' | 'random'

/** Что тренируем: спряжение глаголов или главы учебника. */
export type Track = 'verbs' | 'book'

/** Как отвечать: вписывать форму или сказать её и оценить себя самому. */
export type AnswerMode = 'text' | 'oral'

export interface SessionConfig {
  tenses: Tense[]
  /** Какие местоимения тренировать (usted / ustedes — вместе с él / ellos). */
  persons: Person[]
  /** Какие спряжения: глаголы на -ar / -er / -ir (и правильные, и неправильные). */
  groups: VerbGroup[]
  size: number
  mode: SessionMode
  answer: AnswerMode
  /** Включать правильные (регулярные) глаголы. */
  includeRegular: boolean
  /** Включать неправильные глаголы. */
  includeIrregular: boolean
  /** Выбранные неправильные infinitivos (если includeIrregular). */
  selectedIrregular: string[]
}

/** Тема главы. У главы их несколько: по ним выбирают сразу группу глав. */
export type BookTag =
  | 'pronombres'
  | 'personales'
  | 'complementos'
  | 'preposiciones'
  | 'reflexivos'
  | 'gustar'
  | 'imperativo'
  | 'impersonales'
  | 'demostrativos'
  | 'posesivos'
  | 'indefinidos'
  | 'relativos'
  | 'interrogativos'

interface BookItemBase {
  /** Стимул: предложение с `___` или фраза, которую нужно переделать. */
  es: string
  /** Русский перевод стимула или ожидаемого ответа. */
  ru: string
  /** Подсказка в скобках: «a ella», слово из рамки, ключ картинки. */
  cue?: string
  /** Доп. инструкция к пункту: банк слов, «(yo, =)», картинка. */
  prompt?: string
  /** Картинка из учебника: путь от public/, напр. `book/12.1-3.jpg`. */
  image?: string
}

/** Вписать ответ в каждый пропуск `___`. */
export interface FillItem extends BookItemBase {
  kind: 'fill'
  /** Верные варианты по каждому пропуску; прочерк «—» — ничего не нужно. */
  blanks: string[][]
}

/** Выбрать вариант; прочерк «—» среди них — ничего не нужно. */
export interface ChoiceItem extends BookItemBase {
  kind: 'choice'
  answer: string
  options: string[]
}

/** Написать фразу целиком: верные варианты, основной — первый. */
export interface RewriteItem extends BookItemBase {
  kind: 'rewrite'
  answers: string[]
}

/** Одно упражнение главы. */
export type BookItem = FillItem | ChoiceItem | RewriteItem

export type BookItemKind = BookItem['kind']

/** Набор упражнений на одно правило главы. */
export interface BookSet {
  /**
   * Номер упражнения в учебнике, напр. `18.2`. Прогресс хранится по id и месту
   * в наборе, поэтому новые пункты добавляем только в конец.
   */
  id: string
  /** Что нужно сделать (формулировка из учебника + перевод). */
  task: string
  /** Правило своими словами: показывается после ошибки. */
  rule: string
  /** Банк слов / рамка над упражнением, если есть. */
  bank?: string
  items: BookItem[]
}

/** Глава = один юнит учебника = один пул упражнений. */
export interface Chapter {
  /** Номер юнита в учебнике. */
  unit: number
  /** Название по-испански. */
  title: string
  /** О чём глава, по-русски. */
  ru: string
  tags: BookTag[]
  sets: BookSet[]
}

/** Карточка упражнения: тот же экран, что у глаголов, но без спряжения. */
export interface BookCard {
  type: 'book'
  /** Постоянный ключ упражнения — по нему хранится прогресс. */
  key: string
  unit: number
  task: string
  rule: string
  /** Банк слов из рамки упражнения. */
  bank?: string
  kind: BookItemKind
  sentence: string
  translation: string
  /** Основной ответ целиком: то, что показываем после проверки. */
  answer: string
  /** Верные варианты по полям ввода; основной — первый. */
  blanks: string[][]
  cue?: string
  prompt?: string
  options?: string[]
  image?: string
  retry?: boolean
}

export type AnyCard = DrillCard | BookCard

export function isBookCard(card: AnyCard): card is BookCard {
  return card.type === 'book'
}

export interface BookConfig {
  /** Номера выбранных глав. */
  units: number[]
  size: number
  mode: SessionMode
  answer: AnswerMode
}

export interface SessionMistake {
  /** Что считать одной и той же ошибкой (повторы не дублируем в итогах). */
  key: string
  /** Подпись: «hablar · pres. · yo», «Глава 35». */
  meta: string
  answer: string
  given: string
}

export interface SessionResult {
  correct: number
  wrong: number
  skipped: number
  total: number
  /** Лучшая серия верных подряд за сессию. */
  bestStreak: number
  /** Длительность в секундах. */
  seconds: number
  mistakes: SessionMistake[]
}

export type Screen = 'setup' | 'settings' | 'drill' | 'summary' | 'tables' | 'progress'

export const MODE_LABELS: Record<SessionMode, string> = {
  smart: 'Умная очередь',
  weak: 'Только слабые',
  random: 'Случайно',
}

export const PERSONS: Person[] = ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos']

export const VERB_GROUPS: VerbGroup[] = ['ar', 'er', 'ir']

export const TENSES: Tense[] = ['presente', 'indefinido', 'imperfecto', 'imperativo']

/**
 * Imperativo afirmativo: tú, usted, nosotros, vosotros, ustedes.
 * usted / ustedes хранятся в ячейках él / ellos (та же форма 3-го лица).
 */
export const IMPERATIVE_PERSONS: Person[] = ['tú', 'él', 'nosotros', 'vosotros', 'ellos']

/** Лица, у которых есть форма в этом времени. */
export function personsFor(tense: Tense): Person[] {
  return tense === 'imperativo' ? IMPERATIVE_PERSONS : PERSONS
}

/** Подпись лица: в императиве él → usted, ellos → ustedes. */
export function personLabel(tense: Tense, person: Person): string {
  if (tense === 'imperativo') {
    if (person === 'él') return 'usted'
    if (person === 'ellos') return 'ustedes'
  }
  return person
}

export const TENSE_LABELS: Record<Tense, string> = {
  presente: 'Presente',
  indefinido: 'Pretérito indefinido',
  imperfecto: 'Pretérito imperfecto',
  imperativo: 'Imperativo',
}

/** Как время называется по-русски. */
export const TENSE_RU: Record<Tense, string> = {
  presente: 'настоящее время',
  indefinido: 'прошедшее законченное',
  imperfecto: 'прошедшее незаконченное',
  imperativo: 'повелительное наклонение',
}

export const TENSE_SHORT: Record<Tense, string> = {
  presente: 'pres.',
  indefinido: 'indef.',
  imperfecto: 'imperf.',
  imperativo: 'imperat.',
}

export const PERSON_LABELS: Record<Person, string> = {
  yo: 'yo',
  tú: 'tú',
  él: 'él / ella / usted',
  nosotros: 'nosotros / nosotras',
  vosotros: 'vosotros / vosotras',
  ellos: 'ellos / ellas / ustedes',
}
