// Задания тренажёра артиклей из упражнений двух учебников.
// Перенесено из проекта espanol (scripts/build-trainer.mjs) без изменений логики:
// каждый пропуск = одно задание; остальные пропуски пункта заполнены по ключу;
// ответ алгоритма v2 обязан совпасть с ключом — иначе сборка падает.
import type { ArticleFeatures, RuleCode } from './algorithm'
import { decide } from './algorithm'

/** Учебник-источник: GBE — Gramática básica del estudiante, GDU — Gramática de uso A1-B2. */
export type ArticleBook = 'GBE' | 'GDU'

// ---------- Исходные данные (src/data/articles/source/*.json) ----------

interface RawBlank {
  /** Допустимые ответы в нижнем регистре; 'Ø' — без артикля. */
  accept: string[]
  /** Ответ, как он напечатан в ключе. */
  key: string
  /** Слитная форма с предлогом: al / del. */
  surface?: string
  /** Слово, которое упражнение просит вписать вместе с артиклем. */
  noun?: string
  /** Варианты на выбор, если упражнение их даёт. */
  options?: string[]
}

interface RawItem {
  id: string
  example?: boolean
  context?: string
  text?: string
  blanks?: RawBlank[]
  /** «В учебнике без артиклей» — исходная фраза для correct_text. */
  original?: string
  // match_pair / true_false / classify
  target?: string
  article?: string
  answer?: string | number
  statement?: string
  // drop_noun
  phrases?: { phrase: string; answer: string }[]
}

interface RawExercise {
  id: string
  number: number | string
  page: number
  level?: string
  section: string
  type: string
  instruction: string
  note?: string
  text?: string
  items?: RawItem[]
  groups?: { options: Record<string, string>; items: RawItem[] }[]
  categories?: Record<string, string>
  /** false — упражнение не на артикли (пропускаем). */
  article_task?: boolean
}

export interface RawBookData {
  source: { id: ArticleBook; book: string; chapter: string; pages: string; key_pages: string }
  sections: { id: string; page: number; title: string; summary: string }[]
  exercises: RawExercise[]
}

/** Разметка пропуска: признаки для дерева + пояснения. */
type RawAnnotation = ArticleFeatures & {
  why?: string
  gap?: string | null
  alt?: { why: string } & Partial<ArticleFeatures>
}

export interface RawAnnotations {
  blanks: Record<string, RawAnnotation>
  items?: Record<string, RawAnnotation>
  phrases?: Record<string, RawAnnotation>
}

export interface ArticleSource {
  book: ArticleBook
  data: RawBookData
  /** Основная разметка (v1). */
  annotations: RawAnnotations
  /** Признаки v2 поверх основной разметки. */
  overlay: RawAnnotations
}

// ---------- Результат ----------

/** Тема старой страницы-тренажёра: по первому сработавшему правилу. */
export type LegacyCategory =
  | 'form'
  | 'lo'
  | 'names'
  | 'time'
  | 'pred'
  | 'lex'
  | 'concrete'
  | 'zero'
  | 'general'
  | 'other'

/** Одно задание: один пропуск в предложении из учебника. */
export interface ArticleItem {
  /**
   * Постоянный id = ссылка на учебник: `GDU7-2.5#1` — Gramática de uso, юнит 7,
   * упражнение 7.2, пункт 5, пропуск 1; `GBE5-04.2#1` — Gramática básica, гл. 5, упр. 4, пункт 2.
   */
  id: string
  book: ArticleBook
  /** Номер упражнения в учебнике: `4` (GBE) или `7.2` (GDU). */
  exercise: string
  /** Раздел учебника: `A`…`E` (GBE) или номер юнита (GDU). */
  section: string
  /** Ситуация / пояснение к пункту. */
  context?: string
  /** Текст до пропуска (остальные пропуски уже заполнены по ключу). */
  before: string
  /** Текст после пропуска. */
  after: string
  /** Верные ответы в нижнем регистре; 'Ø' — без артикля. */
  accept: string[]
  /** Ответ, как его показываем: «un / unos», «del». */
  answer: string
  /** Варианты на выбор, если их даёт само упражнение. */
  options?: string[]
  /** Путь по алгоритму v2: коды правил по порядку. */
  path: RuleCode[]
  /** Почему так размечено. */
  why?: string
  /** Спорное место: другая честная трактовка, при которой выйдет другой артикль. */
  alt?: string
  /** Признак при разметке выбирал составитель — пояснение. */
  judgment?: string
  category: LegacyCategory
  /** «Почему» из основной разметки (вопросы ядра: конкретный? известен?). */
  coreWhy?: string
  /** «Почему» из разметки v2 (особые случаи, оценка). */
  extraWhy?: string
  /** Признаки, по которым решал алгоритм (разметка + v2) — для короткого пояснения. */
  features: ArticleFeatures
}

