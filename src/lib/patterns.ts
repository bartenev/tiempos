import type { Person, Tense, Verb, VerbGroup } from '../types'
import { conjugate, gerundOf, indefinidoShift } from './conjugate'

/**
 * Модели неправильности: к какой модели относится конкретная форма.
 * Форма, совпадающая с правильным спряжением (tenemos, pensamos, tenía),
 * модели не имеет — она в обычной порции своего окончания.
 */
export type Pattern =
  // presente
  | 'e>ie'
  | 'o>ue'
  | 'e>i'
  | 'yo-go'
  | 'yo-zco'
  | 'verb-ser'
  | 'verb-estar'
  | 'verb-ir'
  | 'verb-haber'
  | 'minor'
  // indefinido
  | 'stem-u'
  | 'stem-i'
  | 'stem-j'
  | 'shift-3'
  | 'y'
  | 'fui'
  | 'di-vi'
  // imperfecto
  | 'era-iba-veia'
  // perfecto
  | 'participle'
  // gerundio
  | 'gerund-i'
  | 'gerund-y'
  | 'gerund-u'
  // imperativo
  | 'vowel'
  | 'from-yo'
  | 'short-tu'
  | 'special'

/** Название модели по-человечески: итог сессии («Темп»). */
export const PATTERN_LABELS: Record<Pattern, string> = {
  'e>ie': 'e → ie',
  'o>ue': 'o → ue',
  'e>i': 'e → i',
  'yo-go': 'yo на -go',
  'yo-zco': 'yo на -zco',
  'verb-ser': 'ser',
  'verb-estar': 'estar',
  'verb-ir': 'ir',
  'verb-haber': 'haber',
  minor: 'особые формы',
  'stem-u': 'основа на -u-',
  'stem-i': 'основа на -i-',
  'stem-j': 'основа на -j-',
  'shift-3': 'e → i, o → u в 3-м лице',
  y: 'y в 3-м лице',
  fui: 'fui, fue',
  'di-vi': 'di, vi',
  'era-iba-veia': 'era, iba, veía',
  participle: 'неправильный participio',
  'gerund-i': 'e → i (diciendo)',
  'gerund-y': 'y (leyendo)',
  'gerund-u': 'o → u (durmiendo)',
  vowel: 'чередование (piensa)',
  'from-yo': 'от yo (tenga, haga)',
  'short-tu': 'короткое tú (ven, haz)',
  special: 'sea, vaya, esté',
}

/**
 * Порядок моделей внутри времени — от самых нужных: ser, estar, ir, hay, tengo/hago раньше
 * e→ie; в indefinido fui/fue первым, в imperativo — ven, haz, di. Правильные -ar → -er → -ir идут до них, а если
 * в фильтре одни неправильные глаголы — после (см. portionStatuses).
 */
export const PATTERNS_BY_TENSE: Record<Tense, Pattern[]> = {
  presente: [
    'verb-ser',
    'verb-estar',
    'verb-ir',
    'verb-haber',
    'yo-go',
    'minor',
    'e>ie',
    'o>ue',
    'e>i',
    'yo-zco',
  ],
  indefinido: ['fui', 'stem-u', 'stem-i', 'stem-j', 'di-vi', 'shift-3', 'y'],
  imperfecto: ['era-iba-veia'],
  perfecto: ['participle'],
  // diciendo, viniendo, pidiendo → yendo, leyendo, oyendo → durmiendo
  gerundio: ['gerund-i', 'gerund-y', 'gerund-u'],
  // ven, haz, di, pon, ten → sea, vaya, esté → tenga, haga → piensa, vuelve, pide
  imperativo: ['short-tu', 'special', 'from-yo', 'vowel'],
}

/** Тот же инфинитив, но без особенностей — эталон «правильной» формы. */
function regularTwin(verb: Verb): Verb {
  return { infinitive: verb.infinitive, group: verb.group }
}

function lastVowel(stem: string): string {
  return [...stem].reverse().find((ch) => 'aeiou'.includes(ch)) ?? ''
}

function stemPattern(verb: Verb): Pattern {
  if (verb.stemChange === 'e>ie') return 'e>ie'
  if (verb.stemChange === 'e>i') return 'e>i'
  return 'o>ue' // o>ue, u>ue
}

function presentePattern(verb: Verb, person: Person, form: string): Pattern {
  const own = verb.forms?.presente?.[person]
  if (own) {
    if (person === 'yo' && form.endsWith('go')) return 'yo-go'
    switch (verb.infinitive) {
      case 'ser':
        return 'verb-ser'
      case 'estar':
        return 'verb-estar'
      case 'ir':
        return 'verb-ir'
      case 'haber':
        return 'verb-haber'
      default:
        return 'minor'
    }
  }
  if (person === 'yo' && verb.presentYo) {
    if (verb.presentYo.endsWith('go')) return 'yo-go'
    if (verb.presentYo.endsWith('zco')) return 'yo-zco'
    return 'minor' // sé
  }
  return stemPattern(verb)
}

function indefinidoPattern(verb: Verb): Pattern {
  if (verb.indefinidoStem) {
    if (verb.indefinidoStem.endsWith('j')) return 'stem-j'
    return lastVowel(verb.indefinidoStem) === 'u' ? 'stem-u' : 'stem-i'
  }
  if (verb.infinitive === 'ser' || verb.infinitive === 'ir') return 'fui'
  if (verb.infinitive === 'dar' || verb.infinitive === 'ver') return 'di-vi'
  if (verb.forms?.indefinido) return 'y'
  return 'shift-3'
}

function imperativoPattern(verb: Verb, person: Person): Pattern {
  const own = verb.forms?.imperativo?.[person]
  if (own) return person === 'tú' ? 'short-tu' : 'special'
  if (person === 'tú') return verb.forms?.presente ? 'special' : 'vowel'
  // tenga ← tengo, conozca ← conozco, vea ← veo
  if (verb.presentYo || verb.forms?.presente?.yo) return 'from-yo'
  return 'vowel'
}

function gerundioPattern(verb: Verb): Pattern {
  if (gerundOf(verb).endsWith('yendo')) return 'gerund-y'
  return indefinidoShift(verb) === 'o>u' ? 'gerund-u' : 'gerund-i'
}

/** Модель неправильности формы или null, если форма правильная. */
export function patternOf(verb: Verb, tense: Tense, person: Person): Pattern | null {
  const form = conjugate(verb, tense, person)
  if (form === conjugate(regularTwin(verb), tense, person)) return null
  switch (tense) {
    case 'presente':
      return presentePattern(verb, person, form)
    case 'indefinido':
      return indefinidoPattern(verb)
    case 'imperfecto':
      return 'era-iba-veia'
    case 'perfecto':
      return 'participle'
    case 'gerundio':
      return gerundioPattern(verb)
    case 'imperativo':
      return imperativoPattern(verb, person)
  }
}

/** Порция внутри времени: окончание правильного спряжения или модель неправильности. */
export type PortionId = VerbGroup | Pattern

/** Порция формы: модель неправильности или окончание правильного спряжения. */
export function portionOf(verb: Verb, tense: Tense, person: Person): PortionId {
  return patternOf(verb, tense, person) ?? verb.group
}
