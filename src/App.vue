<script setup lang="ts">
import { computed, ref } from 'vue'
import DrillPanel from './components/DrillPanel.vue'
import SetupPanel from './components/SetupPanel.vue'
import SummaryPanel from './components/SummaryPanel.vue'
import TablesPanel from './components/TablesPanel.vue'
import { loadProgress, recordCorrect, recordWrong, saveProgress } from './lib/progress'
import { buildSession } from './lib/session'
import { initTheme, theme, toggleTheme } from './lib/theme'
import type { DrillCard, Screen, SessionConfig, SessionResult } from './types'

/** Гарантируем полную матрицу глагол × время × местоимение в localStorage. */
saveProgress(loadProgress())
initTheme()

const screen = ref<Screen>('setup')
const config = ref<SessionConfig | null>(null)
const cards = ref<DrillCard[]>([])
const index = ref(0)
const correct = ref(0)
const wrong = ref(0)
const skipped = ref(0)

const current = computed(() => cards.value[index.value]!)

const result = computed<SessionResult>(() => ({
  correct: correct.value,
  wrong: wrong.value,
  skipped: skipped.value,
  total: cards.value.length,
}))

function start(cfg: SessionConfig) {
  config.value = cfg
  cards.value = buildSession(cfg)
  index.value = 0
  correct.value = 0
  wrong.value = 0
  skipped.value = 0
  screen.value = 'drill'
}

function finish() {
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
  const card = current.value
  if (card) recordCorrect(card.verb.infinitive, card.tense, card.person)
}

function onWrong() {
  wrong.value += 1
  const card = current.value
  if (card) recordWrong(card.verb.infinitive, card.tense, card.person)
}

function onSkip() {
  skipped.value += 1
}

function quit() {
  screen.value = 'setup'
}

function again() {
  if (config.value) start(config.value)
}

function toSetup() {
  screen.value = 'setup'
}

function openTables() {
  screen.value = 'tables'
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
      @start="start"
      @tables="openTables"
    />
    <TablesPanel v-else-if="screen === 'tables'" @back="toSetup" />
    <DrillPanel
      v-else-if="screen === 'drill' && current"
      :card="current"
      :index="index"
      :total="cards.length"
      :correct="correct"
      :wrong="wrong"
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
    />
  </div>
</template>
