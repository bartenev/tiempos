import type { Verb } from '../types'

/** Банк глаголов для тренажёра (~50). */
export const VERBS: Verb[] = [
  // Regular -ar
  { infinitive: 'hablar', group: 'ar' },
  { infinitive: 'estudiar', group: 'ar' },
  { infinitive: 'trabajar', group: 'ar' },
  { infinitive: 'caminar', group: 'ar' },
  { infinitive: 'comprar', group: 'ar' },
  { infinitive: 'mirar', group: 'ar' },
  { infinitive: 'escuchar', group: 'ar' },
  { infinitive: 'cantar', group: 'ar' },
  { infinitive: 'bailar', group: 'ar' },
  { infinitive: 'cocinar', group: 'ar' },
  { infinitive: 'llegar', group: 'ar' },
  { infinitive: 'buscar', group: 'ar' },
  { infinitive: 'tomar', group: 'ar' },
  { infinitive: 'necesitar', group: 'ar' },

  // Regular -er
  { infinitive: 'comer', group: 'er' },
  { infinitive: 'beber', group: 'er' },
  { infinitive: 'correr', group: 'er' },
  { infinitive: 'aprender', group: 'er' },
  { infinitive: 'comprender', group: 'er' },
  { infinitive: 'vender', group: 'er' },
  { infinitive: 'responder', group: 'er' },

  // Regular -ir
  { infinitive: 'vivir', group: 'ir' },
  { infinitive: 'escribir', group: 'ir' },
  { infinitive: 'abrir', group: 'ir' },
  { infinitive: 'subir', group: 'ir' },
  { infinitive: 'decidir', group: 'ir' },
  { infinitive: 'recibir', group: 'ir' },
  { infinitive: 'permitir', group: 'ir' },

  // Stem-changing presente
  { infinitive: 'pensar', group: 'ar', stemChange: 'e>ie' },
  { infinitive: 'empezar', group: 'ar', stemChange: 'e>ie' },
  { infinitive: 'encontrar', group: 'ar', stemChange: 'o>ue' },
  { infinitive: 'volver', group: 'er', stemChange: 'o>ue' },
  { infinitive: 'jugar', group: 'ar', stemChange: 'u>ue' },
  { infinitive: 'pedir', group: 'ir', stemChange: 'e>i' },
  { infinitive: 'servir', group: 'ir', stemChange: 'e>i' },
  { infinitive: 'dormir', group: 'ir', stemChange: 'o>ue' },
  { infinitive: 'preferir', group: 'ir', stemChange: 'e>ie' },
  { infinitive: 'sentir', group: 'ir', stemChange: 'e>ie' },

  // Common irregulars
  {
    infinitive: 'ser',
    group: 'er',
    forms: {
      presente: {
        yo: 'soy',
        tú: 'eres',
        él: 'es',
        nosotros: 'somos',
        vosotros: 'sois',
        ellos: 'son',
      },
      indefinido: {
        yo: 'fui',
        tú: 'fuiste',
        él: 'fue',
        nosotros: 'fuimos',
        vosotros: 'fuisteis',
        ellos: 'fueron',
      },
      imperfecto: {
        yo: 'era',
        tú: 'eras',
        él: 'era',
        nosotros: 'éramos',
        vosotros: 'erais',
        ellos: 'eran',
      },
    },
  },
  {
    infinitive: 'estar',
    group: 'ar',
    forms: {
      presente: {
        yo: 'estoy',
        tú: 'estás',
        él: 'está',
        nosotros: 'estamos',
        vosotros: 'estáis',
        ellos: 'están',
      },
    },
    indefinidoStem: 'estuv',
  },
  {
    infinitive: 'ir',
    group: 'ir',
    forms: {
      presente: {
        yo: 'voy',
        tú: 'vas',
        él: 'va',
        nosotros: 'vamos',
        vosotros: 'vais',
        ellos: 'van',
      },
      indefinido: {
        yo: 'fui',
        tú: 'fuiste',
        él: 'fue',
        nosotros: 'fuimos',
        vosotros: 'fuisteis',
        ellos: 'fueron',
      },
      imperfecto: {
        yo: 'iba',
        tú: 'ibas',
        él: 'iba',
        nosotros: 'íbamos',
        vosotros: 'ibais',
        ellos: 'iban',
      },
    },
  },
  {
    infinitive: 'haber',
    group: 'er',
    forms: {
      presente: {
        yo: 'he',
        tú: 'has',
        él: 'ha',
        nosotros: 'hemos',
        vosotros: 'habéis',
        ellos: 'han',
      },
    },
    indefinidoStem: 'hub',
  },
  {
    infinitive: 'tener',
    group: 'er',
    stemChange: 'e>ie',
    presentYo: 'tengo',
    indefinidoStem: 'tuv',
  },
  {
    infinitive: 'hacer',
    group: 'er',
    presentYo: 'hago',
    indefinidoStem: 'hic',
    forms: {
      indefinido: {
        yo: 'hice',
        tú: 'hiciste',
        él: 'hizo',
        nosotros: 'hicimos',
        vosotros: 'hicisteis',
        ellos: 'hicieron',
      },
    },
  },
  {
    infinitive: 'poder',
    group: 'er',
    stemChange: 'o>ue',
    indefinidoStem: 'pud',
  },
  {
    infinitive: 'decir',
    group: 'ir',
    stemChange: 'e>i',
    presentYo: 'digo',
    indefinidoStem: 'dij',
  },
  {
    infinitive: 'venir',
    group: 'ir',
    stemChange: 'e>ie',
    presentYo: 'vengo',
    indefinidoStem: 'vin',
  },
  {
    infinitive: 'querer',
    group: 'er',
    stemChange: 'e>ie',
    indefinidoStem: 'quis',
  },
  {
    infinitive: 'saber',
    group: 'er',
    presentYo: 'sé',
    indefinidoStem: 'sup',
  },
  {
    infinitive: 'poner',
    group: 'er',
    presentYo: 'pongo',
    indefinidoStem: 'pus',
  },
  {
    infinitive: 'ver',
    group: 'er',
    forms: {
      presente: {
        yo: 'veo',
        tú: 'ves',
        él: 've',
        nosotros: 'vemos',
        vosotros: 'veis',
        ellos: 'ven',
      },
      indefinido: {
        yo: 'vi',
        tú: 'viste',
        él: 'vio',
        nosotros: 'vimos',
        vosotros: 'visteis',
        ellos: 'vieron',
      },
      imperfecto: {
        yo: 'veía',
        tú: 'veías',
        él: 'veía',
        nosotros: 'veíamos',
        vosotros: 'veíais',
        ellos: 'veían',
      },
    },
  },
  {
    infinitive: 'dar',
    group: 'ar',
    forms: {
      presente: {
        yo: 'doy',
        tú: 'das',
        él: 'da',
        nosotros: 'damos',
        vosotros: 'dais',
        ellos: 'dan',
      },
      indefinido: {
        yo: 'di',
        tú: 'diste',
        él: 'dio',
        nosotros: 'dimos',
        vosotros: 'disteis',
        ellos: 'dieron',
      },
    },
  },
  {
    infinitive: 'salir',
    group: 'ir',
    presentYo: 'salgo',
  },
  {
    infinitive: 'traer',
    group: 'er',
    presentYo: 'traigo',
    indefinidoStem: 'traj',
  },
  {
    infinitive: 'conocer',
    group: 'er',
    presentYo: 'conozco',
  },
  {
    infinitive: 'parecer',
    group: 'er',
    presentYo: 'parezco',
  },
  {
    infinitive: 'leer',
    group: 'er',
    forms: {
      indefinido: {
        yo: 'leí',
        tú: 'leíste',
        él: 'leyó',
        nosotros: 'leímos',
        vosotros: 'leísteis',
        ellos: 'leyeron',
      },
    },
  },
  {
    infinitive: 'oír',
    group: 'ir',
    forms: {
      presente: {
        yo: 'oigo',
        tú: 'oyes',
        él: 'oye',
        nosotros: 'oímos',
        vosotros: 'oís',
        ellos: 'oyen',
      },
      indefinido: {
        yo: 'oí',
        tú: 'oíste',
        él: 'oyó',
        nosotros: 'oímos',
        vosotros: 'oísteis',
        ellos: 'oyeron',
      },
    },
  },
  {
    infinitive: 'caer',
    group: 'er',
    presentYo: 'caigo',
    forms: {
      indefinido: {
        yo: 'caí',
        tú: 'caíste',
        él: 'cayó',
        nosotros: 'caímos',
        vosotros: 'caísteis',
        ellos: 'cayeron',
      },
    },
  },
]

export function findVerb(infinitive: string): Verb | undefined {
  return VERBS.find((v) => v.infinitive === infinitive)
}

/**
 * Правильный глагол: спрягается по стандартным окончаниям
 * (без stem-change, yo-исключений, irregular indefinido и полной парадигмы).
 * Орфография -car/-gar/-zar остаётся «правильной».
 */
export function isRegularVerb(verb: Verb): boolean {
  return (
    !verb.stemChange &&
    !verb.presentYo &&
    !verb.indefinidoStem &&
    !verb.forms
  )
}

export const REGULAR_VERBS: Verb[] = VERBS.filter(isRegularVerb)

export const IRREGULAR_VERBS: Verb[] = VERBS.filter((v) => !isRegularVerb(v))

export const REGULAR_INFINITIVES: Set<string> = new Set(
  REGULAR_VERBS.map((v) => v.infinitive),
)

export const IRREGULAR_INFINITIVES: string[] = IRREGULAR_VERBS.map(
  (v) => v.infinitive,
)
