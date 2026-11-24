<script setup lang="ts">
import { computed } from 'vue'
import { articleCount } from '../lib/articles/cards'
import { pluralRu } from '../lib/plural'
import type { PoolHint } from '../lib/poolOverview'
import { poolOverview } from '../lib/poolOverview'
import { cellsForConfig } from '../lib/session'
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

const TITLES: Record<Track, { title: string; lead: string }> = {
  verbs: { title: 'Глаголы', lead: 'Тренажёр спряжения испанских глаголов.' },
  articles: {
    title: 'Артикли',
    lead: 'el, un или Ø: предложения из двух учебников, ответы — по их ключам.',
  },
  book: { title: 'Учебник', lead: 'Упражнения по главам учебника.' },
}

const head = computed(() => TITLES[settings.track])

const config = computed(() => configFromSettings(settings))

const bookConfig = computed(() => bookConfigFromSettings(settings))

const articleConfig = computed(() => articleConfigFromSettings(settings))

/** Сколько заданий под выбор (у глаголов 0, например, если только yo и только imperativo). */
const formsCount = computed(() => {
  if (settings.track === 'book') return bookConfig.value.units.length
  if (settings.track === 'articles') return articleCount(articleConfig.value.rules)
  const cfg = config.value
  if (cfg.tenses.length === 0 || cfg.persons.length === 0 || cfg.groups.length === 0) return 0
  return cellsForConfig(cfg).length
})

const canStart = computed(() => formsCount.value > 0)

/** Состав умной сессии глаголов: что в ней будет и не пора ли расширить выбор. */
const pool = computed(() =>
  settings.track === 'verbs' && settings.mode === 'smart' && formsCount.value > 0
    ? poolOverview(config.value)
    : null,
)

const poolItems = computed(() => {
  const p = pool.value
  if (!p) return []
  const items: { key: string; label: string; value: string }[] = []
  if (p.current) {
    const need = p.current.need
    items.push({
      key: 'new',
      label: 'Изучается',
      value: `${p.current.label} — ещё ${need} ${pluralRu(need, 'верный', 'верных', 'верных')}`,
    })
  }
  if (p.tables > 0) items.push({ key: 'tables', label: 'Доводка «Таблиц»', value: `${p.tables} ${pluralRu(p.tables, 'клетка', 'клетки', 'клеток')}` })
  if (p.weak > 0) items.push({ key: 'weak', label: 'Ошибки', value: `${p.weak} ${pluralRu(p.weak, 'форма', 'формы', 'форм')}` })
  if (p.slow > 0) items.push({ key: 'slow', label: 'Медленные', value: `${p.slow} ${pluralRu(p.slow, 'группа', 'группы', 'групп')}` })
  if (p.cold > 0) items.push({ key: 'cold', label: 'Остывшие', value: `${p.cold} ${pluralRu(p.cold, 'группа', 'группы', 'групп')}` })
  return items
})

function hintText(hint: PoolHint, forms: number): string {
  switch (hint) {
    case 'nothing':
      return 'Всё в выборе освоено и свежее — сессия будет только повторением. Чтобы учить дальше, добавьте время или глаголы.'
    case 'no-new':
      return 'Нового в выборе не осталось — будут доводка и повторение. Чтобы учить новое, добавьте время или глаголы.'
    case 'thin':
      return `В выборе всего ${forms} ${pluralRu(forms, 'форма', 'формы', 'форм')} — они будут часто повторяться.`
    case 'new-waits':
      return 'Новое подождёт, пока медленные группы не разгонятся.'
  }
}

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
    <section v-if="pool" class="home__pool" aria-label="Что будет в сессии">
      <p class="home__pool-title">
        В выборе {{ pool.forms }} {{ pluralRu(pool.forms, 'форма', 'формы', 'форм') }}
      </p>
      <dl v-if="poolItems.length > 0" class="home__pool-list">
        <div v-for="item in poolItems" :key="item.key" class="home__pool-item" :class="`home__pool-item--${item.key}`">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
      <p
        v-for="hint in pool.hints"
        :key="hint"
        class="notice home__pool-hint"
        :class="[`home__pool-hint--${hint}`, hint === 'new-waits' ? 'notice--muted' : 'notice--almost']"
      >
        {{ hintText(hint, pool.forms) }}
      </p>
    </section>
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

.home__pool {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.home__pool-title {
  margin: 0;
  font-weight: 600;
}

.home__pool-list {
  display: grid;
  gap: var(--space-1);
  margin: 0;
}

.home__pool-item {
  display: flex;
  gap: var(--space-2);
  justify-content: space-between;

  dt {
    color: var(--muted);
  }

  dd {
    margin: 0;
    text-align: right;
  }
}

.home__pool-hint {
  margin: 0;
}

.home__start {
  flex: 1 1 100%;
}
</style>
