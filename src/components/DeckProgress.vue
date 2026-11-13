<script setup lang="ts">
import { computed } from 'vue'
import { ARTICLE_ITEMS } from '../data/articles'
import { CHAPTERS } from '../data/book'
import { topicProgress } from '../lib/articles/cards'
import { ARTICLE_TOPICS } from '../lib/articles/topics'
import { chapterProgress, chapterSize, itemKey } from '../lib/book'
import type { Mastery } from '../lib/stats'
import { loadDeckStats, masteryOf } from '../lib/stats'
import type { Deck } from '../types'

const props = defineProps<{
  deck: Deck
}>()

const emit = defineEmits<{
  'train-weak': []
}>()

const stats = loadDeckStats(props.deck)

const MASTERY_LABELS: Record<Mastery, string> = {
  solid: 'выучено',
  learning: 'учу',
  weak: 'слабое',
  new: 'не встречалось',
}

const SEGMENTS: Mastery[] = ['solid', 'learning', 'weak']

/** Строки списка: главы учебника или темы артиклей. */
const rows: { key: string; number?: number; name: string; total: number; counts: Record<Mastery, number> }[] =
  props.deck === 'book'
    ? CHAPTERS.map((chapter) => ({
        key: String(chapter.unit),
        number: chapter.unit,
        name: chapter.ru,
        total: chapterSize(chapter),
        counts: chapterProgress(chapter, stats),
      }))
    : ARTICLE_TOPICS.map((t) => ({ key: t.topic, name: t.label, ...topicProgress(t.topic, stats) }))

/** Все задания колоды — по ним итоги (темы артиклей пересекаются, их не складываем). */
const keys: string[] =
  props.deck === 'book'
    ? CHAPTERS.flatMap((c) => c.sets.flatMap((set) => set.items.map((_, i) => itemKey(set, i))))
    : ARTICLE_ITEMS.map((i) => i.id)

const totals = computed(() => {
  const counts: Record<Mastery, number> = { new: 0, weak: 0, learning: 0, solid: 0 }
  for (const key of keys) counts[masteryOf(stats[key])] += 1
  let ok = 0
  let bad = 0
  for (const stat of Object.values(stats)) {
    ok += stat.ok
    bad += stat.bad
  }
  const answered = ok + bad
  return {
    answered,
    accuracy: answered === 0 ? null : Math.round((ok / answered) * 100),
    counts,
    total: keys.length,
  }
})
</script>

<template>
  <section class="deck-progress">
    <h1 class="screen__title deck-progress__title">Прогресс</h1>

    <div class="stat-tiles deck-progress__tiles">
      <div class="stat-tiles__item deck-progress__answered">
        <b class="stat-tiles__value deck-progress__answered-value">{{ totals.answered }}</b>
        <span class="stat-tiles__label deck-progress__answered-label">ответов</span>
      </div>
      <div class="stat-tiles__item deck-progress__accuracy">
        <b class="stat-tiles__value deck-progress__accuracy-value">{{ totals.accuracy === null ? '—' : `${totals.accuracy}%` }}</b>
        <span class="stat-tiles__label deck-progress__accuracy-label">точность</span>
      </div>
      <div class="stat-tiles__item deck-progress__solid">
        <b class="stat-tiles__value deck-progress__solid-value">{{ totals.counts.solid }}</b>
        <span class="stat-tiles__label deck-progress__solid-label">выучено из {{ totals.total }}</span>
      </div>
    </div>

    <div class="screen__actions deck-progress__actions">
      <button
        class="button button--primary deck-progress__train"
        type="button"
        :disabled="totals.counts.weak === 0"
        @click="emit('train-weak')"
      >
        Тренировать слабые
        <span class="badge deck-progress__weak-count" :class="{ 'badge--hot': totals.counts.weak > 0 }">{{ totals.counts.weak }}</span>
      </button>
    </div>

    <h2 class="screen__section-title deck-progress__chapters-title">{{ deck === 'book' ? 'Главы' : 'Темы' }}</h2>
    <p class="deck-progress__legend">
      <span v-for="m in SEGMENTS" :key="m" class="deck-progress__legend-item">
        <span class="deck-progress__dot" :class="`deck-progress__dot--${m}`" /> {{ MASTERY_LABELS[m] }}
      </span>
    </p>
    <ul class="deck-progress__list">
      <li v-for="{ key, number, name, total, counts } in rows" :key="key" class="deck-progress__row">
        <span class="deck-progress__name">
          <b v-if="number" class="deck-progress__number">{{ number }}</b>
          {{ name }}
        </span>
        <span class="deck-progress__bar" role="img" :aria-label="`${name}: выучено ${counts.solid} из ${total}`">
          <span
            v-for="m in SEGMENTS"
            :key="m"
            class="deck-progress__segment"
            :class="`deck-progress__segment--${m}`"
            :style="{ width: `${(counts[m] / total) * 100}%` }"
          />
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
/* ===== deck-progress: прогресс колоды упражнений — по главам учебника или темам артиклей ===== */

.deck-progress__train {
  flex: 1 1 100%;
  gap: var(--space-2);
}

.deck-progress__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-3);
  margin: 0 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--muted);
}

.deck-progress__legend-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.deck-progress__dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: var(--radius-pill);
}

.deck-progress__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.deck-progress__row {
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--line);
}

.deck-progress__row:last-child {
  border-bottom: none;
}

.deck-progress__name {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--text-sm);
}

.deck-progress__number {
  font-variant-numeric: tabular-nums;
}

.deck-progress__bar {
  display: flex;
  height: 6px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--m-new);
}

.deck-progress__dot--solid,
.deck-progress__segment--solid {
  background: var(--m-solid);
}

.deck-progress__dot--learning,
.deck-progress__segment--learning {
  background: var(--m-learning);
}

.deck-progress__dot--weak,
.deck-progress__segment--weak {
  background: var(--m-weak);
}
</style>
