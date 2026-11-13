// Пошаговая схема выбора артикля — справка тренажёра артиклей.
// Перенесена со старой страницы (espanol/trainer/template.html, вкладка «Схема») без изменений:
// те же вопросы, что у алгоритма v2 (src/lib/articles/algorithm.ts), но для человека.
import type { RuleCode } from './algorithm'

/** Итог схемы: тип артикля; asis — артикль входит в название. */
export type SchemeResult = 'def' | 'indef' | 'zero' | 'lo' | 'asis'

export type SchemeNodeId =
  | 'start'
  | 'name'
  | 'person'
  | 'vocative'
  | 'place'
  | 'placekind'
  | 'time'
  | 'weekday'
  | 'date'
  | 'pred'
  | 'predq'
  | 'lex'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'eval'

/** Что знаем о форме: род, число, ударное a-, предлог, опущено ли существительное. */
export interface SchemeForm {
  g: 'm' | 'f'
  n: 'sg' | 'pl'
  at: boolean
  prep: '' | 'a' | 'de'
  omit: boolean
}

export interface SchemeOption {
  /** Вариант ответа. */
  l: string
  /** Пример. */
  h?: string
  next?: SchemeNodeId
  res?: SchemeResult
  /** Правило, которое решает; null — правило берётся из флагов (C.tipo / C.cantidad). */
  rule?: RuleCode | null
  /** Подсказка формы: часы — ж.р., jugar — предлог a. */
  form?: Partial<SchemeForm>
  /** Флаги для следующих шагов: существительное опущено; тип или количество. */
  set?: { omit?: boolean; z?: RuleCode }
}

export interface SchemeNode {
  q: string
  hint?: string
  opts: SchemeOption[]
}

