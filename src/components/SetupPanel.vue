<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IRREGULAR_INFINITIVES } from '../data/verbs'
import { currentStreak, daysLabel, loadDaily } from '../lib/daily'
import { cellsForConfig, weakCount } from '../lib/session'
import { configFromSettings, loadSettings, saveSettings } from '../lib/settings'
import type { AnswerMode, Person, SessionConfig, SessionMode, Tense } from '../types'
import { MODE_LABELS, PERSONS, TENSE_LABELS } from '../types'

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
const persons = ref({ ...saved.persons })
const includeRegular = ref(saved.includeRegular)
const includeIrregular = ref(saved.includeIrregular)
const selectedIrregular = ref({ ...saved.selectedIrregular })
const size = ref(saved.size)
const mode = ref<SessionMode>(saved.mode)
const answer = ref<AnswerMode>(saved.answer)

const irregularList = IRREGULAR_INFINITIVES

/** Подписи чекбоксов; usted / ustedes тренируются вместе с él / ellos. */
const PERSON_CHOICES: Record<Person, string> = {
  yo: 'yo',
  tú: 'tú',
  él: 'él / ella',
  nosotros: 'nosotros',
  vosotros: 'vosotros',
  ellos: 'ellos / ellas',
}

const MODE_HINTS: Record<SessionMode, string> = {
  smart: 'чаще — формы с ошибками, реже — выученные',
  weak: 'только формы, где были ошибки',
  random: 'равномерно, без учёта прогресса',
}

const days = currentStreak(loadDaily())

const settings = computed(() => ({
  selected: { ...selected.value },
  persons: { ...persons.value },
  includeRegular: includeRegular.value,
  includeIrregular: includeIrregular.value,
  selectedIrregular: { ...selectedIrregular.value },
  size: size.value,
  mode: mode.value,
  answer: answer.value,
}))

watch(settings, (value) => saveSettings(value), { deep: true })

const config = computed(() => configFromSettings(settings.value))

const weak = computed(() => weakCount(config.value))

/** Сколько форм под фильтр (0, например, если только yo и только imperativo). */
const formsCount = computed(() => {
  const cfg = config.value
  if (cfg.tenses.length === 0 || cfg.persons.length === 0) return 0
  return cellsForConfig(cfg).length
})

