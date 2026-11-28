import type { SessionConfig } from '../types'
import { TENSE_LABELS, VERB_GROUPS } from '../types'
import type { Pattern } from './patterns'
import { PATTERN_LABELS } from './patterns'
import { portionStatuses } from './portions'
import type { RunStore } from './runs'
import { GREEN_RUN, loadRuns } from './runs'
import { cellsForConfig, unfinishedTables } from './session'
import type { StatsStore } from './stats'
import { loadStats } from './stats'
import { GATE_NEW_SLOW, tempoState } from './tempo'
import type { Timing } from './timing'
import { loadTimings } from './timing'

/**
 * Состав умной сессии под выбранный фильтр — для главной: есть ли что учить
 * или выбор пора расширить. Считается теми же функциями, что и сама сессия.
 */

/** Меньше стольких форм в выборе — они будут часто повторяться. */
export const THIN_FORMS = 15

export type PoolHint = 'nothing' | 'no-new' | 'thin' | 'new-waits'

export interface PoolOverview {
  /** Форм в выборе. */
  forms: number
  /** Незелёных начатых клеток «Таблиц» и сколько верных им не хватает до зелёной. */
  tables: number
  tablesNeed: number
  /** Слабых форм вне этих клеток (ошибки, которые умный режим вытаскивает). */
  weak: number
  /** Медленных групп (разогрев; пока они есть, новое ждёт). */
  slow: number
  /** Остывших групп, которые проверит эта сессия (не больше PROBE_LIMIT). */
  cold: number
  /** Неосвоенных порций в очереди изучения. */
  portionsLeft: number
  /** Текущая порция: подпись и сколько верных до освоения; null — всё освоено. */
  current: { label: string; need: number } | null
  /** Что подсказать (по важности): пусто — выбор в порядке. */
  hints: PoolHint[]
}

/** Подпись порции: «Indefinido · -ar», «Presente · e → ie». */
export function portionLabel(tense: keyof typeof TENSE_LABELS, portion: string): string {
  const name = (VERB_GROUPS as string[]).includes(portion)
    ? `-${portion}`
    : (PATTERN_LABELS[portion as Pattern] ?? portion)
  return `${TENSE_LABELS[tense]} · ${name}`
}

export interface PoolSources {
  stats?: StatsStore
  runs?: RunStore
  timings?: Timing[]
  now?: number
}

export function poolOverview(config: SessionConfig, sources: PoolSources = {}): PoolOverview {
  const stats = sources.stats ?? loadStats()
  const runs = sources.runs ?? loadRuns()
  const timings = sources.timings ?? loadTimings()
  const now = sources.now ?? Date.now()

  const cells = cellsForConfig(config, stats)
  const tables = unfinishedTables(cells, runs)
  const inTables = new Set(tables.flatMap((t) => t.forms))
  const weak = cells.filter((c) => c.weak && !inTables.has(c)).length
  const tempo = tempoState({ cells, timings, sessionStart: now, now })

  const queue = portionStatuses(cells)
    .filter((s) => s.rank !== null)
    .sort((a, b) => a.rank! - b.rank!)
  const head = queue[0]
  const current = head ? { label: portionLabel(head.tense, head.portion), need: head.need } : null

  const hints: PoolHint[] = []
  if (cells.length > 0) {
    if (queue.length === 0) {
      const busy = tables.length + weak + tempo.slow + tempo.cold > 0
      hints.push(busy ? 'no-new' : 'nothing')
    }
    if (cells.length < THIN_FORMS) hints.push('thin')
    if (tempo.slow >= GATE_NEW_SLOW && queue.length > 0) hints.push('new-waits')
  }

  return {
    forms: cells.length,
    tables: tables.length,
    tablesNeed: tables.reduce((sum, t) => sum + GREEN_RUN - t.run, 0),
    weak,
    slow: tempo.slow,
    cold: tempo.cold,
    portionsLeft: queue.length,
    current,
    hints,
  }
}
