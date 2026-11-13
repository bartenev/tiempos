// Алгоритм выбора артикля, версия 2 — по правилам ДВУХ учебников:
//   GBE = Gramática básica del estudiante de español (2021), гл. 5, разделы A–E
//   GDU = Gramática de uso del español A1-B2, юниты 4–11
//
// Перенесён из проекта espanol (src/algorithm-v2.mjs) без изменений логики;
// описание и блок-схемы — docs/articles/algorithm-v2.md.
//
// Устройство:
//   Шаг 1. Особые случаи (GDU 5, 8, 9, 10, 11) — по возможности формальные:
//          какое слово / какой глагол / какая конструкция. Если сработал — ядро не нужно.
//   Шаг 2. Ядро (GBE B–D = GDU 6–7): конкретный? известен ли? тип / количество / класс / любой.
//          + поправка GDU5: оценочное определение превращает Ø в un.
//   Шаг 3. Форма (GBE A, E = GDU 4, 6, 11): род/число, el/un перед ударным a-, al/del, uno.

/** Тип артикля, который выбирает алгоритм (до формы). */
export type ArticleKind = 'def' | 'indef' | 'zero' | 'lo'

export type NameKind =
  | 'person'
  | 'street'
  | 'building'
  | 'water'
  | 'islands'
  | 'mountains'
  | 'desert'
  | 'city'
  | 'region'
  | 'country'
  | 'continent'
  | 'island'

export type TimeKind = 'hour' | 'weekday' | 'date' | 'month' | 'daypart' | 'per' | 'unit'

/**
 * Признаки пропуска — ответы на вопросы дерева (разметка в source/*-annotations*.json).
 * Ядро (как в v1): ref, ident, count, subj, g, n, at, sep, prep, proper, omit, pt, given.
 */
export interface ArticleFeatures {
  /** Тип артикля задан заданием («Complete con un, una…») — проверяется только форма. */
  given?: ArticleKind
  /** concrete — конкретный предмет; type — тип/средство; quantity — количество; class — весь класс; any — любой. */
  ref?: 'concrete' | 'type' | 'quantity' | 'class' | 'any'
  /** Конкретный предмет: unique — другого нет; mentioned — уже говорили; false — новый. */
  ident?: 'unique' | 'mentioned' | false
  /** Исчисляемое (для Ø: мн.ч.) или нет. */
  count?: boolean
  /** Подлежащее-обобщение. */
  subj?: boolean
  g?: 'm' | 'f'
  n?: 'sg' | 'pl'
  /** Ж.р. на ударное a-/ha-. */
  at?: boolean
  /** Между артиклем и существительным есть слово. */
  sep?: boolean
  /** Перед артиклем предлог a / de. */
  prep?: 'a' | 'de'
  /** Артикль — часть имени собственного (не сливается с предлогом). */
  proper?: boolean
  /** Существительное опущено: перед чем стоит артикль. */
  omit?: string
  /** Pluralia tantum (gafas, tijeras). */
  pt?: boolean
  // --- признаки v2 ---
  /** «то, что…»: lo bueno, lo amargo. */
  lo?: boolean
  name?: { kind: NameKind; text?: string; title?: boolean; vocative?: boolean; don?: boolean }
  time?: { kind: TimeKind; pred?: boolean; habitual?: boolean; afterWeekday?: boolean }
  /** После ser / hacerse / quiere ser. */
  pred?: 'profession' | 'nationality' | 'religion' | 'ideology'
  /** Ответ на «¿Quién es…?» — опознаём человека по профессии. */
  identify?: boolean
  /** eval — оценочное определение («muy …», «-ísimo», famoso, de éxito). */
  qual?: 'eval'
  /** Лемма существительного (для лексических списков GDU10). */
  noun?: string
  verb?: 'tocar' | 'jugar' | 'go' | 'learn' | 'hacer'
  /** radio/televisión как аппарат, noticia как одна новость (GDU10 «PERO»). */
  device?: boolean
  /** Учебник называет язык / предмет (las matemáticas, el griego). */
  subject?: boolean
}