/** Упражнение учебника: его условие и где оно в книге. */
export interface ArticleExercise {
  book: ArticleBook
  /** Номер упражнения: `4`, `7.2`. */
  number: string
  section: string
  instruction: string
  page: number
}

/** Места, где признак v2 выбирал составитель (см. docs/articles/algorithm-v2.md). */
const JUDGMENT: Record<string, string> = {
  'GBE5-02.1#1':
    'Придаточное «que me muero» засчитано как оценочное определение (GDU5 показывает правило только на прилагательных).',
  'GDU7-2.2#3':
    'Засчитано как опознание по профессии; по общему правилу после ser было бы Ø, но в упражнении выбор только el/un.',
  'GDU4-4.6#1': 'Решение «аппарат, а не средство информации» — за человеком.',
  'GDU7-2.6#1': 'Решение «аппарат, а не средство информации» — за человеком.',
  'GDU10-2.12#1': 'Решение «аппарат, а не средство информации» — за человеком.',
  'GBE5-10.4#6': '«Casa Terror» отнесено к названиям заведений.',
}

/** Нижний регистр, но «Ø» остаётся «Ø». */
const low = (s: string): string => (s === 'Ø' ? s : s.toLowerCase())

const SLOT = '\u0000'
const clean = (s: string): string => s.replace(/ {2,}/g, ' ').replace(/^ /, '').replace(/ ([.,;:!?])/g, '$1')
const startsWithNoun = (after: string, noun: string): boolean =>
  after.trimStart().toLowerCase().startsWith(noun.toLowerCase())
const cap = (s: string): string => s.replace(/^(\s*)(\S)/, (_, sp: string, c: string) => sp + c.toUpperCase())

function atSentenceStart(text: string, offset: number): boolean {
  const prev = text.slice(0, offset).replace(/\{\d+\}/g, 'x').trimEnd()
  return prev === '' || /[.!?¿¡—:]$/.test(prev)
}

/** Подставляет ответы ключа во все пропуски, кроме текущего; добавляет слово из рамки, если в тексте его нет. */
function fillText(text: string, blanks: RawBlank[], current: number): string {
  return text.replace(/\{(\d+)\}/g, (m: string, k: string, offset: number) => {
    const n = Number(k)
    const b = blanks[n - 1]
    const after = text.slice(offset + m.length)
    const noun = b?.noun && !startsWithNoun(after, b.noun) ? ' ' + b.noun : ''
    if (n === current) return SLOT + noun
    const a = b?.surface ?? b?.accept[0]
    const rep = (a === 'Ø' || a === undefined ? '' : a) + noun
    return atSentenceStart(text, offset) ? cap(rep) : rep
  })
}

function category(path: RuleCode[], given: boolean): LegacyCategory {
  const p = path[0] ?? ''
  if (given) return 'form'
  if (p === 'S.lo') return 'lo'
  if (/^S\.(name|place)/.test(p)) return 'names'
  if (/^S\.(hour|weekday|date|day-pred|after-weekday|month|daypart|per)/.test(p)) return 'time'
  if (/^S\.pred/.test(p)) return 'pred'
  if (p.startsWith('S.')) return 'lex'
  if (p.startsWith('B.')) return 'concrete'
  if (p.startsWith('C.')) return 'zero'
  if (p.startsWith('D.')) return 'general'
  return 'other'
}

