import type { ArticleFeatures, NameKind, RuleCode } from './algorithm'
import type { ArticleItem } from './build'

/**
 * Короткое пояснение человеческим языком — одна строка вместо разбора по правилам
 * («Лаборатория» → «Короткие пояснения»): причина → ответ (и заметка о форме).
 * Причина — из разметки задания («часов в доме несколько»); если её нет, она служебная
 * или решило особое правило — фраза правила по признакам задания.
 */

/** Главное правило ядра своими словами. */
const CORE: Partial<Record<RuleCode, string>> = {
  'B.indef': 'таких много или речь об этом впервые',
  'B.I': 'другого такого нет, понятно какой',
  'B.II': 'об этом уже говорили',
  'C.tipo': 'не конкретный предмет, а вид, средство, материал',
  'C.cantidad': 'сколько-то, количество неважно',
  'D.clase': 'весь класс, в общем смысле',
  'D.cualquiera': 'любой такой, неважно какой',
}

const PLACE: Record<NameKind, string> = {
  person: 'человек',
  street: 'улица, площадь, проспект',
  building: 'кино, отель, музей, больница, университет',
  water: 'река, озеро, море',
  islands: 'группа островов',
  mountains: 'горы',
  desert: 'пустыня',
  city: 'город',
  region: 'регион',
  country: 'страна',
  continent: 'континент',
  island: 'отдельный остров',
}

const PRED: Record<NonNullable<ArticleFeatures['pred']>, string> = {
  profession: 'ser + профессия',
  nationality: 'ser + национальность',
  religion: 'ser / hacerse + религия',
  ideology: 'ser + убеждения',
}

/** Особое правило по признакам задания. */
function special(code: RuleCode, f: ArticleFeatures): string | null {
  switch (code) {
    case 'S.lo':
      return '«то, что…» — существительного нет'
    case 'S.name-title':
      return 'титул + фамилия, говорим о человеке'
    case 'S.name-zero':
      if (f.name?.vocative) return 'обращаемся к человеку'
      if (f.name?.don) return 'don / doña + имя'
      return 'просто имя или фамилия'
    case 'S.place-art':
    case 'S.place-zero':
      return f.name ? `${PLACE[f.name.kind]}` : null
    case 'S.place-exc':
      return 'артикль входит в само название'
    case 'S.hour':
      return 'который час — la / las'
    case 'S.weekday':
      return f.time?.habitual ? 'каждый такой день, по привычке' : 'конкретный день недели'
    case 'S.date':
      return 'число месяца'
    case 'S.day-pred':
      return 'называем, какой сегодня день или число'
    case 'S.after-weekday':
      return 'дата сразу после дня недели — артикль уже у дня'
    case 'S.month':
      return 'месяц'
    case 'S.daypart':
      return 'por + часть дня'
    case 'S.per':
      return f.time?.kind === 'unit' ? 'цена за единицу' : 'частота: сколько раз за период'
    case 'S.pred-zero':
      return f.pred ? PRED[f.pred] : null
    case 'S.pred-un':
      return f.identify
        ? 'ответ на «¿Quién es…?» — представляем человека по профессии'
        : `${f.pred ? PRED[f.pred] : 'ser + профессия'}, но есть оценка`
    case 'S.tocar':
      return 'tocar + инструмент'
    case 'S.jugar':
      return 'jugar a + игра'
    case 'S.learn':
      return 'говорить, знать, учить язык или предмет'
    case 'S.hacer':
      return 'hacer + gimnasia, natación'
    case 'S.subject':
      return 'язык или предмет как тема разговора'
    case 'S.institution':
      return 'la policía, el ejército, los bomberos'
    case 'S.media':
      return 'радио, телевидение, газета как средство информации'
    case 'S.nature':
      return 'mar, campo, playa, cielo, naturaleza'
    case 'S.go-def':
      return 'ir a / estar en + больница, кино, врач, школа, университет…'
    case 'S.go-zero':
      return 'ir a / estar en + casa, correos, clase'
    default:
      return null
  }
}

const NUMBER = { sg: 'ед. ч.', pl: 'мн. ч.' } as const
const GENDER = { m: 'м. р.', f: 'ж. р.' } as const

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Причина из разметки, без служебных пометок; null — пометка служебная («I», «П.3»). */
function cleanWhy(why: string | undefined): string | null {
  if (!why) return null
  const text = why
    .replace(/^[ab]: /i, '')
    .replace(/\s*\((?:→|B-)[^)]*\)/g, '')
    .trim()
  if (/^(I{1,3}|[пП]\.\s?\d+)$/.test(text)) return null
  return text
}

/** Заметка о форме: al / del, el agua, существительное опущено. */
function formNote(item: ArticleItem): string | null {
  const { path, features: f } = item
  if (path.includes('A.contraccion')) return f.prep === 'a' ? 'a + el = al' : 'de + el = del'
  if (path.includes('A.no-contraccion')) return 'артикль — часть названия, не сливается'
  if (path.includes('A.a-tonica')) return 'ж. р. на ударное a- — el / un'
  if (path.includes('A.a-tonica-no')) {
    return f.n === 'pl' ? 'ударное a-, но мн. ч. — обычная форма' : 'ударное a-, но артикль не вплотную — обычная форма'
  }
  if (path.includes('A.uno')) return 'без существительного un → uno'
  if (path.includes('E.def-sin-sust') || path.includes('E.indef-sin-sust')) return 'существительное опущено'
  return null
}

export function briefOf(item: ArticleItem): string {
  const { path, features: f } = item
  const main = path[0]!
  let reason: string
  if (item.category === 'form') {
    // тип артикля задан заданием — решают род и число
    const gn = f.g && f.n ? `${GENDER[f.g]}, ${NUMBER[f.n]}` : 'род и число'
    const why = cleanWhy(item.coreWhy)
    reason = why ? `${why} (${gn})` : `нужна только форма: ${gn}`
  } else if (path.includes('C.eval')) {
    const extra = item.extraWhy && item.extraWhy.length <= 30 ? ` (${item.extraWhy})` : ''
    reason = `${CORE[main] ?? ''}, но есть оценка${extra}`
  } else if (main.startsWith('S.')) {
    // особые правила формальные: фраза правила точнее разметки ядра
    reason = special(main, f) ?? ''
  } else {
    reason = cleanWhy(item.coreWhy) ?? CORE[main] ?? ''
  }
  const answer = item.answer === 'Ø' ? 'без артикля' : item.answer.split(' / ').map((a) => (a === 'Ø' ? a : a.toLowerCase())).join(' / ')
  const note = formNote(item)
  return `${capitalize(reason)} → ${answer}${note ? ` (${note})` : ''}.`
}
