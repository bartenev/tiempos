import type { Person, Tense } from '../types'

/**
 * Предложения под конкретный глагол:
 * «{маркер времени} {подлежащее} ___ {дополнение глагола}».
 * Перевод строится так же; на месте глагола — «…».
 */

/** Дополнение, которое естественно сочетается с глаголом. */
export interface Complement {
  es: string
  ru: string
  /** Варианты для nosotros / vosotros / ellos (согласование по числу). */
  esPl?: string
  ruPl?: string
}

interface Phrase {
  es: string
  ru: string
}

/** Маркеры времени: подсказывают, какое время нужно. */
export const TIME_MARKERS: Record<Tense, Phrase[]> = {
  presente: [
    { es: 'Hoy', ru: 'Сегодня' },
    { es: 'Normalmente', ru: 'Обычно' },
    { es: 'Todos los días', ru: 'Каждый день' },
    { es: 'Ahora', ru: 'Сейчас' },
  ],
  indefinido: [
    { es: 'Ayer', ru: 'Вчера' },
    { es: 'El lunes', ru: 'В понедельник' },
    { es: 'La semana pasada', ru: 'На прошлой неделе' },
    { es: 'Anoche', ru: 'Вчера вечером' },
    { es: 'Hace dos días', ru: 'Два дня назад' },
  ],
  imperfecto: [
    { es: 'Antes', ru: 'Раньше' },
    { es: 'Cada verano', ru: 'Каждое лето' },
    { es: 'En aquella época', ru: 'В то время' },
    { es: 'De pequeños, siempre', ru: 'В детстве всегда' },
  ],
}

export const SUBJECTS: Record<Person, Phrase[]> = {
  yo: [{ es: 'yo', ru: 'я' }],
  tú: [{ es: 'tú', ru: 'ты' }],
  él: [
    { es: 'él', ru: 'он' },
    { es: 'mi hermano', ru: 'мой брат' },
    { es: 'Pedro', ru: 'Педро' },
  ],
  nosotros: [{ es: 'nosotros', ru: 'мы' }],
  vosotros: [{ es: 'vosotros', ru: 'вы (vosotros)' }],
  ellos: [
    { es: 'ellos', ru: 'они' },
    { es: 'mis padres', ru: 'мои родители' },
    { es: 'mis amigos', ru: 'мои друзья' },
  ],
}

/** «De pequeños» — только для множественного числа. */
const PLURAL_ONLY_MARKERS = new Set(['De pequeños, siempre'])

const PLURAL: ReadonlySet<Person> = new Set(['nosotros', 'vosotros', 'ellos'])

