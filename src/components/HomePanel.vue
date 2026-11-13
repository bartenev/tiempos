<script setup lang="ts">
import { computed } from 'vue'
import { articleCount, articleWeakCount } from '../lib/articles/cards'
import { bookWeakCount } from '../lib/book'
import { cellsForConfig, weakCount } from '../lib/session'
import { articleConfigFromSettings, bookConfigFromSettings, configFromSettings } from '../lib/settings'
import { settings } from '../lib/settingsState'
import type { ArticleConfig, BookConfig, SessionConfig, Track } from '../types'
import ArticlePicker from './ArticlePicker.vue'
import BookPicker from './BookPicker.vue'
import Icon from './Icon.vue'
import VerbPicker from './VerbPicker.vue'

defineProps<{
  error?: string
}>()

const emit = defineEmits<{
  start: [config: SessionConfig]
  'start-book': [config: BookConfig]
  'start-articles': [config: ArticleConfig]
  /** Назад к списку тренажёров. */
  back: []
}>()

const TITLES: Record<Track, { title: string; lead: string; unit: string }> = {
  verbs: { title: 'Глаголы', lead: 'Тренажёр спряжения испанских глаголов.', unit: 'форм' },
  articles: {
    title: 'Артикли',
    lead: 'el, un или Ø: предложения из двух учебников, ответы — по их ключам.',
    unit: 'заданий',
  },
  book: { title: 'Учебник', lead: 'Упражнения по главам учебника.', unit: 'упражнений' },
}

const head = computed(() => TITLES[settings.track])

const config = computed(() => configFromSettings(settings))

const bookConfig = computed(() => bookConfigFromSettings(settings))

const articleConfig = computed(() => articleConfigFromSettings(settings))

const weak = computed(() => {
  if (settings.track === 'book') return bookWeakCount(bookConfig.value.units)
  if (settings.track === 'articles') return articleWeakCount(articleConfig.value.rules)
  return weakCount(config.value)
})

/** Сколько заданий под выбор (у глаголов 0, например, если только yo и только imperativo). */
const formsCount = computed(() => {
  if (settings.track === 'book') return bookConfig.value.units.length
  if (settings.track === 'articles') return articleCount(articleConfig.value.rules)
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
  if (settings.track === 'book') emit('start-book', bookConfig.value)
  else if (settings.track === 'articles') emit('start-articles', articleConfig.value)
  else emit('start', config.value)
}
</script>

<template>
  <section class="home" :class="`home--${settings.track}`">
    <button class="button button--ghost button--small home__back" type="button" @click="emit('back')">
      <Icon name="back" />Тренажёры
    </button>
    <h1 class="screen__title home__title">{{ head.title }}</h1>
    <p class="screen__lead home__lead">{{ head.lead }}</p>

    <BookPicker v-if="settings.track === 'book'" />
    <ArticlePicker v-else-if="settings.track === 'articles'" />
    <VerbPicker v-else />

    <p v-if="formsCount === 0 && settings.track === 'book'" class="notice notice--muted home__no-chapters">
      Выберите хотя бы одну главу.
    </p>
    <p v-else-if="formsCount === 0 && settings.track === 'articles'" class="notice notice--muted home__no-rules">
      Выберите хотя бы одно правило.
    </p>
    <p v-else-if="formsCount === 0" class="notice notice--muted home__no-forms">
      Под этот выбор нет форм — проверьте времена, лица и окончания
      (в imperativo нет yo).
    </p>
    <p v-else-if="settings.mode === 'weak' && weak === 0" class="notice notice--muted home__weak-empty">
      Слабых {{ head.unit }} в выбранном нет — выберите другой режим в настройках.
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
/* ===== home: главная тренажёра ===== */

.home__back {
  margin-bottom: var(--space-4);
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
