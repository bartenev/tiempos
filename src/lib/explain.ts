import type { Person, StemChange, Tense, Verb } from '../types'
import { PERSONS } from '../types'
import {
  IMPERFECT_ENDINGS,
  INDEFINIDO_IRREGULAR,
  INDEFINIDO_REGULAR,
  INDEFINIDO_SHIFT_PERSONS,
  PRESENT_ENDINGS,
  STEM_CHANGED_PERSONS,
  applyStemChange,
  indefinidoShift,
  infinitiveStem,
  paradigmOf,
} from './conjugate'

/** Подсказка-правило, которая показывается после ошибки. */
export interface FormHint {
  /** Короткое правило одной строкой. */
  rule: string
  /** Основа + окончание (если форма строится по правилу). */
  stem?: string
  ending?: string
  /** Ряд окончаний (или форм) по лицам; текущее лицо подсвечено. */
  row: { person: Person; value: string; current: boolean }[]
  /** Дополнительная заметка (орфография, ударение, исключение). */
  note?: string
}

const STEM_CHANGE_TEXT: Record<StemChange, string> = {
  'e>ie': 'e → ie',
  'o>ue': 'o → ue',
  'e>i': 'e → i',
  'u>ue': 'u → ue',
  'o>u': 'o → u',
}

const TENSE_NAME: Record<Tense, string> = {
  presente: 'Presente',
  indefinido: 'Indefinido',
  imperfecto: 'Imperfecto',
}

function endingRow(endings: string[], person: Person): FormHint['row'] {
  return PERSONS.map((p, i) => ({
    person: p,
    value: `-${endings[i]}`,
    current: p === person,
  }))
}

function formRow(forms: string[], person: Person): FormHint['row'] {
  return PERSONS.map((p, i) => ({ person: p, value: forms[i]!, current: p === person }))
}

function regularEndings(verb: Verb, tense: Tense): string[] {
  switch (tense) {
    case 'presente':
      return PRESENT_ENDINGS[verb.group]
    case 'imperfecto':
      return IMPERFECT_ENDINGS[verb.group]
    case 'indefinido':
      return INDEFINIDO_REGULAR[verb.group]
  }
}

function orthographyNote(stem: string): string | undefined {
  if (stem.endsWith('c')) return 'Орфография: c → qu перед é (busqué), чтобы сохранить звук [k].'
  if (stem.endsWith('g')) return 'Орфография: g → gu перед é (llegué), чтобы сохранить звук [g].'
  if (stem.endsWith('z')) return 'Орфография: z → c перед é (empecé).'
  return undefined
}

function accentNote(tense: Tense, verb: Verb, person: Person): string | undefined {
  if (tense === 'indefinido' && (person === 'yo' || person === 'él')) {
    return 'Ударение на окончании — не забудьте тильду (-é / -ó, -í / -ió).'
  }
  if (tense === 'imperfecto' && verb.group !== 'ar') {
    return 'В -er/-ir imperfecto все формы с í: -ía, -ías, -íamos…'
  }
  if (tense === 'imperfecto' && person === 'nosotros') {
    return 'Nosotros в imperfecto -ar: -ábamos (с тильдой).'
  }
  return undefined
}

/**
 * Объяснить, как строится форма. Для полностью неправильных форм
 * показываем всю парадигму — её нужно запомнить.
 */
export function explainForm(verb: Verb, tense: Tense, person: Person): FormHint {
  const idx = PERSONS.indexOf(person)
  const overridden = verb.forms?.[tense]?.[person]

  if (overridden) {
    return {
      rule: `${TENSE_NAME[tense]} у ${verb.infinitive} неправильный — запомните парадигму.`,
      row: formRow(paradigmOf(verb, tense), person),
    }
  }

  if (tense === 'presente' && person === 'yo' && verb.presentYo) {
    return {
      rule: `Неправильная форма yo: ${verb.presentYo}. Остальные лица — по правилу.`,
      row: formRow(paradigmOf(verb, tense), person),
    }
  }

  if (tense === 'indefinido' && verb.indefinidoStem) {
    const stem = verb.indefinidoStem
    const endings = stem.endsWith('j')
      ? ['e', 'iste', 'o', 'imos', 'isteis', 'eron']
      : INDEFINIDO_IRREGULAR
    return {
      rule: `Неправильная основа ${stem}- + особые окончания (без ударений).`,
      stem,
      ending: endings[idx],
      row: endingRow(endings, person),
      note: stem.endsWith('j') ? 'После j: -eron, а не -ieron (dijeron, trajeron).' : undefined,
    }
  }

  const endings = regularEndings(verb, tense)
  const baseStem = infinitiveStem(verb)
  let stem = baseStem
  let rule = `${TENSE_NAME[tense]}, глаголы на -${verb.group}: основа ${baseStem}- + окончание.`
  let note = accentNote(tense, verb, person)

  if (tense === 'presente' && verb.stemChange) {
    const change = STEM_CHANGE_TEXT[verb.stemChange]
    if (STEM_CHANGED_PERSONS.includes(person)) {
      stem = applyStemChange(baseStem, verb.stemChange)
      rule = `Чередование ${change} под ударением: ${stem}- + окончание.`
    } else {
      rule = `Nosotros / vosotros без чередования ${change}: ${baseStem}- + окончание.`
    }
    note = 'Чередование только в yo, tú, él, ellos («ботинок»).'
  }

  if (tense === 'indefinido') {
    const shift = indefinidoShift(verb)
    if (shift && INDEFINIDO_SHIFT_PERSONS.includes(person)) {
      stem = applyStemChange(baseStem, shift)
      rule = `-ir с чередованием: в él / ellos ${STEM_CHANGE_TEXT[shift]} (${stem}-).`
    }
    if (person === 'yo' && verb.group === 'ar') {
      note = orthographyNote(baseStem) ?? note
    }
  }

  const ending = endings[idx]!
  const actual = paradigmOf(verb, tense)[idx]!
  const built = stem + ending

  return {
    rule,
    stem: built === actual ? stem : actual.slice(0, -ending.length) || stem,
    ending,
    row: endingRow(endings, person),
    note,
  }
}