export const SCHEME: Record<SchemeNodeId, SchemeNode> = {
  start: {
    q: 'Что стоит после артикля?',
    opts: [
      { l: 'Существительное', h: 'el libro, una casa, los Andes', next: 'name' },
      {
        l: 'Существительного нет: оно уже названо раньше',
        h: '¿Qué zapatos? — Los negros. Quiero uno pequeño. La de la derecha.',
        set: { omit: true },
        next: 'q1',
      },
      {
        l: 'Существительного нет: «то, что…», «вещь вообще»',
        h: 'Lo bueno del verano. No me gusta lo amargo.',
        res: 'lo',
        rule: 'S.lo',
      },
    ],
  },
  name: {
    q: 'Это имя собственное?',
    opts: [
      { l: 'Да, человек', h: 'Elena, el señor Alonso, don José', next: 'person' },
      { l: 'Да, место', h: 'Cuba, la calle Mayor, el Amazonas', next: 'place' },
      { l: 'Нет', next: 'time' },
    ],
  },
  person: {
    q: 'Как назван человек?',
    opts: [
      {
        l: 'Титул + фамилия: señor, señora, doctor, presidente, rey…',
        h: 'La doctora Castro está en la sexta planta.',
        next: 'vocative',
      },
      { l: 'Просто имя или фамилия', h: 'Aquí trabaja Josefa.', res: 'zero', rule: 'S.name-zero' },
      { l: 'don / doña + имя', h: '¿Dónde vive don José?', res: 'zero', rule: 'S.name-zero' },
    ],
  },
  vocative: {
    q: 'Вы обращаетесь к этому человеку?',
    opts: [
      { l: 'Да, говорю с ним', h: 'Buenos días, señor Alonso.', res: 'zero', rule: 'S.name-zero' },
      { l: 'Нет, говорю о нём', h: 'El señor Alonso es mi jefe.', res: 'def', rule: 'S.name-title' },
    ],
  },
  place: {
    q: 'Артикль входит в само название?',
    hint: 'La Habana, El Escorial, La Haya, La Paz, Las Palmas, Los Ángeles, El Cairo, El Salvador, (la) India, (los) Estados Unidos, La Mancha, La Rioja, La Pampa',
    opts: [
      { l: 'Да, это одно из таких названий', res: 'asis', rule: 'S.place-exc' },
      { l: 'Нет', next: 'placekind' },
    ],
  },
  placekind: {
    q: 'Что это за место?',
    opts: [
      { l: 'Улица, площадь, проспект, бульвар', h: 'la calle Bolívar, la plaza de España', res: 'def', rule: 'S.place-art' },
      {
        l: 'Кино, театр, отель, музей, больница, университет',
        h: 'el Ritz, el Prado, la Autónoma',
        res: 'def',
        rule: 'S.place-art',
      },
      { l: 'Река, озеро, море, океан', h: 'el Tajo, el Titicaca, el Caribe, el Pacífico', res: 'def', rule: 'S.place-art' },
      { l: 'Группа островов, горы, пустыня', h: 'las Canarias, los Andes, el Sahara', res: 'def', rule: 'S.place-art' },
      { l: 'Город, регион, страна, континент', h: 'Barcelona, Galicia, Bolivia, África', res: 'zero', rule: 'S.place-zero' },
      { l: 'Отдельный остров', h: 'Mallorca, Sicilia, Jamaica', res: 'zero', rule: 'S.place-zero' },
    ],
  },
  time: {
    q: 'Это выражение времени или меры?',
    opts: [
      { l: 'Часы', h: 'Son las tres. Es la una.', res: 'def', rule: 'S.hour', form: { g: 'f' } },
      { l: 'День недели', h: 'el lunes, los domingos', next: 'weekday' },
      { l: 'Число месяца', h: 'el doce de junio', next: 'date' },
      { l: 'Месяц', h: 'Mi cumpleaños es en octubre.', res: 'zero', rule: 'S.month' },
      {
        l: 'Часть дня после por',
        h: 'por la mañana, por la tarde',
        res: 'def',
        rule: 'S.daypart',
        form: { g: 'f', n: 'sg' },
      },
      { l: 'Частота или цена за единицу', h: 'dos veces al mes, dos euros el kilo', res: 'def', rule: 'S.per' },
      { l: 'Нет', next: 'pred' },
    ],
  },
  weekday: {
    q: 'Как употреблён день недели?',
    opts: [
      { l: 'Называю, какой сегодня день', h: 'Hoy es lunes. Ayer fue domingo.', res: 'zero', rule: 'S.day-pred' },
      {
        l: 'Конкретный день',
        h: 'El domingo voy a una fiesta.',
        res: 'def',
        rule: 'S.weekday',
        form: { g: 'm', n: 'sg' },
      },
      {
        l: 'Каждый такой день, по привычке',
        h: 'Los miércoles tengo clases de español.',
        res: 'def',
        rule: 'S.weekday',
        form: { g: 'm', n: 'pl' },
      },
    ],
  },
  date: {
    q: 'Как употреблена дата?',
    opts: [
      { l: 'Называю, какое сегодня число', h: 'Hoy es cinco de marzo.', res: 'zero', rule: 'S.day-pred' },
      {
        l: 'Сразу после дня недели, у которого уже есть артикль',
        h: 'El examen es el jueves, veinte de junio.',
        res: 'zero',
        rule: 'S.after-weekday',
      },
      { l: 'Иначе', h: 'Me examino el doce de junio.', res: 'def', rule: 'S.date', form: { g: 'm', n: 'sg' } },
    ],
  },
  pred: {
    q: 'Слово стоит после ser / hacerse / querer ser и означает профессию, национальность, религию или убеждения?',
    hint: 'Soy estudiante. Chantal es francesa. Alberto se ha hecho budista.',
    opts: [
      { l: 'Да', next: 'predq' },
      { l: 'Нет', next: 'lex' },
    ],
  },
  predq: {
    q: 'Есть оценка, или это ответ на «¿Quién es…?»',
    opts: [
      {
        l: 'Есть определение-оценка',
        h: 'Es un médico extraordinario. Es una actriz muy famosa.',
        res: 'indef',
        rule: 'S.pred-un',
      },
      {
        l: 'Это ответ на «¿Quién es…?»',
        h: '¿Quién es Almodóvar? — Es un director de cine.',
        res: 'indef',
        rule: 'S.pred-un',
      },
      {
        l: 'Ни то ни другое',
        h: 'Chantal es abogada. Lenin y Stalin eran comunistas.',
        res: 'zero',
        rule: 'S.pred-zero',
      },
    ],
  },
  lex: {
    q: 'Это одно из устойчивых сочетаний?',
    opts: [
      { l: 'tocar + инструмент', h: 'tocar el piano (но tener una guitarra)', res: 'def', rule: 'S.tocar' },
      { l: 'jugar a + игра', h: 'jugar al fútbol, a las cartas', res: 'def', rule: 'S.jugar', form: { prep: 'a' } },
      {
        l: 'hablar / saber / enseñar / estudiar + язык или предмет',
        h: '¿Usted habla chino? Claudia estudia Filosofía.',
        res: 'zero',
        rule: 'S.learn',
      },
      {
        l: 'hacer + gimnasia, natación, alpinismo',
        h: 'Hago gimnasia todas las mañanas.',
        res: 'zero',
        rule: 'S.hacer',
      },
      {
        l: 'Язык или школьный предмет как тема разговора',
        h: 'El griego es una lengua muy sonora. Las matemáticas.',
        res: 'def',
        rule: 'S.subject',
      },
      { l: 'policía, ejército, bomberos', h: 'Luis quiere ingresar en la policía.', res: 'def', rule: 'S.institution' },
      {
        l: 'radio, televisión, periódico, noticias — как средство информации',
        h: 'Escucho la radio. (но Tengo una radio nueva — это аппарат)',
        res: 'def',
        rule: 'S.media',
      },
      {
        l: 'mar, campo, playa, cielo, naturaleza',
        h: 'Vamos al campo. Es muy sano bañarse en el mar.',
        res: 'def',
        rule: 'S.nature',
      },
      {
        l: 'ir / estar / venir + hospital, cine, teatro, médico, dentista, banco, trabajo, colegio, universidad, iglesia, cárcel, oficina',
        h: 'Está en el hospital. Mi hermana está en la universidad.',
        res: 'def',
        rule: 'S.go-def',
      },
      {
        l: 'ir / estar / venir + casa, correos, clase',
        h: 'Edgar está en casa. Voy a correos.',
        res: 'zero',
        rule: 'S.go-zero',
      },
      { l: 'Нет', next: 'q1' },
    ],
  },
  q1: {
    q: 'Я говорю о конкретном предмете или человеке (или о конкретной группе)?',
    opts: [
      { l: 'Да', next: 'q2' },
      { l: 'Нет', next: 'q3' },
    ],
  },
  q2: {
    q: 'Слушатель может понять, какой именно?',
    opts: [
      {
        l: 'Да: другого такого нет — в мире или в этой ситуации',
        h: 'La madre de Antonio es policía. Enciende la luz, por favor.',
        res: 'def',
        rule: 'B.I',
      },
      {
        l: 'Да: о нём уже говорили',
        h: 'Tengo un loro y un perro. El loro se llama Ricky.',
        res: 'def',
        rule: 'B.II',
      },
      {
        l: 'Нет: таких несколько или говорю впервые',
        h: 'Necesito alquilar un coche. Un hijo de Andrés es médico.',
        res: 'indef',
        rule: 'B.indef',
      },
    ],
  },
  q3: {
    q: 'Тогда что я имею в виду?',
    opts: [
      {
        l: 'Тип, вид, средство, материал',
        h: 'Voy en bicicleta. Clases de guitarra. Avión de papel.',
        next: 'eval',
        set: { z: 'C.tipo' },
      },
      {
        l: 'Какое-то количество, неважно сколько',
        h: 'Compra aceite y huevos. ¿Tienes hermanos? Lola colecciona sellos.',
        next: 'eval',
        set: { z: 'C.cantidad' },
      },
      {
        l: 'Весь класс, в общем смысле',
        h: 'El perro es el mejor amigo del hombre. Me encanta el melón.',
        res: 'def',
        rule: 'D.clase',
      },
      {
        l: 'Любого представителя класса',
        h: 'Un flexo es una lámpara. Un médico tiene que saber escuchar.',
        res: 'indef',
        rule: 'D.cualquiera',
      },
    ],
  },
  eval: {
    q: 'У слова есть оценочное определение?',
    hint: 'Оценка — «muy …», «-ísimo», «que me muero». Ответ на «какой вид?» (agua mineral, canciones tristes) оценкой не считается.',
    opts: [
      { l: 'Да', h: 'Tengo unos sellos muy raros. Aquí hacen un pan buenísimo.', res: 'indef', rule: 'C.eval' },
      { l: 'Нет', h: 'Bebemos agua mineral. Toca canciones tristes.', res: 'zero', rule: null },
    ],
  },
}