export const VERB_COMPLEMENTS: Record<string, Complement[]> = {
  // —— Regular -ar ——
  hablar: [
    { es: 'con Ana', ru: 'с Аной' },
    { es: 'por teléfono', ru: 'по телефону' },
  ],
  estudiar: [
    { es: 'español', ru: 'испанский' },
    { es: 'en la biblioteca', ru: 'в библиотеке' },
  ],
  trabajar: [
    { es: 'en la oficina', ru: 'в офисе' },
    { es: 'desde casa', ru: 'из дома' },
  ],
  caminar: [
    { es: 'por el parque', ru: 'по парку' },
    { es: 'hasta la playa', ru: 'до пляжа' },
  ],
  comprar: [
    { es: 'pan', ru: 'хлеб' },
    { es: 'fruta en el mercado', ru: 'фрукты на рынке' },
  ],
  mirar: [
    { es: 'la tele', ru: 'телевизор' },
    { es: 'por la ventana', ru: 'в окно' },
  ],
  escuchar: [
    { es: 'música', ru: 'музыку' },
    { es: 'la radio', ru: 'радио' },
  ],
  cantar: [
    { es: 'una canción', ru: 'песню' },
    { es: 'en la ducha', ru: 'в душе' },
  ],
  bailar: [
    { es: 'salsa', ru: 'сальсу' },
    { es: 'en la fiesta', ru: 'на вечеринке' },
  ],
  cocinar: [
    { es: 'la cena', ru: 'ужин' },
    { es: 'una paella', ru: 'паэлью' },
  ],
  llegar: [
    { es: 'tarde', ru: 'поздно' },
    { es: 'a casa a las ocho', ru: 'домой в восемь' },
  ],
  buscar: [
    { es: 'las llaves', ru: 'ключи' },
    { es: 'trabajo', ru: 'работу' },
  ],
  tomar: [
    { es: 'un café', ru: 'кофе' },
    { es: 'el autobús', ru: 'автобус' },
  ],
  necesitar: [
    { es: 'ayuda', ru: 'помощь' },
    { es: 'más tiempo', ru: 'больше времени' },
  ],

  // —— Regular -er ——
  comer: [
    { es: 'una pizza', ru: 'пиццу' },
    { es: 'en un restaurante', ru: 'в ресторане' },
  ],
  beber: [
    { es: 'agua', ru: 'воду' },
    { es: 'un zumo de naranja', ru: 'апельсиновый сок' },
  ],
  correr: [
    { es: 'por la playa', ru: 'по пляжу' },
    { es: 'cinco kilómetros', ru: 'пять километров' },
  ],
  aprender: [
    { es: 'a nadar', ru: 'плавать' },
    { es: 'palabras nuevas', ru: 'новые слова' },
  ],
  comprender: [
    { es: 'la lección', ru: 'урок' },
    { es: 'el problema', ru: 'проблему' },
  ],
  vender: [
    { es: 'el coche', ru: 'машину' },
    { es: 'ropa vieja', ru: 'старую одежду' },
  ],
  responder: [
    { es: 'a la pregunta', ru: 'на вопрос' },
    { es: 'al correo', ru: 'на письмо' },
  ],

  // —— Regular -ir ——
  vivir: [
    { es: 'en Madrid', ru: 'в Мадриде' },
    { es: 'cerca del mar', ru: 'у моря' },
  ],
  escribir: [
    { es: 'una carta', ru: 'письмо' },
    { es: 'un mensaje a Ana', ru: 'сообщение Ане' },
  ],
  abrir: [
    { es: 'la ventana', ru: 'окно' },
    { es: 'la tienda', ru: 'магазин' },
  ],
  subir: [
    { es: 'a la montaña', ru: 'в горы' },
    { es: 'por las escaleras', ru: 'по лестнице' },
  ],
  decidir: [
    { es: 'qué hacer', ru: 'что делать' },
    { es: 'cambiar de trabajo', ru: 'сменить работу' },
  ],
  recibir: [
    { es: 'un regalo', ru: 'подарок' },
    { es: 'muchas cartas', ru: 'много писем' },
  ],
  permitir: [
    { es: 'eso', ru: 'это' },
    { es: 'fumar en casa', ru: 'курить дома' },
  ],

  // —— Stem-changing ——
  pensar: [
    { es: 'en el viaje', ru: 'о поездке' },
    { es: 'mucho en ti', ru: 'много о тебе' },
  ],
  empezar: [
    { es: 'el trabajo a las nueve', ru: 'работу в девять' },
    { es: 'un curso nuevo', ru: 'новый курс' },
  ],
  encontrar: [
    { es: 'las llaves', ru: 'ключи' },
    { es: 'un buen piso', ru: 'хорошую квартиру' },
  ],
  volver: [
    { es: 'a casa', ru: 'домой' },
    { es: 'del trabajo', ru: 'с работы' },
  ],
  jugar: [
    { es: 'al fútbol', ru: 'в футбол' },
    { es: 'a las cartas', ru: 'в карты' },
  ],
  pedir: [
    { es: 'un café', ru: 'кофе' },
    { es: 'ayuda', ru: 'помощи' },
  ],
  servir: [
    { es: 'la cena', ru: 'ужин' },
    { es: 'el vino', ru: 'вино' },
  ],
  dormir: [
    { es: 'ocho horas', ru: 'восемь часов' },
    { es: 'en el sofá', ru: 'на диване' },
  ],
  preferir: [
    { es: 'el té', ru: 'чай' },
    { es: 'quedarse en casa', ru: 'остаться дома' },
  ],
  sentir: [
    { es: 'frío', ru: 'холод' },
    { es: 'mucho dolor', ru: 'сильную боль' },
  ],

  // —— Irregular ——
  ser: [
    { es: 'de Madrid', ru: 'из Мадрида' },
    { es: 'muy feliz', esPl: 'muy felices', ru: 'очень счастлив', ruPl: 'очень счастливы' },
  ],
  estar: [
    { es: 'en casa', ru: 'дома' },
    { es: 'de vacaciones', ru: 'в отпуске' },
  ],
  ir: [
    { es: 'al cine', ru: 'в кино' },
    { es: 'a la playa', ru: 'на пляж' },
  ],
  haber: [
    { es: 'terminado el trabajo', ru: '… закончил(и) работу (haber + participio)' },
    { es: 'comido ya', ru: '… уже поел(и) (haber + participio)' },
  ],
  tener: [
    { es: 'mucho trabajo', ru: 'много работы' },
    { es: 'un perro', ru: 'собаку' },
  ],
  hacer: [
    { es: 'los deberes', ru: 'домашнее задание' },
    { es: 'deporte', ru: 'спорт' },
  ],
  poder: [
    { es: 'venir', ru: 'прийти' },
    { es: 'ayudar a Ana', ru: 'помочь Ане' },
  ],
  decir: [
    { es: 'la verdad', ru: 'правду' },
    { es: 'que no', ru: 'что нет' },
  ],
  venir: [
    { es: 'a clase', ru: 'на занятие' },
    { es: 'en tren', ru: 'на поезде' },
  ],
  querer: [
    { es: 'un café', ru: 'кофе' },
    { es: 'viajar', ru: 'путешествовать' },
  ],
  saber: [
    { es: 'la respuesta', ru: 'ответ' },
    { es: 'nadar', ru: 'плавать' },
  ],
  poner: [
    { es: 'la mesa', ru: 'на стол' },
    { es: 'música', ru: 'музыку' },
  ],
  ver: [
    { es: 'una película', ru: 'фильм' },
    { es: 'a mis abuelos', ru: 'бабушку и дедушку' },
  ],
  dar: [
    { es: 'un regalo a Ana', ru: 'подарок Ане' },
    { es: 'clases de piano', ru: 'уроки фортепиано' },
  ],
  salir: [
    { es: 'de casa temprano', ru: 'из дома рано' },
    { es: 'con amigos', ru: 'с друзьями' },
  ],
  traer: [
    { es: 'el pan', ru: 'хлеб' },
    { es: 'flores', ru: 'цветы' },
  ],
  conocer: [
    { es: 'a mucha gente', ru: 'много людей' },
    { es: 'bien la ciudad', ru: 'хорошо город' },
  ],
  parecer: [
    { es: 'cansado', esPl: 'cansados', ru: 'усталым', ruPl: 'усталыми' },
    { es: 'contento', esPl: 'contentos', ru: 'довольным', ruPl: 'довольными' },
  ],
  leer: [
    { es: 'un libro', ru: 'книгу' },
    { es: 'el periódico', ru: 'газету' },
  ],
  oír: [
    { es: 'un ruido', ru: 'шум' },
    { es: 'la noticia', ru: 'новость' },
  ],
  caer: [
    { es: 'al suelo', ru: 'на пол' },
    { es: 'en la calle', ru: 'на улице' },
  ],
}

