import type { Person, StemChange, Tense, Verb, VerbGroup } from '../types'
import { PERSONS } from '../types'

export const PRESENT_ENDINGS: Record<VerbGroup, string[]> = {
  ar: ['o', 'as', 'a', 'amos', 'áis', 'an'],
  er: ['o', 'es', 'e', 'emos', 'éis', 'en'],
  ir: ['o', 'es', 'e', 'imos', 'ís', 'en'],
}

export const IMPERFECT_ENDINGS: Record<VerbGroup, string[]> = {
  ar: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'],
  er: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
  ir: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
}

export const INDEFINIDO_REGULAR: Record<VerbGroup, string[]> = {
  ar: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'],
  er: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
  ir: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
}

/** Endings for irregular pretérito stems (tuv-, pus-, …). */
export const INDEFINIDO_IRREGULAR = ['e', 'iste', 'o', 'imos', 'isteis', 'ieron']

export const STEM_CHANGED_PERSONS: Person[] = ['yo', 'tú', 'él', 'ellos']

function personIndex(person: Person): number {
  return PERSONS.indexOf(person)
}

export function infinitiveStem(verb: Verb): string {
  return verb.infinitive.slice(0, -2)
}

export function applyStemChange(stem: string, change: StemChange): string {
  switch (change) {
    case 'e>ie': {
      const i = stem.lastIndexOf('e')
      if (i === -1) return stem
      return `${stem.slice(0, i)}ie${stem.slice(i + 1)}`
    }
    case 'o>ue': {
      const i = stem.lastIndexOf('o')
      if (i === -1) return stem
      return `${stem.slice(0, i)}ue${stem.slice(i + 1)}`
    }
    case 'e>i': {
      const i = stem.lastIndexOf('e')
      if (i === -1) return stem
      return `${stem.slice(0, i)}i${stem.slice(i + 1)}`
    }
    case 'o>u': {
      const i = stem.lastIndexOf('o')
      if (i === -1) return stem
      return `${stem.slice(0, i)}u${stem.slice(i + 1)}`
    }
    case 'u>ue': {
      const i = stem.lastIndexOf('u')
      if (i === -1) return stem
      return `${stem.slice(0, i)}ue${stem.slice(i + 1)}`
    }
  }
}

/** -ir stem-changers shift e→i / o→u in él/ellos indefinido (pidió, durmió). */
export const INDEFINIDO_SHIFT_PERSONS: Person[] = ['él', 'ellos']

export function indefinidoShift(verb: Verb): StemChange | null {
  if (verb.group !== 'ir' || !verb.stemChange) return null
  if (verb.stemChange === 'o>ue') return 'o>u'
  if (verb.stemChange === 'e>ie' || verb.stemChange === 'e>i') return 'e>i'
  return null
}

/** Orthographic fix for yo indefinido of -car/-gar/-zar. */
function fixIndefinidoYo(stem: string, ending: string, group: VerbGroup): string {
  if (group !== 'ar' || ending !== 'é') return stem + ending
  if (stem.endsWith('c')) return `${stem.slice(0, -1)}qué`
  if (stem.endsWith('g')) return `${stem.slice(0, -1)}gué`
  if (stem.endsWith('z')) return `${stem.slice(0, -1)}cé`
  return stem + ending
}

function conjugatePresente(verb: Verb, person: Person): string {
  if (verb.forms?.presente?.[person]) return verb.forms.presente[person]
  if (person === 'yo' && verb.presentYo) return verb.presentYo

  const idx = personIndex(person)
  const endings = PRESENT_ENDINGS[verb.group]
  let stem = infinitiveStem(verb)

  if (verb.stemChange && STEM_CHANGED_PERSONS.includes(person)) {
    stem = applyStemChange(stem, verb.stemChange)
  }

  return stem + endings[idx]
}

function conjugateImperfecto(verb: Verb, person: Person): string {
  if (verb.forms?.imperfecto?.[person]) return verb.forms.imperfecto[person]

  const idx = personIndex(person)
  const stem = infinitiveStem(verb)
  return stem + IMPERFECT_ENDINGS[verb.group][idx]
}

function conjugateIndefinido(verb: Verb, person: Person): string {
  if (verb.forms?.indefinido?.[person]) return verb.forms.indefinido[person]

  const idx = personIndex(person)

  if (verb.indefinidoStem) {
    const stem = verb.indefinidoStem
    const endings = stem.endsWith('j')
      ? ['e', 'iste', 'o', 'imos', 'isteis', 'eron']
      : INDEFINIDO_IRREGULAR
    return stem + endings[idx]
  }

  let stem = infinitiveStem(verb)
  const ending = INDEFINIDO_REGULAR[verb.group][idx]
  const shift = indefinidoShift(verb)
  if (shift && INDEFINIDO_SHIFT_PERSONS.includes(person)) {
    stem = applyStemChange(stem, shift)
  }
  if (person === 'yo') return fixIndefinidoYo(stem, ending, verb.group)
  return stem + ending
}

/** Все 6 форм времени. */
export function paradigmOf(verb: Verb, tense: Tense): string[] {
  return PERSONS.map((p) => conjugate(verb, tense, p))
}

export function conjugate(verb: Verb, tense: Tense, person: Person): string {
  switch (tense) {
    case 'presente':
      return conjugatePresente(verb, person)
    case 'imperfecto':
      return conjugateImperfecto(verb, person)
    case 'indefinido':
      return conjugateIndefinido(verb, person)
  }
}
