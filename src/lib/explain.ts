import type { Person, StemChange, Tense, Verb } from '../types'
import { PERSONS, personLabel, personsFor } from '../types'
import {
  IMPERATIVE_ENDINGS,
  IMPERFECT_ENDINGS,
  INDEFINIDO_IRREGULAR,
  INDEFINIDO_REGULAR,
  INDEFINIDO_SHIFT_PERSONS,
  PRESENT_ENDINGS,
  STEM_CHANGED_PERSONS,
  applyStemChange,
  conjugate,
  indefinidoShift,
  infinitiveStem,
  paradigmOf,
} from './conjugate'

/**
 * Форма в ряду подсказки: stem + ending = полная форма.
 * ending непустой, только если форма построена по правилу (его подсвечиваем);
 * у неправильных форм (soy, tengo, hizo, ten) вся форма в stem.
 */
export interface HintRowItem {
  person: Person
  label: string
  stem: string
  ending: string
  current: boolean
}

/** Подсказка-правило, которая показывается после ошибки. */
export interface FormHint {
  /** Короткое правило одной строкой. */
  rule: string
  /** Текущая форма (та же, что подсвечена в row) — для крупной строки-формулы. */
  form: HintRowItem
  /** Полные формы по лицам; текущее лицо подсвечено. */
  row: HintRowItem[]
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
  imperativo: 'Imperativo',
}

/**
 * Ряд полных форм. endings — окончания правила по всем 6 лицам (PERSONS):
 * окончание выделяется, если форма им заканчивается и не задана вручную
 * (forms в банке, неправильная yo в presente).
 */
function formsRow(verb: Verb, tense: Tense, person: Person, endings: string[]): HintRowItem[] {
  const forms = paradigmOf(verb, tense)
  return personsFor(tense).map((p, i) => {
    const form = forms[i]!
    const ending = endings[PERSONS.indexOf(p)] ?? ''
    const irregular =
      Boolean(verb.forms?.[tense]?.[p]) ||
      (tense === 'presente' && p === 'yo' && Boolean(verb.presentYo))
    const ruled = !irregular && ending !== '' && form.endsWith(ending)
    return {
      person: p,
      label: personLabel(tense, p),
      stem: ruled ? form.slice(0, -ending.length) : form,
      ending: ruled ? ending : '',
      current: p === person,
    }
  })
}

/** Подсказка с рядом форм; form — клетка текущего лица. */
function withRow(
  hint: Omit<FormHint, 'form' | 'row'>,
  verb: Verb,
  tense: Tense,
  person: Person,
  endings: string[],
): FormHint {
  const row = formsRow(verb, tense, person, endings)
  return { ...hint, form: row.find((item) => item.current)!, row }
}

function regularEndings(verb: Verb, tense: Tense): string[] {
  switch (tense) {
    case 'presente':
      return PRESENT_ENDINGS[verb.group]
    case 'imperfecto':
      return IMPERFECT_ENDINGS[verb.group]
    case 'indefinido':
      return INDEFINIDO_REGULAR[verb.group]
    case 'imperativo':
      return IMPERATIVE_ENDINGS[verb.group]
  }
}

const SHORT_TU = 'Короткие tú: di, haz, ve, pon, sal, sé, ten, ven.'

function explainImperative(verb: Verb, person: Person): FormHint {
  const actual = conjugate(verb, 'imperativo', person)
  const endings = IMPERATIVE_ENDINGS[verb.group]
  const label = personLabel('imperativo', person)

  if (verb.forms?.imperativo?.[person]) {
    return withRow(
      {
        rule: `Неправильная форма ${label}: ${actual} — запомните.`,
        note: person === 'tú' ? SHORT_TU : undefined,
      },
      verb,
      'imperativo',
      person,
      endings,
    )
  }

  let rule: string
  let note: string | undefined
  if (person === 'tú') {
    rule = `tú = форма él / ella в presente: ${conjugate(verb, 'presente', 'él')}.`
    if (verb.stemChange) note = 'Чередование сохраняется, как в presente (piensa, duerme).'
  } else if (person === 'vosotros') {
    rule = 'vosotros = инфинитив, только -r → -d.'
  } else {
    const yo = conjugate(verb, 'presente', 'yo')
    const vowel = verb.group === 'ar' ? 'e' : 'a'
    rule = `${label}: от формы yo (${yo}) без -o + «обратная» гласная -${vowel} (presente de subjuntivo).`
    if (/[cgz]ar$/.test(verb.infinitive)) {
      note = 'Перед e: c → qu, g → gu, z → c (busque, llegue, empiece).'
    }
    if (person === 'nosotros' && verb.stemChange && !verb.presentYo) {
      note = indefinidoShift(verb)
        ? 'В nosotros у -ir чередование e → i / o → u (pidamos, durmamos).'
        : 'В nosotros без чередования (pensemos, volvamos).'
    }
  }

  return withRow({ rule, note }, verb, 'imperativo', person, endings)
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
  if (tense === 'imperativo') return explainImperative(verb, person)

  const endings = regularEndings(verb, tense)

  if (verb.forms?.[tense]?.[person]) {
    return withRow(
      { rule: `${TENSE_NAME[tense]} у ${verb.infinitive} неправильный — запомните парадигму.` },
      verb,
      tense,
      person,
      endings,
    )
  }

  if (tense === 'presente' && person === 'yo' && verb.presentYo) {
    return withRow(
      { rule: `Неправильная форма yo: ${verb.presentYo}. Остальные лица — по правилу.` },
      verb,
      tense,
      person,
      endings,
    )
  }

  if (tense === 'indefinido' && verb.indefinidoStem) {
    const stem = verb.indefinidoStem
    return withRow(
      {
        rule: `Неправильная основа ${stem}- + особые окончания (без ударений).`,
        note: stem.endsWith('j') ? 'После j: -eron, а не -ieron (dijeron, trajeron).' : undefined,
      },
      verb,
      tense,
      person,
      stem.endsWith('j') ? ['e', 'iste', 'o', 'imos', 'isteis', 'eron'] : INDEFINIDO_IRREGULAR,
    )
  }


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

  return withRow({ rule, note }, verb, tense, person, endings)
}
