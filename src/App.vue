<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DrillPanel from './components/DrillPanel.vue'
import ProgressPanel from './components/ProgressPanel.vue'
import SetupPanel from './components/SetupPanel.vue'
import SummaryPanel from './components/SummaryPanel.vue'
import TablesPanel from './components/TablesPanel.vue'
import { markPracticed } from './lib/daily'
import { IRREGULAR_INFINITIVES } from './data/verbs'
import { buildSession, retryCard } from './lib/session'
import { configFromSettings, loadSettings } from './lib/settings'
import { recordAttempt } from './lib/stats'
import { initTheme, theme, toggleTheme } from './lib/theme'
import type {
  DrillCard,
  Screen,
  SessionConfig,
  SessionMistake,
  SessionResult,
} from './types'
import { TENSES } from './types'

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

// Новый экран — с начала страницы (на телефоне иначе остаётся прокрутка настроек).
watch(screen, () => window.scrollTo(0, 0))

const current = computed(() => cards.value[index.value]!)

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
  startedAt.value = Date.now()
  screen.value = 'drill'
}

function finish() {
  finishedAt.value = Date.now()
  if (correct.value + wrong.value > 0) markPracticed()
  screen.value = 'summary'
}

function goNext() {
  if (index.value + 1 >= cards.value.length) {
    finish()
    return
  }
  index.value += 1
}

function onCorrect() {
  correct.value += 1
  streak.value += 1
  bestStreak.value = Math.max(bestStreak.value, streak.value)
  const card = current.value
  if (!card) return
  recordAttempt(card.verb.infinitive, card.tense, card.person, true)
}

function onWrong(given: string) {
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
    configFromSettings(loadSettings(), {
      mode: 'weak',
      tenses: [...TENSES],
      includeRegular: true,
      includeIrregular: true,
      selectedIrregular: [...IRREGULAR_INFINITIVES],
    }),
  )
}

function toSetup() {
  screen.value = 'setup'
}
</script>

<template>
  <div class="app">
    <button
      class="theme-toggle"
      type="button"
      :title="theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
      :aria-label="theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
      @click="toggleTheme()"
    >
      {{ theme === 'dark' ? '☀' : '☾' }}
    </button>
    <SetupPanel
      v-if="screen === 'setup'"
      :error="startError"
      @start="start"
      @tables="screen = 'tables'"
      @progress="screen = 'progress'"
    />
    <TablesPanel v-else-if="screen === 'tables'" @back="toSetup" />
    <ProgressPanel
      v-else-if="screen === 'progress'"
      @back="toSetup"
      @train-weak="trainWeak"
    />
    <DrillPanel
      v-else-if="screen === 'drill' && current"
      :card="current"
      :index="index"
      :total="cards.length"
      :correct="correct"
      :wrong="wrong"
      :streak="streak"
      :voice="config?.answer === 'voice'"
      @correct="onCorrect"
      @wrong="onWrong"
      @skip="onSkip"
      @next="goNext"
      @quit="quit"
    />
    <SummaryPanel
      v-else-if="screen === 'summary'"
      :result="result"
      @again="again"
      @setup="toSetup"
      @progress="screen = 'progress'"
    />
  </div>
</template>