const canStart = computed(() => {
  const cfg = config.value
  if (cfg.tenses.length === 0) return false
  if (cfg.persons.length === 0) return false
  if (!cfg.includeRegular && !cfg.includeIrregular) return false
  if (cfg.includeIrregular && cfg.selectedIrregular.length === 0) return false
  if (formsCount.value === 0) return false
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
  <section class="setup">
    <h1 class="screen__title setup__title">Tiempos</h1>
    <p class="screen__lead setup__lead">
      Предложение с пропуском — впишите глагол в нужной форме
      (presente, indefinido, imperfecto, imperativo).
    </p>
    <p v-if="days > 0" class="setup__daily">
      🔥 {{ daysLabel(days) }} подряд
    </p>

    <fieldset class="group setup__answer">
      <legend class="group__legend setup__answer-legend">Ответ</legend>
      <div class="segmented setup__answer-switch" role="radiogroup" aria-label="Как отвечать">
        <button
          class="segmented__item setup__answer-text"
          :class="{ 'segmented__item--active': answer === 'text' }"
          type="button"
          role="radio"
          :aria-checked="answer === 'text'"
          @click="answer = 'text'"
        >
          ⌨ Текст
        </button>
        <button
          class="segmented__item setup__answer-oral"
          :class="{ 'segmented__item--active': answer === 'oral' }"
          type="button"
          role="radio"
          :aria-checked="answer === 'oral'"
          @click="answer = 'oral'"
        >
          🗣 Устно
        </button>
      </div>
      <p v-if="answer === 'oral'" class="group__note setup__answer-note">
        Скажите форму вслух или про себя, тапните — появится ответ, отметьте
        «верно» или «ошибся». Правописание здесь не проверяется.
      </p>
    </fieldset>

    <fieldset class="group setup__mode">
      <legend class="group__legend setup__mode-legend">Режим</legend>
      <label v-for="(label, m) in MODE_LABELS" :key="m" class="choice setup__mode-option">
        <input v-model="mode" class="choice__input setup__mode-input" type="radio" :value="m" />
        <span class="choice__label setup__mode-label">
          {{ label }}
          <template v-if="m === 'weak'">
            <span class="badge setup__weak-count" :class="{ 'badge--hot': weak > 0 }">{{ weak }}</span>
          </template>
          <small class="setup__mode-hint">{{ MODE_HINTS[m as SessionMode] }}</small>
        </span>
      </label>
    </fieldset>

    <fieldset class="group setup__tenses">
      <legend class="group__legend setup__tenses-legend">Времена</legend>
      <label v-for="(label, tense) in TENSE_LABELS" :key="tense" class="choice setup__tense">
        <input v-model="selected[tense as Tense]" class="choice__input setup__tense-input" type="checkbox" />
        <span class="choice__label setup__tense-label">{{ label }}</span>
      </label>
    </fieldset>

    <fieldset class="group setup__persons">
      <legend class="group__legend setup__persons-legend">Местоимения</legend>
      <div class="setup__persons-grid">
        <label v-for="person in PERSONS" :key="person" class="choice setup__person">
          <input v-model="persons[person]" class="choice__input setup__person-input" type="checkbox" />
          <span class="choice__label setup__person-label">{{ PERSON_CHOICES[person] }}</span>
        </label>
      </div>
      <p class="group__note setup__persons-note">
        usted / ustedes — вместе с él / ellos; в imperativo формы yo нет.
      </p>
    </fieldset>

    <fieldset class="group setup__verbs">
      <legend class="group__legend setup__verbs-legend">Глаголы</legend>
      <label class="choice setup__verb-kind setup__verb-kind--regular">
        <input v-model="includeRegular" class="choice__input setup__verb-kind-input" type="checkbox" />
        <span class="choice__label setup__verb-kind-label">Только правильные</span>
      </label>
      <label class="choice setup__verb-kind setup__verb-kind--irregular">
        <input v-model="includeIrregular" class="choice__input setup__verb-kind-input" type="checkbox" />
        <span class="choice__label setup__verb-kind-label">Только неправильные</span>
      </label>

      <div v-if="includeIrregular" class="setup__irregular">
        <div class="setup__irregular-head">
          <p class="setup__irregular-title">Неправильные глаголы</p>
          <div class="setup__irregular-actions">
            <button class="link-button setup__select-all" type="button" @click="setAllIrregular(true)">
              Выбрать все
            </button>
            <button class="link-button setup__select-none" type="button" @click="setAllIrregular(false)">
              Отключить все
            </button>
          </div>
        </div>
        <div class="setup__irregular-grid">
          <label
            v-for="inf in irregularList"
            :key="inf"
            class="choice setup__irregular-item"
          >
            <input v-model="selectedIrregular[inf]" class="choice__input setup__irregular-input" type="checkbox" />
            <span class="choice__label setup__irregular-label">{{ inf }}</span>
          </label>
        </div>
      </div>
    </fieldset>

    <fieldset class="group setup__size">
      <legend class="group__legend setup__size-legend">Длина сессии</legend>
      <div class="setup__sizes">
        <label v-for="n in [10, 20, 30]" :key="n" class="choice setup__size-option">
          <input v-model="size" class="choice__input setup__size-input" type="radio" :value="n" />
          <span class="choice__label setup__size-label">{{ n }}</span>
        </label>
      </div>
    </fieldset>

    <p
      v-if="config.tenses.length > 0 && config.persons.length > 0 && formsCount === 0"
      class="notice notice--muted setup__no-forms"
    >
      Под этот выбор нет форм — например, в imperativo нет yo.
    </p>
    <p v-if="mode === 'weak' && weak === 0" class="notice notice--muted setup__weak-empty">
      Слабых форм в выбранных временах нет — начните с умной очереди.
    </p>
    <p v-if="error" class="notice notice--bad setup__error">{{ error }}</p>

    <div class="screen__actions setup__actions">
      <button class="button button--primary setup__start" type="button" :disabled="!canStart" @click="start">
        Empezar
      </button>
      <button class="button button--ghost setup__to-progress" type="button" @click="emit('progress')">
        Прогресс
      </button>
      <button class="button button--ghost setup__to-tables" type="button" @click="emit('tables')">
        Таблицы
      </button>
    </div>
  </section>
</template>
