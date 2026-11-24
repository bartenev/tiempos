import type { CardReason, DrillCard, Person, SessionConfig, Tense, Verb, VerbGroup } from '../types'
import { TENSE_LABELS, VERB_GROUPS, personLabel } from '../types'
import type { Pattern } from './patterns'
import { PATTERN_LABELS, portionOf } from './patterns'
import { portionKey, portionStatuses } from './portions'
import type { Cell } from './session'
import { buildSession, cellsForConfig, makeCard, shuffle } from './session'
import type { RunStore } from './runs'
import { loadRuns } from './runs'
import type { StatsStore } from './stats'
import { cellKey, loadStats, parseCellKey } from './stats'
import { findVerb } from '../data/verbs'
import type { Timing } from './timing'
import { loadTimings } from './timing'

/**
 * Темп в умном режиме: формы вспоминаются не только верно, но и быстро.
 *
 * Группа — то, что учится одним правилом: клетка «Таблиц» (время × лицо × -ar/-er/-ir)
 * или модель неправильности времени (presente e→ie, indefinido «основа на -u-»).
 * По каждому ответу считается «медленность» — во сколько раз дольше вашего обычного
 * быстрого ответа (log2: 0 — как обычно быстро, 1 — вдвое дольше). По группе — скользящее
 * среднее: свежие ответы весят больше, после паузы первый ответ почти заменяет старое.
 *
 * Сессия: сначала разогрев — медленные группы (и с прошлого раза тоже) и проба остывших,
 * не больше POOL_SIZE групп сразу, вперемешку с обычной умной очередью. Группа уходит
 * из разогрева, когда снова быстрая. Новое не вводится, пока есть медленные группы.
 */

/** Медленный ответ: вдвое дольше обычного быстрого. */
export const SLOW = 1
/** Из разогрева группа уходит, когда среднее не дольше ~1.5× обычного. */
export const FAST = 0.6
/** Ошибка — как очень медленный ответ. */
export const ERROR_SLOWNESS = 2
/** Пределы одного ответа: отвлеклись на 40 с — группа не должна «утонуть». */
const MIN_SLOWNESS = -1
const MAX_SLOWNESS = 2.5

/** Вес нового ответа в среднем по группе. */
const ALPHA = 0.4
/** Вес первого ответа после паузы: старый темп уже мало что говорит. */
const ALPHA_AFTER_GAP = 0.75

/** Группа остыла: столько не было ответов. */
export const COLD_MS = 2 * 24 * 60 * 60 * 1000

/** Сколько групп разогревается одновременно — пул растёт постепенно, а не всё сразу. */
export const POOL_SIZE = 3
/** Сколько остывших групп проверять за сессию — остальные дождутся следующей. */
export const PROBE_LIMIT = 15
/** Доля карточек разогрева, пока он идёт; остальное — обычная умная очередь. */
export const WARM_SHARE = 0.7

/** Эталон — 25-й процентиль верных ответов (ваш быстрый темп) из последних BASE_WINDOW. */
const BASE_WINDOW = 300
const BASE_MIN_SAMPLES = 20
/** Пока ответов мало — запасной эталон, ms. */
export const DEFAULT_BASE: Record<'text' | 'oral', number> = { text: 3000, oral: 2000 }

/** Чтение предложения: поправка на длину относительно обычного предложения. */
const READ_MS_PER_CHAR = 30
const REF_LEN = 40

/** Усталость: после стольких ответов сравниваем последние FATIGUE_WINDOW с лучшим отрезком. */
const FATIGUE_MIN_ANSWERS = 25
const FATIGUE_WINDOW = 10
const FATIGUE_DROP = 0.5

const groupCache = new Map<string, string>()

/** Группа формы: клетка «Таблиц» по окончанию или модель неправильности времени. */
export function groupOf(verb: Verb, tense: Tense, person: Person): string {
  const cacheKey = cellKey(verb.infinitive, tense, person)
  const cached = groupCache.get(cacheKey)
  if (cached) return cached
  const portion = portionOf(verb, tense, person)
  const key = (VERB_GROUPS as string[]).includes(portion)
    ? `${tense}|${portion as VerbGroup}|${person}`
    : `${tense}|${portion}`
  groupCache.set(cacheKey, key)
  return key
}

