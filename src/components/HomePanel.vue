<script setup lang="ts">
import { computed } from 'vue'
import { bookWeakCount } from '../lib/book'
import { cellsForConfig, weakCount } from '../lib/session'
import { bookConfigFromSettings, configFromSettings } from '../lib/settings'
import { settings } from '../lib/settingsState'
import type { BookConfig, SessionConfig, Track } from '../types'
import BookPicker from './BookPicker.vue'
import Icon from './Icon.vue'
import VerbPicker from './VerbPicker.vue'

defineProps<{
  error?: string
}>()

const emit = defineEmits<{
  start: [config: SessionConfig]
  'start-book': [config: BookConfig]
}>()

const TRACKS: { track: Track; label: string }[] = [
  { track: 'verbs', label: 'Глаголы' },
  { track: 'book', label: 'Учебник' },
]

/** Версия приложения — мелко внизу главной (повышать по правилам из README). */
const version = __APP_VERSION__

/** Тренажёр артиклей — статическая страница из public/articulos (собрана в проекте espanol). */
const articlesUrl = `${import.meta.env.BASE_URL}articulos/`

const isBook = computed(() => settings.track === 'book')

const config = computed(() => configFromSettings(settings))

const bookConfig = computed(() => bookConfigFromSettings(settings))

const weak = computed(() =>
  isBook.value ? bookWeakCount(bookConfig.value.units) : weakCount(config.value),
)

/** Сколько форм под фильтр (0, например, если только yo и только imperativo). */
const formsCount = computed(() => {
  if (isBook.value) return bookConfig.value.units.length
  const cfg = config.value
  if (cfg.tenses.length === 0 || cfg.persons.length === 0 || cfg.groups.length === 0) return 0
  return cellsForConfig(cfg).length
})

const canStart = computed(() => {
  if (formsCount.value === 0) return false
  if (settings.mode === 'weak' && weak.value === 0) return false
  return true
})

function start() {
  if (!canStart.value) return
  if (isBook.value) emit('start-book', bookConfig.value)
  else emit('start', config.value)
}
</script>

<template>
  <section class="home">
    <header class="home__header">
      <h1 class="screen__title home__title">Tiempos</h1>
      <!-- отдельная статическая страница из public/articulos: тренажёр и схема артиклей -->
      <a v-if="settings.labs.articles" class="home__articles" :href="articlesUrl">Артикли<Icon name="forward" /></a>
    </header>
    <p class="screen__lead home__lead">
      {{ isBook ? 'Упражнения по главам учебника.' : 'Тренажёр спряжения испанских глаголов.' }}
    </p>

    <!-- Учебник — в «Лаборатории» настроек; выключен — тренируем только глаголы. -->
    <div v-if="settings.labs.book" class="segmented home__track" role="radiogroup" aria-label="Что тренируем">
      <button
        v-for="t in TRACKS"
        :key="t.track"
        class="segmented__item home__track-item"
        :class="{ 'segmented__item--active': settings.track === t.track }"
        type="button"
        role="radio"
        :aria-checked="settings.track === t.track"
        @click="settings.track = t.track"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- что тренируем — прямо на главной; общие настройки (режим, ответ…) — во вкладке «Настройки» -->
    <BookPicker v-if="isBook" />
    <VerbPicker v-else />

    <p v-if="formsCount === 0 && isBook" class="notice notice--muted home__no-chapters">
      Выберите хотя бы одну главу.
    </p>
    <p v-else-if="formsCount === 0" class="notice notice--muted home__no-forms">
      Под этот выбор нет форм — проверьте времена, лица и окончания
      (в imperativo нет yo).
    </p>
    <p v-else-if="settings.mode === 'weak' && weak === 0" class="notice notice--muted home__weak-empty">
      Слабых {{ isBook ? 'упражнений' : 'форм' }} в выбранном нет — выберите другой режим в настройках.
    </p>
    <p v-if="error" class="notice notice--bad home__error">{{ error }}</p>

    <div class="screen__actions home__actions">
      <button class="button button--primary home__start" type="button" :disabled="!canStart" @click="start">
        Начать
      </button>
    </div>

    <p class="home__version">версия {{ version }}</p>
  </section>
</template>

<style scoped lang="scss">
/* ===== home: главная ===== */

.home__version {
  margin: var(--space-2) 0 0;
  text-align: center;
  font-size: var(--text-xs);
  color: var(--muted);
  opacity: 0.7;
}

.home__track {
  margin-bottom: var(--space-4);
}

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

.home__articles {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--space-1);
  min-height: var(--tap);
  padding: 0 var(--space-3) 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--card);
  color: var(--accent);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  text-decoration: none;
}

.home__articles:hover {
  border-color: var(--accent);
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
