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
import { initTheme } from './lib/theme'
import type { AnswerTiming } from './lib/timing'
import { dropTiming, recordTiming } from './lib/timing'
import type {
  AnswerMode,
  AnyCard,
  ArticleConfig,
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

/** Запуск сессии: как отвечаем и как собрать карточки (для «Ещё раз» — заново). */
interface Run {
  mode: SessionMode
  answer: AnswerMode
  /** Собрать столько карточек по текущей статистике. */
  build: (size: number) => AnyCard[]
  /** null — бесконечная сессия, иначе её длина («Проверка»). */
  size: number | null
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
}))

function begin(next: Run) {
  try {
    cards.value = next.build(next.size ?? CHUNK)
  } catch (e) {
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
  startedAt.value = Date.now()
  clearLastSession()
  screen.value = 'drill'
}

/** «Проверка» — заданной длины, умный режим — бесконечный. */
function sizeOf(cfg: { mode: SessionMode; size: number }): number | null {
  return cfg.mode === 'random' ? cfg.size : null
}

function start(cfg: SessionConfig) {
  begin({ mode: cfg.mode, answer: cfg.answer, size: sizeOf(cfg), build: (size) => buildSession({ ...cfg, size }) })
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

function goNext() {
  reopenedIndex.value = null
  if (run.value?.size === null && cards.value.length - (index.value + 1) <= REFILL_AT) refill()
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
function saveTiming(card: AnyCard, ok: boolean, timing: AnswerTiming | null): GradeSnapshot['timing'] {
  if (!timing || isBookCard(card)) return null
  const entry = {
    k: cardKey(card),
    at: Date.now(),
    ms: timing.ms,
    total: timing.total,
    ok,
    oral: run.value?.answer === 'oral',
    len: card.sentence.length,
    ...(card.retry ? { retry: true } : {}),
  }
  recordTiming(entry)
  return { k: entry.k, at: entry.at }
}

function onCorrect(timing: AnswerTiming | null = null) {
  if (current.value) rememberGrade(current.value, saveTiming(current.value, true, timing))
  correct.value += 1
  streak.value += 1
  bestStreak.value = Math.max(bestStreak.value, streak.value)
  const card = current.value
  if (!card) return
  recordCard(card, true)
}

function onWrong(given: string, timing: AnswerTiming | null = null) {
  if (current.value) rememberGrade(current.value, saveTiming(current.value, false, timing))
  wrong.value += 1
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
    if (sibling) cards.value.splice(Math.min(at + 1 + SIBLING_GAP, cards.value.length), 0, sibling)
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
      @correct="onCorrect"
      @wrong="onWrong"
      @skip="onSkip"
      @next="goNext"
      @quit="quit"
      @undo="undoGrade"
      @revert="revertGrade"
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