/** Группа — клетка «Таблиц» (правило окончаний), а не модель неправильности. */
export function isTableGroup(key: string): boolean {
  return key.split('|').length === 3
}

/** Группа по ключу формы из лога; null — глагола больше нет в банке. */
export function groupOfKey(key: string): string | null {
  const { infinitive, tense, person } = parseCellKey(key)
  const verb = findVerb(infinitive)
  if (!verb) return null
  try {
    return groupOf(verb, tense, person)
  } catch {
    // формы больше нет (у глагола убрали время) — ответ не считаем
    return null
  }
}

function adjusted(t: Timing): number {
  return Math.max(t.ms * 0.5, t.ms - READ_MS_PER_CHAR * (t.len - REF_LEN))
}

/** Обычный быстрый ответ, ms: отдельно устно и текстом. */
export function baseline(timings: Timing[], oral: boolean): number {
  const ms = timings
    .filter((t) => t.oral === oral && t.ok && !t.retry)
    .slice(-BASE_WINDOW)
    .map(adjusted)
    .sort((a, b) => a - b)
  if (ms.length < BASE_MIN_SAMPLES) return DEFAULT_BASE[oral ? 'oral' : 'text']
  return Math.max(300, ms[Math.floor(ms.length * 0.25)]!)
}

export interface Baselines {
  text: number
  oral: number
}

export function baselines(timings: Timing[]): Baselines {
  return { text: baseline(timings, false), oral: baseline(timings, true) }
}

/** Медленность ответа: log2(время / эталон), ошибка — ERROR_SLOWNESS. */
export function slowness(t: Timing, base: Baselines): number {
  if (!t.ok) return ERROR_SLOWNESS
  const s = Math.log2(adjusted(t) / (t.oral ? base.oral : base.text))
  return Math.min(MAX_SLOWNESS, Math.max(MIN_SLOWNESS, s))
}

export interface GroupTempo {
  /** Скользящая медленность; null — ответов со временем ещё не было. */
  ewma: number | null
  /** В разогреве: стала медленной и ещё не стала быстрой (с прошлых сессий тоже). */
  hot: boolean
  /** Последний ответ до начала сессии (ms); null — не было. */
  lastBefore: number | null
  /** Ответов со временем в этой сессии. */
  inSession: number
}

/** Темп групп по логу ответов. Повторы после ошибки не считаются: форма была на экране. */
export function groupTempos(timings: Timing[], sessionStart: number, base: Baselines = baselines(timings)) {
  const groups = new Map<string, GroupTempo & { last: number | null }>()
  const keyGroup = new Map<string, string | null>()
  for (const t of timings) {
    if (t.retry) continue
    if (!keyGroup.has(t.k)) keyGroup.set(t.k, groupOfKey(t.k))
    const key = keyGroup.get(t.k)
    if (!key) continue
    const g = groups.get(key) ?? { ewma: null, hot: false, lastBefore: null, inSession: 0, last: null }
    const s = slowness(t, base)
    const gap = g.last !== null && t.at - g.last >= COLD_MS
    const alpha = gap ? ALPHA_AFTER_GAP : ALPHA
    g.ewma = g.ewma === null ? s : g.ewma + alpha * (s - g.ewma)
    if (g.ewma > SLOW) g.hot = true
    else if (g.ewma <= FAST) g.hot = false
    if (t.at < sessionStart) g.lastBefore = t.at
    else g.inSession += 1
    g.last = t.at
    groups.set(key, g)
  }
  return groups as Map<string, GroupTempo>
}

/**
 * Группа в разогреве и почему: slow — медленно; cold — давно не было;
 * probe — темп ещё не мерили (ответы были до записи времени).
 */
export interface PoolGroup {
  key: string
  reason: 'slow' | 'cold' | 'probe'
}