export const SCHEME_KINDS: Record<SchemeResult, { title: string; forms: string }> = {
  def: { title: 'Определённый артикль', forms: 'el · la · los · las' },
  indef: { title: 'Неопределённый артикль', forms: 'un · una · unos · unas' },
  zero: { title: 'Без артикля', forms: 'Ø' },
  lo: { title: 'Средний род', forms: 'lo' },
  asis: { title: 'Артикль как в названии', forms: 'La Habana, El Salvador, Los Ángeles…' },
}

export const DEFAULT_SCHEME_FORM: SchemeForm = { g: 'm', n: 'sg', at: false, prep: '', omit: false }

/** Форма артикля по роду, числу, ударному a-, предлогу и опущенному существительному. */
export function schemeForm(kind: 'def' | 'indef', form: SchemeForm): { article: string; notes: string[] } {
  const fem = form.g === 'f'
  const pl = form.n === 'pl'
  const tonic = fem && !pl && form.at && !form.omit
  const notes: string[] = []
  let a: string
  if (kind === 'def') a = pl ? (fem ? 'las' : 'los') : fem && !tonic ? 'la' : 'el'
  else a = pl ? (fem ? 'unas' : 'unos') : fem && !tonic ? 'una' : form.omit ? 'uno' : 'un'
  if (tonic) notes.push('ж.р. на ударное a-: el / un, но согласование остаётся женским (el agua fría)')
  if (form.omit && a === 'uno') notes.push('без существительного un → uno')
  if (form.omit && kind === 'def') notes.push('без существительного el/la/los/las — только перед прилагательным, de или que')
  if (a === 'el' && form.prep) {
    a = form.prep === 'a' ? 'al' : 'del'
    notes.push(`${form.prep} + el = ${a}`)
  }
  return { article: a, notes }
}