export const RULES = {
  // Шаг 1 — особые случаи
  'S.lo': 'GDU11: lo + прилагательное = «то, что…» → lo',
  'S.name-title': 'GDU8: señor/doctor/presidente… + фамилия → el/la',
  'S.name-zero': 'GDU8: имя, don/doña + имя, обращение → Ø',
  'S.place-art':
    'GDU8: улицы, здания (кино/отель/музей/больница/университет), реки/озёра/моря, группы островов, горы, пустыни → el/la',
  'S.place-zero': 'GDU8: города, регионы, страны, континенты, отдельные острова → Ø',
  'S.place-exc': 'GDU8: исключение — артикль входит в название (La Habana, El Salvador, El Cairo…)',
  'S.hour': 'GDU9: la/las + часы',
  'S.weekday': 'GDU9: el + день недели (конкретный) / los (привычка)',
  'S.date': 'GDU9: el + дата',
  'S.day-pred': 'GDU9: «Hoy es lunes / cinco de marzo» → Ø',
  'S.after-weekday': 'GDU9: день недели + дата — один артикль → у даты Ø',
  'S.month': 'GDU9: месяцы → Ø',
  'S.daypart': 'GDU9: por la mañana / tarde / noche',
  'S.per': 'GDU9: частота (al día, a la semana) и единицы (el kilo) → el/la',
  'S.pred-zero': 'GDU5: ser/hacerse + профессия, национальность, религия, идеология → Ø',
  'S.pred-un': 'GDU5: …но un, если есть определение или опознаём «¿Quién es…?»',
  'S.tocar': 'GDU10: tocar el/la + инструмент',
  'S.jugar': 'GDU10: jugar al/a la + игра',
  'S.learn': 'GDU10: hablar/saber/estudiar + язык/предмет → Ø',
  'S.hacer': 'GDU10: hacer gimnasia / natación → Ø',
  'S.subject': 'GDU10: las matemáticas, el griego (как предмет/язык) → el/la',
  'S.institution': 'GDU10: la policía, el ejército, los bomberos',
  'S.media': 'GDU10: la radio, la televisión, el periódico, las noticias (средство информации)',
  'S.nature': 'GDU10: el mar, el campo, la playa, el cielo, la naturaleza',
  'S.go-def':
    'GDU10: ir al / estar en el hospital, cine, médico, colegio… ir a la universidad, iglesia, cárcel…',
  'S.go-zero': 'GDU10: ir a / estar en casa, correos, clase → Ø',
  // Шаг 2 — ядро
  'B.I': 'GBE B-I / GDU6-7: другого такого нет (в мире / в ситуации) → el',
  'B.II': 'GBE B-II / GDU7: о нём уже говорили → el',
  'B.indef': 'GBE B / GDU4,7: таких несколько / впервые → un',
  'C.tipo': 'GBE C / GDU5: не конкретный предмет — тип, средство, материал → Ø',
  'C.cantidad': 'GBE C / GDU5: неопределённое количество → Ø',
  'C.num-pl': 'GBE C: исчисляемое при Ø — во мн.ч.',
  'C.num-sg': 'GBE C: неисчисляемое при Ø — в ед.ч.',
  'C.eval': 'GDU5: …но оценочное определение → un (unos sellos muy raros, un pan buenísimo)',
  'D.clase': 'GBE D / GDU6-7: весь класс, в общем смысле → el',
  'D.cualquiera': 'GBE D / GDU4: любой представитель класса → un',
  'D.sujeto': 'GBE D: подлежащее-обобщение обязательно с артиклем (проверка)',
  // Шаг 3 — форма
  'A.forma': 'GBE A / GDU4,6: форма по роду и числу',
  'A.a-tonica': 'GBE A / GDU4,6: el/un перед ж.р. ед.ч. на ударное a- (вплотную)',
  'A.a-tonica-no': 'GBE A / GDU4,6: ударное a-, но не вплотную / мн.ч. → женская форма',
  'A.contraccion': 'GBE A / GDU6: a + el = al, de + el = del',
  'A.no-contraccion': 'GBE A: артикль — часть имени собственного → не сливается (a El Cairo)',
  'A.uno': 'GBE E / GDU11: un → uno без существительного',
  'E.indef-sin-sust': 'GBE E / GDU11: una/unos/unas без существительного',
  'E.def-sin-sust': 'GBE E / GDU11: el/la/los/las без сущ. — только + прил. / de / que',
} as const