export interface TempoState {
  /** Что разогревается сейчас (не больше POOL_SIZE). */
  pool: PoolGroup[]
  /** Медленных групп в фильтре (пока они есть, новое ждёт). */
  slow: number
  /** Остывших групп, которые ещё можно проверить в этой сессии. */
  cold: number
  /** Все медленные группы фильтра (и в разогреве, и ждущие очереди). */
  hot: string[]
}

interface Context {
  cells: Cell[]
  timings: Timing[]
  sessionStart: number
  now: number
}

/** Группы фильтра, в которых уже отвечали (хоть с ошибкой), — их и можно разогревать. */
function knownGroups(cells: Cell[]): Set<string> {
  const known = new Set<string>()
  for (const c of cells) if (c.stat) known.add(groupOf(c.verb, c.tense, c.person))
  return known
}

/** Последний ответ по группе до сессии — из статистики форм (у старых ответов времени нет). */
function lastSeen(cells: Cell[], sessionStart: number): Map<string, number> {
  const last = new Map<string, number>()
  for (const c of cells) {
    if (!c.stat || c.stat.last >= sessionStart) continue
    const key = groupOf(c.verb, c.tense, c.person)
    last.set(key, Math.max(last.get(key) ?? 0, c.stat.last))
  }
  return last
}

export function tempoState({ cells, timings, sessionStart }: Context): TempoState {
  const tempos = groupTempos(timings, sessionStart)
  const known = knownGroups(cells)
  const seen = lastSeen(cells, sessionStart)

  // в процессе (уже разогревали в этой сессии) → медленные с прошлого раза → проба остывших
  const inProgress: PoolGroup[] = []
  const slowBefore: { key: string; ewma: number }[] = []
  const cold: { key: string; last: number; reason: 'cold' | 'probe' }[] = []
  let probed = 0
  const hot: string[] = []
  for (const key of known) {
    const t = tempos.get(key)
    const last = Math.max(t?.lastBefore ?? 0, seen.get(key) ?? 0)
    const stale = sessionStart - last >= COLD_MS
    const wasCold = stale || !t?.lastBefore
    const touched = (t?.inSession ?? 0) > 0
    if (wasCold && touched) probed += 1
    if (t?.hot) {
      hot.push(key)
      if (touched) inProgress.push({ key, reason: 'slow' })
      else slowBefore.push({ key, ewma: t.ewma! })
    } else if (wasCold && !touched) {
      cold.push({ key, last, reason: stale ? 'cold' : 'probe' })
    }
  }
  slowBefore.sort((a, b) => b.ewma - a.ewma)
  cold.sort((a, b) => a.last - b.last)
  const probes = cold.slice(0, Math.max(0, PROBE_LIMIT - probed))

  const pool: PoolGroup[] = [
    ...inProgress,
    ...slowBefore.map(({ key }) => ({ key, reason: 'slow' as const })),
    ...probes.map(({ key, reason }) => ({ key, reason })),
  ].slice(0, POOL_SIZE)
  return { pool, slow: inProgress.length + slowBefore.length, cold: probes.length, hot }
}

/**
 * Усталость: после FATIGUE_MIN_ANSWERS ответов в сессии последние FATIGUE_WINDOW
 * заметно медленнее лучшего такого же отрезка — замедлилось всё, а не одна группа.
 */
export function isTired(timings: Timing[], sessionStart: number): boolean {
  const base = baselines(timings)
  const session = timings.filter((t) => t.at >= sessionStart && !t.retry).map((t) => slowness(t, base))
  if (session.length < FATIGUE_MIN_ANSWERS) return false
  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!
  let best = Infinity
  for (let i = FATIGUE_WINDOW; i <= session.length - FATIGUE_WINDOW; i++) {
    best = Math.min(best, median(session.slice(i - FATIGUE_WINDOW, i)))
  }
  return median(session.slice(-FATIGUE_WINDOW)) - best >= FATIGUE_DROP
}

