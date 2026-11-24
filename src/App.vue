<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DrillPanel from './components/DrillPanel.vue'
import HomePanel from './components/HomePanel.vue'
import HubPanel from './components/HubPanel.vue'
import ProgressPanel from './components/ProgressPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import SummaryPanel from './components/SummaryPanel.vue'
import TabBar from './components/TabBar.vue'
import ArticleScheme from './components/ArticleScheme.vue'
import DeckProgress from './components/DeckProgress.vue'
import TablesPanel from './components/TablesPanel.vue'
import { buildArticleSession } from './lib/articles/cards'
import { buildBookSession } from './lib/book'
import {
  cardKey,
  cardMistake,
  cardRun,
  cardStat,
  recordCard,
  restoreCard,
  retryOf,
  siblingOf,
} from './lib/cards'
import { clearLastSession, loadLastSession, saveLastSession } from './lib/lastSession'
import { buildSession } from './lib/session'
import { articleConfigFromSettings, bookConfigFromSettings, configFromSettings } from './lib/settings'
import { settings } from './lib/settingsState'
import type { CellStat } from './lib/stats'
import type { PoolGroup, TempoRow, TempoSession } from './lib/tempo'
import { createTempoSession, groupLabel, portionLabel, sessionTempo } from './lib/tempo'
import { pluralRu } from './lib/plural'
import { initTheme } from './lib/theme'
import type { AnswerTiming, TimingReason } from './lib/timing'
import { dropTiming, loadTimings, recordTiming } from './lib/timing'
import type {
  AnswerMode,
  AnyCard,
  ArticleConfig,
  DrillCard,
  BookConfig,
  Screen,
  SessionConfig,
  SessionMistake,
  SessionMode,
  SessionResult,
  Track,
} from './types'
import { isBookCard } from './types'

initTheme()

/** Через сколько карточек вернуть форму, на которой ошиблись. */
const RETRY_GAP = 3

/** Через сколько карточек после повтора — другой глагол той же клетки (правильные глаголы). */
const SIBLING_GAP = 2

/**
 * Умная сессия бесконечная: очередь собирается кусками по CHUNK карточек,
 * каждый следующий — по свежей статистике, когда до конца остаётся REFILL_AT.
 */
const CHUNK = 10
const REFILL_AT = 3

/**
 * Глаголы в умном режиме: каждая карточка выбирается по свежему темпу (src/lib/tempo.ts),
 * впереди держим LOOKAHEAD — чтобы повтор после ошибки встал через RETRY_GAP карточек.
 */
const LOOKAHEAD = 3

/** Подсказка про отдельную группу — не чаще, чем раз в столько ответов. */
const GROUP_NOTICE_GAP = 8

/** Запуск сессии: как отвечаем и как собрать карточки (для «Ещё раз» — заново). */
interface Run {
  mode: SessionMode
  answer: AnswerMode
  /** Собрать столько карточек по текущей статистике. */
  build: (size: number) => AnyCard[]
  /** null — бесконечная сессия, иначе её длина («Проверка»). */
  size: number | null
  /** Глаголы в умном режиме: выбор карточек на ходу по темпу. */
  tempo?: (sessionStart: number) => TempoSession
}

/** Начало — список тренажёров; из него — главная выбранного тренажёра. */
const screen = ref<Screen>('hub')
const run = ref<Run | null>(null)
const cards = ref<AnyCard[]>([])
const index = ref(0)
const correct = ref(0)
const wrong = ref(0)
const skipped = ref(0)
const streak = ref(0)
const bestStreak = ref(0)
const mistakes = ref<SessionMistake[]>([])
const startedAt = ref(0)
const finishedAt = ref(0)
const startError = ref('')
/** Итог сессии, которую в прошлый раз закрыли, не дойдя до итогов. */
const previous = ref(false)
/** Темп за сессию по группам — считается, когда сессия закончена. */
const tempoRows = ref<TempoRow[]>([])