/** Код правила: `S.hour`, `B.II`, `A.contraccion`… */
export type RuleCode = keyof typeof RULES

// Лексические списки GDU8 и GDU10
const PLACE_ART = new Set<NameKind>(['street', 'building', 'water', 'islands', 'mountains', 'desert'])
const PLACE_ZERO = new Set<NameKind>(['city', 'region', 'country', 'continent', 'island'])

/** Названия, в которые артикль входит (GDU8, «PERO»). Значение: артикль; '?' — по желанию. */
export const PLACE_EXCEPTIONS: Record<string, string> = {
  Habana: 'la',
  Escorial: 'el',
  Haya: 'la',
  Paz: 'la',
  Palmas: 'las',
  Ángeles: 'los',
  Cairo: 'el',
  Salvador: 'el',
  India: 'la?',
  'Estados Unidos': 'los?',
  Mancha: 'la',
  Rioja: 'la',
  Pampa: 'la',
}

const LEX = {
  institution: ['policía', 'ejército', 'bomberos'],
  media: ['radio', 'televisión', 'periódico', 'noticias'],
  nature: ['mar', 'campo', 'playa', 'cielo', 'naturaleza'],
  goDef: [
    'hospital', 'cine', 'teatro', 'dentista', 'médico', 'banco', 'aeropuerto', 'lavabo', 'servicio', 'trabajo',
    'colegio', 'iglesia', 'universidad', 'cárcel', 'oficina',
  ],
  goZero: ['casa', 'correos', 'clase'],
}

interface Special {
  kind: ArticleKind
  rule: RuleCode
  optional?: boolean
}

// Шаг 1. Особые случаи; null — не сработал ни один.
function special(f: ArticleFeatures): Special | null {
  if (f.lo) return { kind: 'lo', rule: 'S.lo' }

  if (f.name) {
    const nm = f.name
    if (nm.kind === 'person') {
      if (nm.title && !nm.vocative && !nm.don) return { kind: 'def', rule: 'S.name-title' }
      return { kind: 'zero', rule: 'S.name-zero' }
    }
    const exc = nm.text ? PLACE_EXCEPTIONS[nm.text] : undefined
    if (exc) return { kind: 'def', rule: 'S.place-exc', optional: exc.endsWith('?') }
    if (PLACE_ART.has(nm.kind)) return { kind: 'def', rule: 'S.place-art' }
    if (PLACE_ZERO.has(nm.kind)) return { kind: 'zero', rule: 'S.place-zero' }
  }

  if (f.time) {
    const t = f.time
    switch (t.kind) {
      case 'hour':
        return { kind: 'def', rule: 'S.hour' }
      case 'weekday':
        if (t.pred) return { kind: 'zero', rule: 'S.day-pred' }
        return { kind: 'def', rule: 'S.weekday' }
      case 'date':
        if (t.pred) return { kind: 'zero', rule: 'S.day-pred' }
        if (t.afterWeekday) return { kind: 'zero', rule: 'S.after-weekday' }
        return { kind: 'def', rule: 'S.date' }
      case 'month':
        return { kind: 'zero', rule: 'S.month' }
      case 'daypart':
        return { kind: 'def', rule: 'S.daypart' }
      case 'per':
      case 'unit':
        return { kind: 'def', rule: 'S.per' }
    }
  }

  if (f.pred) {
    if (f.qual === 'eval' || f.identify) return { kind: 'indef', rule: 'S.pred-un' }
    return { kind: 'zero', rule: 'S.pred-zero' }
  }

  if (f.verb === 'tocar') return { kind: 'def', rule: 'S.tocar' }
  if (f.verb === 'jugar') return { kind: 'def', rule: 'S.jugar' }
  if (f.verb === 'learn') return { kind: 'zero', rule: 'S.learn' }
  if (f.verb === 'hacer') return { kind: 'zero', rule: 'S.hacer' }
  if (f.subject) return { kind: 'def', rule: 'S.subject' }

  if (f.noun && !f.device) {
    if (LEX.institution.includes(f.noun)) return { kind: 'def', rule: 'S.institution' }
    if (LEX.media.includes(f.noun)) return { kind: 'def', rule: 'S.media' }
    if (LEX.nature.includes(f.noun)) return { kind: 'def', rule: 'S.nature' }
    if (f.verb === 'go' && LEX.goZero.includes(f.noun)) return { kind: 'zero', rule: 'S.go-zero' }
    if (f.verb === 'go' && LEX.goDef.includes(f.noun)) return { kind: 'def', rule: 'S.go-def' }
  }
  return null
}

