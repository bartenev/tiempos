<script setup lang="ts">
import { computed } from 'vue'
import { currentStreak, daysLabel, loadDaily } from '../lib/daily'
import { cellsForConfig, weakCount } from '../lib/session'
import { configFromSettings } from '../lib/settings'
import { settings } from '../lib/settingsState'
import { describeSettings } from '../lib/settingsSummary'
import type { SessionConfig, SessionMode } from '../types'
import Icon from './Icon.vue'

defineProps<{
  error?: string
}>()

const emit = defineEmits<{
  start: [config: SessionConfig]
  settings: []
}>()

const MODES: { mode: SessionMode; label: string; hint: string }[] = [
  {
    mode: 'smart',
    label: 'Умная',
    hint: 'Новое — порциями, ошибки — всегда, выученное — реже.',
  },
  { mode: 'weak', label: 'Слабые', hint: 'Только формы, где были ошибки.' },
  { mode: 'random', label: 'Случайно', hint: 'Равномерно, без учёта прогресса.' },
]

const days = currentStreak(loadDaily())

const config = computed(() => configFromSettings(settings))

const weak = computed(() => weakCount(config.value))

/** Сколько форм под фильтр (0, например, если только yo и только imperativo). */
const formsCount = computed(() => {
  const cfg = config.value
  if (cfg.tenses.length === 0 || cfg.persons.length === 0 || cfg.groups.length === 0) return 0
  return cellsForConfig(cfg).length
})

const summary = computed(() => describeSettings(settings))

const modeHint = computed(() => MODES.find((m) => m.mode === settings.mode)!.hint)

const canStart = computed(() => {
  if (formsCount.value === 0) return false
  if (settings.mode === 'weak' && weak.value === 0) return false
  return true
})

function start() {
  if (!canStart.value) return
  emit('start', config.value)
}
</script>

<template>
  <section class="home">
    <header class="home__header">
      <h1 class="screen__title home__title">Tiempos</h1>
    </header>
    <p class="screen__lead home__lead">
      Тренажёр спряжения испанских глаголов.
      <span v-if="days > 0" class="home__daily"><Icon name="flame" />{{ daysLabel(days) }} подряд</span>
    </p>

    <fieldset class="group home__answer">
      <legend class="group__legend home__answer-legend">Ответ</legend>
      <div class="segmented home__answer-switch" role="radiogroup" aria-label="Как отвечать">
        <button
          class="segmented__item home__answer-text"
          :class="{ 'segmented__item--active': settings.answer === 'text' }"
          type="button"
          role="radio"
          :aria-checked="settings.answer === 'text'"
          @click="settings.answer = 'text'"
        >
          <Icon name="keyboard" />Текст
        </button>
        <button
          class="segmented__item home__answer-oral"
          :class="{ 'segmented__item--active': settings.answer === 'oral' }"
          type="button"
          role="radio"
          :aria-checked="settings.answer === 'oral'"
          @click="settings.answer = 'oral'"
        >
          <Icon name="speech" />Устно
        </button>
      </div>
      <p class="group__note home__answer-note">
        {{
          settings.answer === 'oral'
            ? 'Скажите форму вслух, откройте ответ и отметьте себя.'
            : 'Впишите форму глагола в пропуск.'
        }}
      </p>
    </fieldset>

    <fieldset class="group home__mode">
      <legend class="group__legend home__mode-legend">Режим</legend>
      <div class="segmented home__mode-switch" role="radiogroup" aria-label="Режим">
        <button
          v-for="m in MODES"
          :key="m.mode"
          class="segmented__item home__mode-item"
          :class="{ 'segmented__item--active': settings.mode === m.mode }"
          type="button"
          role="radio"
          :aria-checked="settings.mode === m.mode"
          @click="settings.mode = m.mode"
        >
          {{ m.label }}
          <span
            v-if="m.mode === 'weak'"
            class="badge home__weak-count"
            :class="{ 'badge--hot': weak > 0 }"
          >{{ weak }}</span>
        </button>
      </div>
      <p class="group__note home__mode-note">{{ modeHint }}</p>
    </fieldset>

    <fieldset class="group home__filters">
      <legend class="group__legend home__filters-legend">Что тренируем</legend>
      <!-- вся карточка — одна кнопка в настройки -->
      <button class="home__filters-body" type="button" @click="emit('settings')">
        <span class="home__filter">
          <span class="home__filter-name">Времена</span>
          <span class="home__filter-value">{{ summary.tenses }}</span>
        </span>
        <span class="home__filter">
          <span class="home__filter-name">Лица</span>
          <span class="home__filter-value">{{ summary.persons }}</span>
        </span>
        <span class="home__filter">
          <span class="home__filter-name">Окончания</span>
          <span class="home__filter-value">{{ summary.groups }}</span>
        </span>
        <span class="home__filter">
          <span class="home__filter-name">Глаголы</span>
          <span class="home__filter-value">{{ summary.verbs }}</span>
        </span>
        <span class="home__filter">
          <span class="home__filter-name">Сессия</span>
          <span class="home__filter-value">{{ summary.size }}</span>
        </span>
        <span class="home__filters-edit">Изменить<Icon name="forward" /></span>
      </button>
    </fieldset>

    <p v-if="formsCount === 0" class="notice notice--muted home__no-forms">
      Под этот выбор нет форм — проверьте, что тренируем
      (и что в imperativo нет yo).
    </p>
    <p v-else-if="settings.mode === 'weak' && weak === 0" class="notice notice--muted home__weak-empty">
      Слабых форм в выбранном нет — начните с умной очереди.
    </p>
    <p v-if="error" class="notice notice--bad home__error">{{ error }}</p>

    <div class="screen__actions home__actions">
      <button class="button button--primary home__start" type="button" :disabled="!canStart" @click="start">
        Начать
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
/* ===== home: главная ===== */

.home__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.home__title {
  margin: 0;
}

.home__daily {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--ink);
}

.home__filters-body {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
}

.home__filter {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--line);
}

.home__filter-name {
  flex: none;
  color: var(--muted);
}

.home__filter-value {
  font-weight: var(--weight-semibold);
  text-align: right;
}

/* строка-действие внизу карточки, как в списках настроек iOS */
.home__filters-edit {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: var(--space-2) 0 var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--accent);
}

.home__filters-body:hover .home__filters-edit {
  color: var(--accent-hover);
}

/* «Начать» всегда видна — закреплена над панелью вкладок */
.home__actions {
  position: sticky;
  bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom));
  z-index: 2;
  margin: var(--space-2) calc(-1 * var(--space-4)) 0;
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(to top, var(--bg) 70%, transparent);
}

.home__start {
  flex: 1 1 100%;
}
</style>