/** Все задания обоих учебников. Бросает ошибку, если алгоритм где-то разошёлся с ключом. */
export function buildArticles(sources: ArticleSource[]): {
  items: ArticleItem[]
  exercises: ArticleExercise[]
} {
  const items: ArticleItem[] = []
  const exercises: ArticleExercise[] = []

  for (const { book, data, annotations: ann, overlay } of sources) {
    const ov = overlay.blanks

    const push = (
      ex: RawExercise,
      id: string,
      base: RawAnnotation | undefined,
      o: RawAnnotation | undefined,
      ctx: string,
      sentence: string,
      accept: string[],
      display: string,
      options?: string[],
      nextWord?: string,
    ) => {
      if (!base) throw new Error(`нет разметки для ${id}`)
      const f: ArticleFeatures = { ...base, ...(o ?? {}) }
      if (f.noun === undefined && nextWord) f.noun = nextWord
      const r = decide(f)
      const ok = accept.includes(low(r.surface)) || accept.includes(low(r.article))
      if (!ok) throw new Error(`v2 не совпал с ключом: ${id} (${r.article} vs ${accept.join(', ')})`)
      const special = r.path[0]?.startsWith('S.')
      const why = [base.why, o?.why].filter(Boolean).join(' · ')
      if (!sentence.includes(SLOT)) throw new Error(`в тексте не нашлось места пропуска: ${id}`)
      const [before, after] = sentence.split(SLOT)
      items.push({
        id,
        book,
        exercise: String(ex.number),
        section: ex.section,
        context: ctx || undefined,
        before: clean(before ?? ''),
        after: clean(after ?? '').replace(/^([^\s.,;:!?])/, ' $1'),
        accept,
        answer: display,
        options,
        path: r.path,
        why: why || undefined,
        alt: !special && base.alt ? base.alt.why : undefined,
        judgment: JUDGMENT[id],
        category: category(r.path, !!base.given),
        coreWhy: base.why || undefined,
        extraWhy: o?.why || undefined,
        features: f,
      })
    }

    for (const ex of data.exercises) {
      if (ex.article_task === false) continue
      exercises.push({
        book,
        number: String(ex.number),
        section: ex.section,
        instruction: ex.instruction,
        page: ex.page,
      })
      const list: (RawItem & { _g?: { options: Record<string, string> } })[] = ex.groups
        ? ex.groups.flatMap((g) => g.items.map((it) => ({ ...it, _g: g })))
        : ex.items!

      for (const it of list) {
        if (ex.type === 'match_pair') {
          const target = it.target!
          const sentence = it.text!.replace(target, SLOT + target.split(' ').slice(1).join(' '))
          const situation = it._g!.options[String(it.answer)]
          push(ex, it.id, ann.items?.[it.id], undefined, `Ситуация: ${situation}`, sentence, [low(it.article!)], it.article!)
          continue
        }
        if (ex.type === 'true_false') {
          const target = it.target!
          const contracted = target.startsWith('del ')
          const blanked = target.replace(/^\S+/, SLOT)
          const sentence = ex.text!.replace(target, blanked).replace(/ \((?:→|\d+)\)/g, '')
          const acc = contracted ? ['del'] : [low(it.article!)]
          const known = `Известно: «${it.statement}» — ${it.answer === 'sí' ? 'верно' : 'неверно'}.`
          push(ex, it.id, ann.items?.[it.id], undefined, known, sentence, acc, acc[0]!)
          continue
        }
        if (ex.type === 'classify') {
          const target = it.target!
          const repl = it.article === 'Ø' ? SLOT + target : SLOT + target.split(' ').slice(1).join(' ')
          const sentence = it.text!.replace(target, repl)
          const sense = `Смысл: ${ex.categories![String(it.answer)]}`
          push(ex, it.id, ann.items?.[it.id], undefined, sense, sentence, [low(it.article!)], it.article!)
          continue
        }
        if (ex.type === 'drop_noun') {
          const phrases = it.phrases!
          phrases.forEach((p, i) => {
            const id = `${it.id}#${i + 1}`
            let text = it.text!
            phrases.forEach((q, j) => {
              const rest = q.answer.split(' ').slice(1).join(' ')
              text = text.replace(q.phrase, j === i ? SLOT + (rest ? ' ' + rest : '') : q.answer)
            })
            const first = p.answer.split(' ')[0]!
            const ctx = `Существительное опускается: «${p.phrase}» → ?`
            push(ex, id, ann.phrases?.[id], undefined, ctx, text, [first.toLowerCase()], first)
          })
          continue
        }
        it.blanks!.forEach((b, i) => {
          const id = `${it.id}#${i + 1}`
          let sentence: string
          if (it.text) sentence = fillText(it.text, it.blanks!, i + 1)
          else {
            // общий текст упражнения, по одному пропуску на пункт (GBE упр. 7)
            const k = Number(it.id.split('.').pop())
            const byNum = Object.fromEntries(
              ex.items!.map((x) => [Number(x.id.split('.').pop()), x.blanks![0]!]),
            ) as Record<number, RawBlank>
            sentence = ex.text!.replace(/\{(\d+)\}/g, (_, n: string) =>
              Number(n) === k ? SLOT + ' ' + byNum[Number(n)]!.noun : byNum[Number(n)]!.noun!,
            )
          }
          const accept = b.surface ? [b.surface] : b.accept.map(low)
          const display = b.surface ?? b.accept.join(' / ')
          const options = b.options ? b.options.map(low) : undefined
          const after = (it.text ?? '').split(`{${i + 1}}`)[1] ?? ''
          const nextWord =
            after
              .trim()
              .split(/\s+/)[0]
              ?.replace(/[.,;:!?¡¿“”"()]/g, '')
              .toLowerCase() || undefined
          const ctx = [it.context, it.original ? `В учебнике без артиклей: «${it.original}»` : null]
            .filter(Boolean)
            .join(' · ')
          push(ex, id, ann.blanks[id], ov[id], ctx, sentence, accept, display, options, nextWord)
        })
      }
    }
  }
  return { items, exercises }
}
