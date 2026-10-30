<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DrillPanel from './components/DrillPanel.vue'
import HomePanel from './components/HomePanel.vue'
import ProgressPanel from './components/ProgressPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import SummaryPanel from './components/SummaryPanel.vue'
import TabBar from './components/TabBar.vue'
import BookProgress from './components/BookProgress.vue'
import TablesPanel from './components/TablesPanel.vue'
import { CHAPTERS } from './data/book'
import { buildBookSession } from './lib/book'
import { cardMistake, cardStat, recordCard, restoreCard, retryOf } from './lib/cards'
import { markPracticed } from './lib/daily'
import { IRREGULAR_INFINITIVES } from './data/verbs'
import { buildSession } from './lib/session'
import { bookConfigFromSettings, configFromSettings } from './lib/settings'
import { settings } from './lib/settingsState'
import type { CellStat } from './lib/stats'
import { initTheme } from './lib/theme'
import type {
  AnswerMode,
  AnyCard,
  BookConfig,
  Screen,
  SessionConfig,
  SessionMistake,
  SessionMode,
  SessionResult,
} from './types'
import { PERSONS, TENSES, VERB_GROUPS } from './types'

initTheme()

/** Через сколько карточек вернуть форму, на которой ошиблись. */
const RETRY_GAP = 3

/** Запуск сессии: как отвечаем и как собрать карточки (для «Ещё раз» — заново). */
interface Run {
  mode: SessionMode
  answer: AnswerMode
  build: () => AnyCard[]
}

const screen = ref<Screen>('setup')
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
}
const lastGrade = ref<GradeSnapshot | null>(null)
/** Карточка, к которой вернулись отменой: ответ на ней сразу открыт. */
const reopenedIndex = ref<number | null>(null)

// Новый экран — с начала страницы (на телефоне иначе остаётся прокрутка настроек).
watch(screen, () => window.scrollTo(0, 0))

const current = computed(() => cards.value[index.value]!)

/** Панель вкладок — на экранах-разделах и на итогах; в сессии не отвлекает. */
const showTabBar = computed(() =>
  ['setup', 'settings', 'progress', 'tables', 'summary'].includes(screen.value),
)

const result = computed<SessionResult>(() => ({
  correct: correct.value,
  wrong: wrong.value,
  skipped: skipped.value,
  total: cards.value.length,
  bestStreak: bestStreak.value,
  seconds: Math.round((finishedAt.value - startedAt.value) / 1000),
  mistakes: mistakes.value,
}))

function begin(next: Run) {
  try {
    cards.value = next.build()
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
  startedAt.value = Date.now()
  screen.value = 'drill'
}

function start(cfg: SessionConfig) {
  begin({ mode: cfg.mode, answer: cfg.answer, build: () => buildSession(cfg) })
}

function startBook(cfg: BookConfig) {
  begin({ mode: cfg.mode, answer: cfg.answer, build: () => buildBookSession(cfg) })
}

function finish() {
  finishedAt.value = Date.now()
  if (correct.value + wrong.value > 0) markPracticed()
  screen.value = 'summary'
}

function goNext() {
  reopenedIndex.value = null
  if (index.value + 1 >= cards.value.length) {
    finish()
    return
  }
  index.value += 1
}

function rememberGrade(card: AnyCard) {
  lastGrade.value = {
    index: index.value,
    correct: correct.value,
    wrong: wrong.value,
    streak: streak.value,
    bestStreak: bestStreak.value,
    mistakes: [...mistakes.value],
    cards: [...cards.value],
    card,
    stat: cardStat(card),
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
  restoreCard(snap.card, snap.stat)
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

function onCorrect() {
  if (current.value) rememberGrade(current.value)
  correct.value += 1
  streak.value += 1
  bestStreak.value = Math.max(bestStreak.value, streak.value)
  const card = current.value
  if (!card) return
  recordCard(card, true)
}

function onWrong(given: string) {
  if (current.value) rememberGrade(current.value)
  wrong.value += 1
  streak.value = 0
  const card = current.value
  if (!card) return
  recordCard(card, false)
  mistakes.value.push(cardMistake(card, given))
  // Смарт-режимы: вернуть ошибочную форму ещё раз через пару карточек.
  if (run.value?.mode !== 'random' && !card.retry) {
    const at = Math.min(index.value + 1 + RETRY_GAP, cards.value.length)
    cards.value.splice(at, 0, retryOf(card))
  }
}

function onSkip() {
  skipped.value += 1
  streak.value = 0
}

function quit() {
  screen.value = 'setup'
}

function again() {
  if (run.value) begin(run.value)
}

/** С экрана прогресса — все слабые формы, независимо от фильтров настройки. */
function trainWeak() {
  if (settings.track === 'book') {
    startBook(bookConfigFromSettings(settings, { mode: 'weak', units: CHAPTERS.map((c) => c.unit) }))
    return
  }
  start(
    configFromSettings(settings, {
      mode: 'weak',
      tenses: [...TENSES],
      persons: [...PERSONS],
      groups: [...VERB_GROUPS],
      includeRegular: true,
      includeIrregular: true,
      selectedIrregular: [...IRREGULAR_INFINITIVES],
    }),
  )
}
</script>

<template>
  <div class="app" :class="{ 'app--tabbar': showTabBar }">
    <HomePanel
      v-if="screen === 'setup'"
      :error="startError"
      @start="start"
      @start-book="startBook"
      @settings="screen = 'settings'"
    />
    <SettingsPanel v-else-if="screen === 'settings'" />
    <TablesPanel v-else-if="screen === 'tables'" />
    <BookProgress v-else-if="screen === 'progress' && settings.track === 'book'" @train-weak="trainWeak" />
    <ProgressPanel v-else-if="screen === 'progress'" @train-weak="trainWeak" />
    <DrillPanel
      v-else-if="screen === 'drill' && current"
      :card="current"
      :index="index"
      :total="cards.length"
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