/** Темп текущей сессии глаголов (умный режим); null — карточки кусками. */
let tempo: TempoSession | null = null
/** Подсказка вместо карточки, пока её не закроют («Лаборатория» → «Подсказки умного режима»). */
const notice = ref<string | null>(null)
/** Важность подсказки: менее важная не перебивает ту, что ещё не закрыли. */
let noticeRank = 0
/** Когда в последний раз говорили про отдельную группу (номер ответа). */
let groupSaidAt = -Infinity
/** Последний ответ был верным: группа замедлилась по времени, а не из-за ошибки. */
let lastOk = false
/** Разогрев шёл в этой сессии / уже сказали, что он пройден / что похоже на усталость. */
let warming = false
let warmedSaid = false
let tiredSaid = false
/** Порции, о которых уже сказали «добавляю новое». */
let announced = new Set<string>()
/** Медленные группы и разогрев на прошлой проверке — чтобы заметить, что изменилось. */
let prevHot = new Set<string>()
let prevPool: PoolGroup[] = []

/** Состояние до последнего ответа: отмена самооценки и «Мой ответ верный». */
interface GradeSnapshot {
  index: number
  correct: number
  wrong: number
  streak: number
  bestStreak: number
  mistakes: SessionMistake[]
  cards: AnyCard[]
  card: AnyCard
  stat: CellStat | undefined
  /** Серия ячейки «Таблиц» до ответа; null — карточка не из таблиц. */
  run: number | undefined | null
  /** Записанное время ответа: при отмене его убираем. */
  timing: { k: string; at: number } | null
}
const lastGrade = ref<GradeSnapshot | null>(null)
/** Карточка, к которой вернулись отменой: ответ на ней сразу открыт. */
const reopenedIndex = ref<number | null>(null)

// Новый экран — с начала страницы (на телефоне иначе остаётся прокрутка настроек).
watch(screen, () => window.scrollTo(0, 0))

const current = computed(() => cards.value[index.value]!)

/** Панель вкладок — на экранах-разделах и на итогах; в сессии не отвлекает. */
const showTabBar = computed(() =>
  ['hub', 'setup', 'settings', 'progress', 'tables', 'summary'].includes(screen.value),
)

const answered = computed(() => correct.value + wrong.value + skipped.value)

const result = computed<SessionResult>(() => ({
  correct: correct.value,
  wrong: wrong.value,
  skipped: skipped.value,
  total: answered.value,
  bestStreak: bestStreak.value,
  seconds: Math.round((finishedAt.value - startedAt.value) / 1000),
  mistakes: mistakes.value,
  tempo: tempoRows.value,
}))

function begin(next: Run) {
  const now = Date.now()
  try {
    tempo = next.tempo?.(now) ?? null
    cards.value = tempo ? [] : next.build(next.size ?? CHUNK)
    if (tempo) topUp()
  } catch (e) {
    tempo = null
    startError.value = e instanceof Error ? e.message : String(e)
    screen.value = 'setup'
    return
  }
  startError.value = ''
  run.value = next
  index.value = 0
  correct.value = 0
  wrong.value = 0
  skipped.value = 0
  streak.value = 0
  bestStreak.value = 0
  mistakes.value = []
  lastGrade.value = null
  reopenedIndex.value = null
  previous.value = false
  startedAt.value = now
  notice.value = null
  noticeRank = 0
  groupSaidAt = -Infinity
  lastOk = false
  warming = false
  warmedSaid = false
  tiredSaid = false
  announced = new Set()
  prevHot = new Set()
  prevPool = []
  if (tempo) checkTempo(cards.value[0] as DrillCard | undefined)
  clearLastSession()
  screen.value = 'drill'
}

/** «Проверка» — заданной длины, умный режим — бесконечный. */
function sizeOf(cfg: { mode: SessionMode; size: number }): number | null {
  return cfg.mode === 'random' ? cfg.size : null
}

function start(cfg: SessionConfig) {
  begin({
    mode: cfg.mode,
    answer: cfg.answer,
    size: sizeOf(cfg),
    build: (size) => buildSession({ ...cfg, size }),
    tempo: cfg.mode === 'smart' ? (sessionStart) => createTempoSession(cfg, sessionStart) : undefined,
  })
}

function startBook(cfg: BookConfig) {
  begin({ mode: cfg.mode, answer: cfg.answer, size: sizeOf(cfg), build: (size) => buildBookSession({ ...cfg, size }) })
}

function startArticles(cfg: ArticleConfig) {
  begin({
    mode: cfg.mode,
    answer: cfg.answer,
    size: sizeOf(cfg),
    build: (size) => buildArticleSession({ ...cfg, size }),
  })
}