export interface BuiltSentence {
  sentence: string
  translation: string
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

type Pick = <T>(items: T[]) => T

function firstPick<T>(items: T[]): T {
  return items[0]!
}

export function hasVerbSentences(infinitive: string): boolean {
  return (VERB_COMPLEMENTS[infinitive]?.length ?? 0) > 0
}

/** Собрать предложение под глагол; null, если для глагола нет дополнений. */
export function buildVerbSentence(
  infinitive: string,
  tense: Tense,
  person: Person,
  pick: Pick = firstPick,
): BuiltSentence | null {
  const complements = VERB_COMPLEMENTS[infinitive]
  if (!complements || complements.length === 0) return null

  const plural = PLURAL.has(person)
  const markers = TIME_MARKERS[tense].filter(
    (m) => plural || !PLURAL_ONLY_MARKERS.has(m.es),
  )
  const marker = pick(markers)
  const subject = pick(SUBJECTS[person])
  const comp = pick(complements)

  const compEs = plural && comp.esPl ? comp.esPl : comp.es
  const compRu = plural && comp.ruPl ? comp.ruPl : comp.ru
  // Для haber многоточие уже внутри перевода дополнения.
  const ruVerb = compRu.includes('…') ? compRu : `… ${compRu}`

  return {
    sentence: `${marker.es} ${subject.es} ___ ${compEs}.`,
    translation: capitalize(`${marker.ru} ${subject.ru} ${ruVerb}.`),
  }
}
