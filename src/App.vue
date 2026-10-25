<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DrillPanel from './components/DrillPanel.vue'
import HomePanel from './components/HomePanel.vue'
import ProgressPanel from './components/ProgressPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import SummaryPanel from './components/SummaryPanel.vue'
import TabBar from './components/TabBar.vue'
import TablesPanel from './components/TablesPanel.vue'
import { markPracticed } from './lib/daily'
import { IRREGULAR_INFINITIVES } from './data/verbs'
import { buildSession, retryCard } from './lib/session'
import { configFromSettings } from './lib/settings'
import { settings } from './lib/settingsState'
import type { CellStat } from './lib/stats'
import { cellKey, loadStats, recordAttempt, restoreStat } from './lib/stats'
import { initTheme } from './lib/theme'
import type {
  DrillCard,
  Screen,
  SessionConfig,
  SessionMistake,
  SessionResult,
} from './types'
import { PERSONS, TENSES, VERB_GROUPS } from './types'

initTheme()

/** Через сколько карточек вернуть форму, на которой ошиблись. */
const RETRY_GAP = 3

const screen = ref<Screen>('setup')
const config = ref<SessionConfig | null>(null)
const cards = ref<DrillCard[]>([])
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

/** Состояние до последней самооценки в устном режиме — чтобы отменить случайный тап. */
interface GradeSnapshot {
  index: number
  correct: number
  wrong: number
  streak: number
  bestStreak: number
  mistakes: SessionMistake[]
  cards: DrillCard[]
  card: DrillCard
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

function start(cfg: SessionConfig) {
  try {
    cards.value = buildSession(cfg)
  } catch (e) {
    startError.value = e instanceof Error ? e.message : String(e)
    screen.value = 'setup'
    return
  }
  startError.value = ''
  config.value = cfg
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

function rememberGrade(card: DrillCard) {
  if (config.value?.answer !== 'oral') return
  lastGrade.value = {
    index: index.value,
    correct: correct.value,
    wrong: wrong.value,
    streak: streak.value,
    bestStreak: bestStreak.value,
    mistakes: [...mistakes.value],
    cards: [...cards.value],
    card,
    stat: loadStats()[cellKey(card.verb.infinitive, card.tense, card.person)],
  }
}

/** Отменить последнюю самооценку и вернуться к той карточке с открытым ответом. */
function undoGrade() {
  const snap = lastGrade.value
  if (!snap) return
  index.value = snap.index
  correct.value = snap.correct
  wrong.value = snap.wrong
  streak.value = snap.streak
  bestStreak.value = snap.bestStreak
  mistakes.value = snap.mistakes
  cards.value = snap.cards
  restoreStat(snap.card.verb.infinitive, snap.card.tense, snap.card.person, snap.stat)
  lastGrade.value = null
  reopenedIndex.value = snap.index
}

function onCorrect() {
  if (current.value) rememberGrade(current.value)
  correct.value += 1
  streak.value += 1
  bestStreak.value = Math.max(bestStreak.value, streak.value)
  const card = current.value
  if (!card) return
  recordAttempt(card.verb.infinitive, card.tense, card.person, true)
}

function onWrong(given: string) {
  if (current.value) rememberGrade(current.value)
  wrong.value += 1
  streak.value = 0
  const card = current.value
  if (!card) return
  recordAttempt(card.verb.infinitive, card.tense, card.person, false)
  mistakes.value.push({
    infinitive: card.verb.infinitive,
    tense: card.tense,
    person: card.person,
    answer: card.answer,
    given,
  })
  // Смарт-режимы: вернуть ошибочную форму ещё раз через пару карточек.
  if (config.value?.mode !== 'random' && !card.retry) {
    const at = Math.min(index.value + 1 + RETRY_GAP, cards.value.length)
    cards.value.splice(at, 0, retryCard(card))
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
  if (config.value) start(config.value)
}

/** С экрана прогресса — все слабые формы, независимо от фильтров настройки. */
function trainWeak() {
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
      @settings="screen = 'settings'"
    />
    <SettingsPanel v-else-if="screen === 'settings'" />
    <TablesPanel v-else-if="screen === 'tables'" />
    <ProgressPanel v-else-if="screen === 'progress'" @train-weak="trainWeak" />
    <DrillPanel
      v-else-if="screen === 'drill' && current"
      :card="current"
      :index="index"
      :total="cards.length"
      :correct="correct"
      :wrong="wrong"
      :streak="streak"
      :oral="config?.answer === 'oral'"
      :can-undo="lastGrade !== null"
      :reopened="reopenedIndex === index"
      @correct="onCorrect"
      @wrong="onWrong"
      @skip="onSkip"
      @next="goNext"
      @quit="quit"
      @undo="undoGrade"
    />
    <SummaryPanel
      v-else-if="screen === 'summary'"
      :result="result"
      @again="again"
    />
    <TabBar v-if="showTabBar" :screen="screen" @go="screen = $event" />
  </div>
</template>