/** Сессия по текущим настройкам тренажёра — «Ещё раз» после итога прошлого раза. */
function startFromSettings() {
  if (settings.track === 'book') startBook(bookConfigFromSettings(settings))
  else if (settings.track === 'articles') startArticles(articleConfigFromSettings(settings))
  else start(configFromSettings(settings))
}

/** Из списка тренажёров — на главную выбранного. */
function openTrainer(track: Track) {
  settings.track = track
  startError.value = ''
  screen.value = 'setup'
}

function finish() {
  finishedAt.value = Date.now()
  tempoRows.value = sessionTempo(loadTimings(), startedAt.value, finishedAt.value)
  clearLastSession()
  screen.value = 'summary'
}

/** Бесконечная сессия: дописать следующий кусок очереди по свежей статистике. */
function refill() {
  let more: AnyCard[]
  try {
    more = run.value!.build(CHUNK)
  } catch {
    return
  }
  const last = cards.value[cards.value.length - 1]
  // одна и та же карточка не идёт два раза подряд на стыке кусков
  if (last && more.length > 1 && cardKey(more[0]!) === cardKey(last)) more.push(more.shift()!)
  cards.value.push(...more)
}

/** Темп: держать впереди LOOKAHEAD карточек, каждую — по свежему логу ответов. */
function topUp() {
  const t = tempo!
  while (cards.value.length - (index.value + 1) < LOOKAHEAD) {
    const verbs = cards.value as DrillCard[]
    const upcoming = verbs.slice(index.value + 1)
    const recent = verbs.slice(Math.max(0, index.value - 2), index.value + 1)
    cards.value.push(t.next(upcoming, recent))
  }
}

/** Подсказки по важности: группа < разогрев и новое < усталость. */
const RANK = { group: 1, step: 2, tired: 3 } as const

function say(text: string, rank: number = RANK.step) {
  if (!settings.labs.tempoNotes) return
  if (notice.value && rank < noticeRank) return
  notice.value = text
  noticeRank = rank
}

function dismissNotice() {
  notice.value = null
  noticeRank = 0
}

/**
 * Что решил умный режим — вслух: разогрев начался и пройден, группа замедлилась
 * или разогналась, вводится новая порция (и почему сейчас), похоже на усталость.
 * `next` — карточка, которая сейчас появится.
 */
function checkTempo(next: DrillCard | undefined) {
  const state = tempo!.state()
  const hot = new Set(state.hot)

  const portion = next ? tempo!.newPortion(next) : null
  const fresh = portion !== null && !announced.has(portion)
  if (fresh) announced.add(portion)
  const what = fresh ? `«${portionLabel(portion)}»` : ''
  // «хороший» — только если правда: медленных групп нет и не устали
  const good = answered.value > 0 && state.slow === 0 && !state.tired

  // про отдельную группу — не на каждую ошибку (её и так видно) и не чаще GROUP_NOTICE_GAP
  if (answered.value > 0 && answered.value - groupSaidAt >= GROUP_NOTICE_GAP) {
    const slowed = lastOk ? state.hot.filter((k) => !prevHot.has(k)) : []
    const sped = prevPool.filter((g) => g.reason === 'slow' && !hot.has(g.key))
    let text = ''
    if (slowed.length > 0) text = `«${groupLabel(slowed[0]!)}» вспоминается медленно — повторим чаще.`
    else if (sped.length > 0 && state.pool.length > 0) text = `Разогналось: «${groupLabel(sped[0]!.key)}»`
    if (text) {
      groupSaidAt = answered.value
      say(text, RANK.group)
    }
  }

  if (state.pool.length > 0 && !warming) {
    warming = true
    if (answered.value === 0) {
      const n = state.slow + state.cold
      say(`Сначала разогрев: ${n} ${pluralRu(n, 'группа медленная или остыла', 'группы медленные или остыли', 'групп медленные или остыли')}.`)
    }
  } else if (state.pool.length === 0 && warming && !warmedSaid) {
    warmedSaid = true
    say(
      fresh && good
        ? `Разогрев пройден, темп хороший — добавляю новое: ${what}`
        : 'Разогрев пройден — дальше новое и повторение.',
    )
  } else if (fresh) {
    if (answered.value === 0) say(`Начинаем с нового: ${what}`)
    else if (good) say(`Темп хороший — добавляю новое: ${what}`)
    else say(`Дальше новое: ${what}`)
  }

  if (state.tired && !tiredSaid) {
    tiredSaid = true
    say('Темп упал сразу везде — похоже на усталость. Хорошая точка, чтобы закончить.', RANK.tired)
  }
  prevHot = hot
  prevPool = state.pool
}

