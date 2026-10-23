<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IRREGULAR_INFINITIVES } from '../data/verbs'
import { currentStreak, daysLabel, loadDaily } from '../lib/daily'
import { weakCount } from '../lib/session'
import { configFromSettings, loadSettings, saveSettings } from '../lib/settings'
import type { SessionConfig, SessionMode, Tense } from '../types'
import { MODE_LABELS, TENSE_LABELS } from '../types'

defineProps<{
  error?: string
}>()

const emit = defineEmits<{
  start: [config: SessionConfig]
  tables: []
  progress: []
}>()

const saved = loadSettings()

const selected = ref({ ...saved.selected })
const includeRegular = ref(saved.includeRegular)
const includeIrregular = ref(saved.includeIrregular)
const selectedIrregular = ref({ ...saved.selectedIrregular })
const size = ref(saved.size)
const mode = ref<SessionMode>(saved.mode)

const irregularList = IRREGULAR_INFINITIVES

const MODE_HINTS: Record<SessionMode, string> = {
  smart: 'чаще — формы с ошибками, реже — выученные',
  weak: 'только формы, где были ошибки',
  random: 'равномерно, без учёта прогресса',
}

const days = currentStreak(loadDaily())

const settings = computed(() => ({
  selected: { ...selected.value },
  includeRegular: includeRegular.value,
  includeIrregular: includeIrregular.value,
  selectedIrregular: { ...selectedIrregular.value },
  size: size.value,
  mode: mode.value,
}))

watch(settings, (value) => saveSettings(value), { deep: true })

const config = computed(() => configFromSettings(settings.value))

const weak = computed(() => weakCount(config.value))

const canStart = computed(() => {
  const cfg = config.value
  if (cfg.tenses.length === 0) return false
  if (!cfg.includeRegular && !cfg.includeIrregular) return false
  if (cfg.includeIrregular && cfg.selectedIrregular.length === 0) return false
  if (cfg.mode === 'weak' && weak.value === 0) return false
  return true
})

function start() {
  if (!canStart.value) return
  emit('start', config.value)
}

function setAllIrregular(value: boolean) {
  const next = { ...selectedIrregular.value }
  for (const inf of irregularList) {
    next[inf] = value
  }
  selectedIrregular.value = next
}
</script>

<template>
  <section class="panel">
    <h1>Tiempos</h1>
    <p class="lead">
      Предложение с пропуском — впишите глагол в нужной форме
      (presente, indefinido, imperfecto).
    </p>
    <p v-if="days > 0" class="daily">
      🔥 {{ daysLabel(days) }} подряд
    </p>

    <fieldset class="block">
      <legend>Режим</legend>
      <label v-for="(label, m) in MODE_LABELS" :key="m" class="radio mode-option">
        <input v-model="mode" type="radio" :value="m" />
        <span>
          {{ label }}
          <template v-if="m === 'weak'">
            <span class="badge" :class="{ hot: weak > 0 }">{{ weak }}</span>
          </template>
          <small>{{ MODE_HINTS[m as SessionMode] }}</small>
        </span>
      </label>
    </fieldset>

    <fieldset class="block">
      <legend>Времена</legend>
      <label v-for="(label, tense) in TENSE_LABELS" :key="tense" class="check">
        <input v-model="selected[tense as Tense]" type="checkbox" />
        <span>{{ label }}</span>
      </label>
    </fieldset>

    <fieldset class="block">
      <legend>Глаголы</legend>
      <label class="check">
        <input v-model="includeRegular" type="checkbox" />
        <span>Только правильные</span>
      </label>
      <label class="check">
        <input v-model="includeIrregular" type="checkbox" />
        <span>Только неправильные</span>
      </label>

      <div v-if="includeIrregular" class="irregular-list">
        <div class="irregular-head">
          <p class="irregular-title">Неправильные глаголы</p>
          <div class="irregular-actions">
            <button class="linkish" type="button" @click="setAllIrregular(true)">
              Выбрать все
            </button>
            <button class="linkish" type="button" @click="setAllIrregular(false)">
              Отключить все
            </button>
          </div>
        </div>
        <div class="irregular-grid">
          <label
            v-for="inf in irregularList"
            :key="inf"
            class="check irregular-item"
          >
            <input v-model="selectedIrregular[inf]" type="checkbox" />
            <span>{{ inf }}</span>
          </label>
        </div>
      </div>
    </fieldset>

    <fieldset class="block">
      <legend>Длина сессии</legend>
      <div class="sizes">
        <label v-for="n in [10, 20, 30]" :key="n" class="radio">
          <input v-model="size" type="radio" :value="n" />
          <span>{{ n }}</span>
        </label>
      </div>
    </fieldset>

    <p v-if="mode === 'weak' && weak === 0" class="hint muted">
      Слабых форм в выбранных временах нет — начните с умной очереди.
    </p>
    <p v-if="error" class="hint bad-text">{{ error }}</p>

    <div class="actions setup-actions">
      <button class="primary" type="button" :disabled="!canStart" @click="start">
        Empezar
      </button>
      <button class="ghost" type="button" @click="emit('progress')">
        Прогресс
      </button>
      <button class="ghost" type="button" @click="emit('tables')">
        Таблицы
      </button>
    </div>
  </section>
</template>
