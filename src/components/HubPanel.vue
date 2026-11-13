<script setup lang="ts">
import { computed } from 'vue'
import { CHAPTERS } from '../data/book'
import { ARTICLE_ITEMS } from '../data/articles'
import { chapterProgress, chapterSize } from '../lib/book'
import { pluralRu } from '../lib/plural'
import { settings } from '../lib/settingsState'
import type { StatsStore } from '../lib/stats'
import { loadBookStats, loadDeckStats, loadStats, masteryOf } from '../lib/stats'
import type { Track } from '../types'
import Icon from './Icon.vue'

const emit = defineEmits<{
  open: [track: Track]
}>()

/** Версия приложения — мелко внизу (повышать по правилам из README). */
const version = __APP_VERSION__

/** «выучено 12 из 527 · слабых 3»; без ответов — «ещё не начинали». */
function progressLine(keys: string[] | null, stats: StatsStore, total?: number): string {
  const counted = keys ?? Object.keys(stats)
  let solid = 0
  let weak = 0
  let seen = 0
  for (const key of counted) {
    const m = masteryOf(stats[key])
    if (m === 'new') continue
    seen += 1
    if (m === 'solid') solid += 1
    if (m === 'weak') weak += 1
  }
  if (seen === 0) return 'ещё не начинали'
  const learned = total === undefined ? `выучено ${solid} ${pluralRu(solid, 'форма', 'формы', 'форм')}` : `выучено ${solid} из ${total}`
  return weak > 0 ? `${learned} · слабых ${weak}` : learned
}

function bookLine(): string {
  const stats = loadBookStats()
  const total = CHAPTERS.reduce((sum, c) => sum + chapterSize(c), 0)
  let solid = 0
  let weak = 0
  let seen = 0
  for (const chapter of CHAPTERS) {
    const counts = chapterProgress(chapter, stats)
    solid += counts.solid
    weak += counts.weak
    seen += chapterSize(chapter) - counts.new
  }
  if (seen === 0) return 'ещё не начинали'
  return weak > 0 ? `выучено ${solid} из ${total} · слабых ${weak}` : `выучено ${solid} из ${total}`
}

const trainers = computed(() => {
  const list: { track: Track; title: string; lead: string; progress: string }[] = [
    {
      track: 'verbs',
      title: 'Глаголы',
      lead: 'Спряжение: presente, indefinido, imperfecto, perfecto, imperativo',
      progress: progressLine(null, loadStats()),
    },
    {
      track: 'articles',
      title: 'Артикли',
      lead: 'el, un или Ø — упражнения двух учебников с ключами',
      progress: progressLine(
        ARTICLE_ITEMS.map((i) => i.id),
        loadDeckStats('articles'),
        ARTICLE_ITEMS.length,
      ),
    },
  ]
  if (settings.labs.book) {
    list.push({ track: 'book', title: 'Учебник', lead: 'Местоимения по главам Gramática de uso', progress: bookLine() })
  }
  return list
})
</script>

<template>
  <section class="hub">
    <h1 class="screen__title hub__title">Tiempos</h1>
    <p class="screen__lead hub__lead">Что тренируем?</p>

    <ul class="hub__list">
      <li v-for="t in trainers" :key="t.track" class="hub__item">
        <button class="hub__trainer" :class="`hub__trainer--${t.track}`" type="button" @click="emit('open', t.track)">
          <span class="hub__trainer-text">
            <span class="hub__trainer-title">{{ t.title }}</span>
            <span class="hub__trainer-lead">{{ t.lead }}</span>
            <span class="hub__trainer-progress">{{ t.progress }}</span>
          </span>
          <Icon class="hub__trainer-chevron" name="forward" />
        </button>
      </li>
    </ul>

    <p class="hub__version">версия {{ version }}</p>
  </section>
</template>

<style scoped lang="scss">
/* ===== hub: список тренажёров ===== */

.hub__list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.hub__trainer {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--card);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.hub__trainer:hover {
  border-color: var(--accent);
}

.hub__trainer-text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.hub__trainer-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}

.hub__trainer-lead {
  font-size: var(--text-sm);
  line-height: 1.4;
  color: var(--muted);
}

.hub__trainer-progress {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--accent);
}

.hub__trainer-chevron {
  flex: none;
  color: var(--muted);
}

.hub__trainer:hover .hub__trainer-chevron {
  color: var(--accent);
}

.hub__version {
  margin: var(--space-6) 0 0;
  text-align: center;
  font-size: var(--text-xs);
  color: var(--muted);
  opacity: 0.7;
}
</style>
