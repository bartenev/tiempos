import type { Person, Tense } from '../types'

/** Шаблон предложения: `___` — место для формы глагола. */
export interface SentenceFrame {
  tense: Tense
  person: Person
  /** Испанская фраза с пропуском `___`. */
  template: string
  /** Русский перевод (пропуск = «…»). */
  translation: string
}

/**
 * Несколько рамок на каждую пару время×лицо.
 * Рамки нейтральные: подходят к большинству глаголов из банка.
 */
export const FRAMES: SentenceFrame[] = [
  // —— Presente ——
  { tense: 'presente', person: 'yo', template: 'Ahora yo ___ en casa.', translation: 'Сейчас я … дома.' },
  { tense: 'presente', person: 'yo', template: 'Hoy yo ___ con mis amigos.', translation: 'Сегодня я … с друзьями.' },
  { tense: 'presente', person: 'tú', template: '¿Tú ___ todos los días?', translation: 'Ты … каждый день?' },
  { tense: 'presente', person: 'tú', template: 'Tú ___ muy bien.', translation: 'Ты … очень хорошо.' },
  { tense: 'presente', person: 'él', template: 'Él ___ en la oficina.', translation: 'Он … в офисе.' },
  { tense: 'presente', person: 'él', template: 'María ___ por la mañana.', translation: 'Мария … утром.' },
  { tense: 'presente', person: 'nosotros', template: 'Nosotros ___ juntos.', translation: 'Мы … вместе.' },
  { tense: 'presente', person: 'nosotros', template: 'Hoy nosotros ___ en el parque.', translation: 'Сегодня мы … в парке.' },
  { tense: 'presente', person: 'vosotros', template: '¿Vosotros ___ aquí?', translation: 'Вы (vosotros) … здесь?' },
  { tense: 'presente', person: 'vosotros', template: 'Vosotros ___ mucho.', translation: 'Вы (vosotros) … много.' },
  { tense: 'presente', person: 'ellos', template: 'Ellos ___ en Madrid.', translation: 'Они … в Мадриде.' },
  { tense: 'presente', person: 'ellos', template: 'Mis padres ___ por la tarde.', translation: 'Мои родители … днём.' },

  // —— Indefinido ——
  { tense: 'indefinido', person: 'yo', template: 'Ayer yo ___ en casa.', translation: 'Вчера я … дома.' },
  { tense: 'indefinido', person: 'yo', template: 'El lunes yo ___ con Ana.', translation: 'В понедельник я … с Аной.' },
  { tense: 'indefinido', person: 'tú', template: '¿Tú ___ ayer?', translation: 'Ты … вчера?' },
  { tense: 'indefinido', person: 'tú', template: 'Ayer tú ___ muy tarde.', translation: 'Вчера ты … очень поздно.' },
  { tense: 'indefinido', person: 'él', template: 'Él ___ el sábado pasado.', translation: 'Он … в прошлую субботу.' },
  { tense: 'indefinido', person: 'él', template: 'Ana ___ hace dos días.', translation: 'Ана … два дня назад.' },
  { tense: 'indefinido', person: 'nosotros', template: 'Nosotros ___ el año pasado.', translation: 'Мы … в прошлом году.' },
  { tense: 'indefinido', person: 'nosotros', template: 'Ayer nosotros ___ juntos.', translation: 'Вчера мы … вместе.' },
  { tense: 'indefinido', person: 'vosotros', template: '¿Vosotros ___ anoche?', translation: 'Вы (vosotros) … вчера вечером?' },
  { tense: 'indefinido', person: 'vosotros', template: 'Vosotros ___ el viernes.', translation: 'Вы (vosotros) … в пятницу.' },
  { tense: 'indefinido', person: 'ellos', template: 'Ellos ___ la semana pasada.', translation: 'Они … на прошлой неделе.' },
  { tense: 'indefinido', person: 'ellos', template: 'Mis amigos ___ en julio.', translation: 'Мои друзья … в июле.' },

  // —— Imperfecto ——
  { tense: 'imperfecto', person: 'yo', template: 'De niño yo ___ mucho.', translation: 'В детстве я … много.' },
  { tense: 'imperfecto', person: 'yo', template: 'Antes yo ___ todos los días.', translation: 'Раньше я … каждый день.' },
  { tense: 'imperfecto', person: 'tú', template: 'Cuando eras joven, tú ___.', translation: 'Когда ты был молодым, ты …' },
  { tense: 'imperfecto', person: 'tú', template: 'Antes tú ___ más.', translation: 'Раньше ты … больше.' },
  { tense: 'imperfecto', person: 'él', template: 'Antes él ___ en Valencia.', translation: 'Раньше он … в Валенсии.' },
  { tense: 'imperfecto', person: 'él', template: 'De pequeña, Ana ___.', translation: 'В детстве Ана …' },
  { tense: 'imperfecto', person: 'nosotros', template: 'Cuando éramos niños, nosotros ___.', translation: 'Когда мы были детьми, мы …' },
  { tense: 'imperfecto', person: 'nosotros', template: 'Antes nosotros ___ juntos.', translation: 'Раньше мы … вместе.' },
  { tense: 'imperfecto', person: 'vosotros', template: 'Antes vosotros ___ aquí.', translation: 'Раньше вы (vosotros) … здесь.' },
  { tense: 'imperfecto', person: 'vosotros', template: 'De jóvenes vosotros ___.', translation: 'В молодости вы (vosotros) …' },
  { tense: 'imperfecto', person: 'ellos', template: 'Antes ellos ___ en el pueblo.', translation: 'Раньше они … в деревне.' },
  { tense: 'imperfecto', person: 'ellos', template: 'Mis abuelos ___ cada domingo.', translation: 'Мои бабушка и дедушка … каждое воскресенье.' },
]

export function framesFor(tense: Tense, person: Person): SentenceFrame[] {
  return FRAMES.filter((f) => f.tense === tense && f.person === person)
}