// Шаг 2. Ядро (как в v1) + поправка GDU5.
function core(f: ArticleFeatures, path: RuleCode[], errors: string[]): ArticleKind | null {
  if (f.given) return f.given
  switch (f.ref) {
    case 'concrete':
      if (f.ident === 'unique') {
        path.push('B.I')
        return 'def'
      }
      if (f.ident === 'mentioned') {
        path.push('B.II')
        return 'def'
      }
      path.push('B.indef')
      return 'indef'
    case 'type':
    case 'quantity':
      path.push(f.ref === 'type' ? 'C.tipo' : 'C.cantidad')
      if (f.qual === 'eval') {
        path.push('C.eval')
        return 'indef'
      }
      return 'zero'
    case 'class':
      path.push('D.clase')
      return 'def'
    case 'any':
      path.push('D.cualquiera')
      if (f.n === 'pl' && !f.pt) errors.push('D: unos/unas для «любого представителя» — только pluralia tantum')
      return 'indef'
    default:
      errors.push(`неизвестный ref: ${String(f.ref)}`)
      return null
  }
}

export interface Decision {
  /** Артикль до слияния с предлогом: el, una, Ø, lo… */
  article: string
  /** Что пишется в тексте: al / del вместо a el / de el. */
  surface: string
  /** При Ø: число существительного. */
  number?: 'sg' | 'pl'
  /** Правила, по которым шёл алгоритм, по порядку. */
  path: RuleCode[]
  errors: string[]
  /** Артикль в названии по желанию: (la) India. */
  optional?: boolean
}

export function decide(f: ArticleFeatures): Decision {
  const path: RuleCode[] = []
  const errors: string[] = []
  let kind: ArticleKind | null
  let optional = false

  const s = f.given ? null : special(f)
  if (s) {
    kind = s.kind
    path.push(s.rule)
    optional = !!s.optional
  } else kind = core(f, path, errors)
  if (!kind) return { article: '?', surface: '?', path, errors }

  if (f.subj && !f.given) path.push('D.sujeto')
  if (kind === 'lo') return { article: 'lo', surface: 'lo', path, errors }

  if (kind === 'zero') {
    if (f.subj && !s) errors.push('D.sujeto: подлежащее-обобщение не может быть без артикля')
    let number: 'sg' | 'pl' | undefined
    if (f.ref === 'quantity' && f.count !== undefined && !s) {
      number = f.count ? 'pl' : 'sg'
      path.push(f.count ? 'C.num-pl' : 'C.num-sg')
    }
    return { article: 'Ø', surface: 'Ø', number, path, errors }
  }

  // Шаг 3. Форма
  path.push('A.forma')
  const omitted = f.omit !== undefined
  const fem = f.g === 'f'
  const pl = f.n === 'pl'
  const tonicA = fem && !pl && !!f.at && !f.sep && !omitted
  if (tonicA) path.push('A.a-tonica')
  else if (fem && f.at) path.push('A.a-tonica-no')

  let article: string
  if (kind === 'def') {
    article = pl ? (fem ? 'las' : 'los') : fem && !tonicA ? 'la' : 'el'
    if (omitted) {
      path.push('E.def-sin-sust')
      if (!['adj', 'de', 'que'].includes(f.omit!)) {
        errors.push('E: el/la/los/las без существительного — только перед прил. / de / que')
      }
    }
  } else {
    if (pl) article = fem ? 'unas' : 'unos'
    else if (fem && !tonicA) article = 'una'
    else article = omitted ? 'uno' : 'un'
    if (omitted) path.push(article === 'uno' ? 'A.uno' : 'E.indef-sin-sust')
  }

  let surface = article
  const partOfName = f.proper || s?.rule === 'S.place-exc'
  if (article === 'el' && f.prep) {
    if (partOfName) path.push('A.no-contraccion')
    else {
      surface = f.prep === 'a' ? 'al' : 'del'
      path.push('A.contraccion')
    }
  }
  return { article, surface, path, errors, optional }
}