/** Форма группы для разогрева: у клетки — другой глагол, давно не виденный; у модели — знакомая форма. */
function pickForm(cells: Cell[], key: string, avoid: Set<string>): Cell | null {
  const inGroup = cells.filter((c) => groupOf(c.verb, c.tense, c.person) === key)
  // у модели неправильности незнакомая форма — это новое, а не разогрев
  const pool = (isTableGroup(key) ? inGroup : inGroup.filter((c) => c.stat)).filter(
    (c) => !avoid.has(cellKey(c.verb.infinitive, c.tense, c.person)),
  )
  if (pool.length === 0) return null
  const seen = (c: Cell) => c.stat?.last ?? -Infinity
  return shuffle(pool).sort((a, b) => seen(a) - seen(b))[0]!
}

function cardKeyOf(card: DrillCard): string {
  return cellKey(card.verb.infinitive, card.tense, card.person)
}

function backlogReason(card: DrillCard, stats: StatsStore): CardReason | undefined {
  const stat = stats[cardKeyOf(card)]
  if (!stat) return 'new'
  if (stat.bad > 0 && stat.streak === 0) return 'weak'
  return undefined
}

export interface TempoSession {
  /** Следующая карточка: upcoming — уже стоят в очереди, recent — последние показанные. */
  next(upcoming: DrillCard[], recent: DrillCard[]): DrillCard
  /** Состояние разогрева сейчас. */
  state(): TempoState & { tired: boolean }
  /**
   * Новая форма из ещё не освоенной порции — ключ порции; иначе null
   * (новый глагол по знакомому правилу — это не «новое»).
   */
  newPortion(card: DrillCard): string | null
}

export interface TempoSources {
  stats?: () => StatsStore
  runs?: () => RunStore
  timings?: () => Timing[]
  now?: () => number
  random?: () => number
}

/**
 * Умная сессия с темпом: каждая карточка выбирается по свежему логу ответов.
 * Обычная умная очередь (порции, слабые, клетки «Таблиц») — запас по CHUNK карточек.
 */
export function createTempoSession(
  config: SessionConfig,
  sessionStart: number,
  sources: TempoSources = {},
): TempoSession {
  const getStats = sources.stats ?? loadStats
  const getRuns = sources.runs ?? loadRuns
  const getTimings = sources.timings ?? loadTimings
  const now = sources.now ?? Date.now
  const random = sources.random ?? Math.random
  let backlog: DrillCard[] = []

  function context(): Context & { stats: StatsStore } {
    const stats = getStats()
    return { cells: cellsForConfig(config, stats), timings: getTimings(), sessionStart, now: now(), stats }
  }

  function fromBacklog(
    stats: StatsStore,
    gateNew: boolean,
    avoid: Set<string>,
    pool: PoolGroup[] = [],
  ): DrillCard | null {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (backlog.length === 0) backlog = buildSession({ ...config, mode: 'smart', size: 10 }, stats, getRuns())
      const i = backlog.findIndex((c) => !avoid.has(cardKeyOf(c)) && !(gateNew && !stats[cardKeyOf(c)]))
      if (i !== -1) {
        const [card] = backlog.splice(i, 1)
        // форма из группы разогрева — та же подпись, что у разогрева
        const inPool = pool.find((g) => g.key === groupOf(card!.verb, card!.tense, card!.person))
        const reason = inPool?.reason ?? backlogReason(card!, stats)
        return reason ? { ...card!, reason } : card!
      }
      backlog = []
    }
    return null
  }

  return {
    next(upcoming, recent) {
      const ctx = context()
      const state = tempoState(ctx)
      const avoid = new Set([...upcoming, ...recent.slice(-3)].map(cardKeyOf))
      const lastGroups = new Set(
        [...recent.slice(-1), ...upcoming.slice(-1)].map((c) => groupOf(c.verb, c.tense, c.person)),
      )

      // проба остывшей группы — одна карточка: следующую решит её результат
      const queued = new Set(upcoming.map((c) => groupOf(c.verb, c.tense, c.person)))
      const open = state.pool.filter((g) => g.reason === 'slow' || !queued.has(g.key))

      const warm = () => {
        const groups = open.filter((g) => !lastGroups.has(g.key))
        for (const g of shuffle(groups.length > 0 ? groups : open)) {
          const cell = pickForm(ctx.cells, g.key, avoid)
          if (cell) return { ...makeCard(cell.verb, cell.tense, cell.person), reason: g.reason }
        }
        return null
      }

      const card =
        (state.pool.length > 0 && random() < WARM_SHARE ? warm() : null) ??
        fromBacklog(ctx.stats, state.slow > 0, avoid, state.pool) ??
        warm() ??
        fromBacklog(ctx.stats, false, new Set())
      if (!card) throw new Error('Нет форм для выбранного фильтра')
      return card
    },
    state() {
      const ctx = context()
      return { ...tempoState(ctx), tired: isTired(ctx.timings, sessionStart) }
    },
    newPortion(card) {
      if (card.retry || card.sibling || card.reason !== 'new') return null
      const ctx = context()
      if (ctx.stats[cardKeyOf(card)]) return null
      const key = portionKey(card.tense, portionOf(card.verb, card.tense, card.person))
      const status = portionStatuses(ctx.cells).find((s) => portionKey(s.tense, s.portion) === key)
      return status && status.state !== 'mastered' ? key : null
    },
  }
}