function goNext() {
  reopenedIndex.value = null
  if (tempo) {
    try {
      topUp()
      checkTempo(cards.value[index.value + 1] as DrillCard | undefined)
    } catch {
      /* выбрать не из чего — сессия закончится на последней карточке */
    }
  } else if (run.value?.size === null && cards.value.length - (index.value + 1) <= REFILL_AT) refill()
  if (index.value + 1 >= cards.value.length) {
    finish()
    return
  }
  index.value += 1
}

function rememberGrade(card: AnyCard, timing: GradeSnapshot['timing'] = null) {
  lastGrade.value = {
    timing,
    index: index.value,
    correct: correct.value,
    wrong: wrong.value,
    streak: streak.value,
    bestStreak: bestStreak.value,
    mistakes: [...mistakes.value],
    cards: [...cards.value],
    card,
    stat: cardStat(card),
    run: cardRun(card),
  }
}

function restoreGrade(snap: GradeSnapshot) {
  index.value = snap.index
  correct.value = snap.correct
  wrong.value = snap.wrong
  streak.value = snap.streak
  bestStreak.value = snap.bestStreak
  mistakes.value = snap.mistakes
  cards.value = snap.cards
  restoreCard(snap.card, snap.stat, snap.run)
  if (snap.timing) dropTiming(snap.timing.k, snap.timing.at)
  lastGrade.value = null
}

/** Отменить последнюю самооценку и вернуться к той карточке с открытым ответом. */
function undoGrade() {
  const snap = lastGrade.value
  if (!snap) return
  restoreGrade(snap)
  reopenedIndex.value = snap.index
}

/** Ошибка снята: «Мой ответ верный». Ответ засчитают следующим шагом. */
function revertGrade() {
  if (lastGrade.value) restoreGrade(lastGrade.value)
}

/** Время ответа на форму глагола — для разогрева в умном режиме. */
function saveTiming(
  card: AnyCard,
  ok: boolean,
  timing: AnswerTiming | null,
  given = '',
): GradeSnapshot['timing'] {
  if (!timing || isBookCard(card)) return null
  const reason: TimingReason | undefined = card.retry ? 'retry' : card.sibling ? 'sibling' : card.reason
  const entry = {
    k: cardKey(card),
    at: Date.now(),
    ms: timing.ms,
    total: timing.total,
    ok,
    oral: run.value?.answer === 'oral',
    len: card.sentence.length,
    ...(card.retry ? { retry: true } : {}),
    ...(given ? { given } : {}),
    ...(reason ? { reason } : {}),
  }
  recordTiming(entry)
  return { k: entry.k, at: entry.at }
}

function onCorrect(timing: AnswerTiming | null = null) {
  if (current.value) rememberGrade(current.value, saveTiming(current.value, true, timing))
  correct.value += 1
  lastOk = true
  streak.value += 1
  bestStreak.value = Math.max(bestStreak.value, streak.value)
  const card = current.value
  if (!card) return
  recordCard(card, true)
}

function onWrong(given: string, timing: AnswerTiming | null = null) {
  if (current.value) rememberGrade(current.value, saveTiming(current.value, false, timing, given))
  wrong.value += 1
  lastOk = false
  streak.value = 0
  const card = current.value
  if (!card) return
  recordCard(card, false)
  mistakes.value.push(cardMistake(card, given))
  // Смарт-режимы: вернуть ошибочную форму ещё раз через пару карточек,
  // а у правильного глагола потом — то же правило на другом глаголе.
  if (run.value?.mode !== 'random' && !card.retry) {
    const at = Math.min(index.value + 1 + RETRY_GAP, cards.value.length)
    cards.value.splice(at, 0, retryOf(card))
    const sibling = siblingOf(card)
    if (sibling) {
      const next = isBookCard(sibling) ? sibling : { ...sibling, sibling: true }
      cards.value.splice(Math.min(at + 1 + SIBLING_GAP, cards.value.length), 0, next)
    }
  }
}