/**
 * Медленные клетки «Таблиц» (в разогреве) по всему логу — ключи runKey (`ar|presente|yo`):
 * такая клетка не зеленее жёлтой, пока не разгонитесь.
 */
export function slowTableCells(timings: Timing[] = loadTimings()): Set<string> {
  const slow = new Set<string>()
  for (const [key, tempo] of groupTempos(timings, Infinity)) {
    if (!tempo.hot || !isTableGroup(key)) continue
    const [tense, group, person] = key.split('|')
    slow.add(`${group}|${tense}|${person}`)
  }
  return slow
}

/** Подпись группы: «Presente · -ar · yo», «Presente · e → ie». */
export function groupLabel(key: string): string {
  const parts = key.split('|')
  const tense = parts[0] as Tense
  if (parts.length === 3) {
    return `${TENSE_LABELS[tense]} · -${parts[1]} · ${personLabel(tense, parts[2] as Person)}`
  }
  return `${TENSE_LABELS[tense]} · ${PATTERN_LABELS[parts[1] as Pattern] ?? parts[1]}`
}

/** Подпись порции: «Indefinido · -ar», «Presente · e → ie». */
export function portionLabel(key: string): string {
  const [tense, portion] = key.split('|') as [Tense, string]
  const name = (VERB_GROUPS as string[]).includes(portion)
    ? `-${portion}`
    : (PATTERN_LABELS[portion as Pattern] ?? portion)
  return `${TENSE_LABELS[tense]} · ${name}`
}

/** Темп группы за сессию: время вспоминания первого и последнего верного ответа, ms. */
export interface TempoRow {
  key: string
  label: string
  before: number
  after: number
}

/** Сколько групп показывать в итоге: самые ускорившиеся. */
export const TEMPO_ROWS = 5

/**
 * «Было → стало» по группам за сессию: группы, где было хотя бы два верных ответа
 * (без повторов после ошибки), — самые ускорившиеся первыми.
 */
export function sessionTempo(
  timings: Timing[],
  sessionStart: number,
  sessionEnd: number = Infinity,
): TempoRow[] {
  const byGroup = new Map<string, Timing[]>()
  for (const t of timings) {
    if (t.at < sessionStart || t.at > sessionEnd || t.retry || !t.ok) continue
    const key = groupOfKey(t.k)
    if (!key) continue
    const list = byGroup.get(key)
    if (list) list.push(t)
    else byGroup.set(key, [t])
  }
  const rows: TempoRow[] = []
  for (const [key, list] of byGroup) {
    if (list.length < 2) continue
    rows.push({ key, label: groupLabel(key), before: list[0]!.ms, after: list[list.length - 1]!.ms })
  }
  return rows.sort((a, b) => b.before - b.after - (a.before - a.after)).slice(0, TEMPO_ROWS)
}