function onSkip() {
  skipped.value += 1
  streak.value = 0
}

/** Выход: если что-то ответили — к итогу, иначе на главную. */
function quit() {
  if (answered.value > 0) {
    finish()
    return
  }
  clearLastSession()
  screen.value = 'setup'
}

function again() {
  if (run.value) begin(run.value)
  else startFromSettings()
}

// Счёт сохраняется после каждого ответа (и отмены): закрыли приложение — итог не пропал.
watch([answered, mistakes, bestStreak], () => {
  if (screen.value !== 'drill') return
  if (answered.value === 0) {
    clearLastSession()
    return
  }
  saveLastSession({
    track: settings.track,
    correct: correct.value,
    wrong: wrong.value,
    skipped: skipped.value,
    bestStreak: bestStreak.value,
    startedAt: startedAt.value,
    lastAt: Date.now(),
    mistakes: mistakes.value,
  })
})

/** Прошлую сессию закрыли без итога — показываем его при входе, один раз. */
function restoreLastSession() {
  const saved = loadLastSession()
  clearLastSession()
  if (!saved) return
  settings.track = saved.track
  correct.value = saved.correct
  wrong.value = saved.wrong
  skipped.value = saved.skipped
  bestStreak.value = saved.bestStreak
  mistakes.value = saved.mistakes
  startedAt.value = saved.startedAt
  finishedAt.value = saved.lastAt
  tempoRows.value = sessionTempo(loadTimings(), saved.startedAt, saved.lastAt)
  previous.value = true
  screen.value = 'summary'
}

restoreLastSession()
</script>

<template>
  <div class="app" :class="{ 'app--tabbar': showTabBar }">
    <HubPanel v-if="screen === 'hub'" @open="openTrainer" />
    <HomePanel
      v-else-if="screen === 'setup'"
      :error="startError"
      @start="start"
      @start-book="startBook"
      @start-articles="startArticles"
      @back="screen = 'hub'"
    />
    <SettingsPanel v-else-if="screen === 'settings'" />
    <!-- «Справка»: у артиклей — пошаговая схема, у глаголов (и учебника) — таблицы спряжения -->
    <ArticleScheme v-else-if="screen === 'tables' && settings.track === 'articles'" />
    <TablesPanel v-else-if="screen === 'tables'" />
    <DeckProgress
      v-else-if="screen === 'progress' && settings.track !== 'verbs'"
      :key="settings.track"
      :deck="settings.track"
    />
    <ProgressPanel v-else-if="screen === 'progress'" />
    <DrillPanel
      v-else-if="screen === 'drill' && current"
      :card="current"
      :index="index"
      :total="run?.size === null ? null : cards.length"
      :correct="correct"
      :wrong="wrong"
      :streak="streak"
      :oral="run?.answer === 'oral'"
      :can-undo="lastGrade !== null"
      :reopened="reopenedIndex === index"
      :notice="notice"
      @correct="onCorrect"
      @wrong="onWrong"
      @skip="onSkip"
      @next="goNext"
      @quit="quit"
      @undo="undoGrade"
      @revert="revertGrade"
      @dismiss="dismissNotice"
    />
    <SummaryPanel
      v-else-if="screen === 'summary'"
      :result="result"
      :previous="previous"
      @again="again"
    />
    <TabBar v-if="showTabBar" :screen="screen" @go="screen = $event" />
  </div>
</template>

<style scoped lang="scss">
/* ===== app ===== */

.app {
  position: relative;
  max-width: 460px;
  margin: 0 auto;
  padding:
    calc(var(--space-6) + env(safe-area-inset-top)) calc(var(--space-4) + env(safe-area-inset-right))
    calc(var(--space-7) + env(safe-area-inset-bottom)) calc(var(--space-4) + env(safe-area-inset-left));
}

/* ===== app: отступ под нижнюю панель вкладок ===== */

.app--tabbar {
  padding-bottom: calc(var(--tabbar-height) + var(--space-6) + env(safe-area-inset-bottom));
}
</style>
